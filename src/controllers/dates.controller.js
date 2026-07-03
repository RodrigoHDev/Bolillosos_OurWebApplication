const { response } = require("express");
const fs = require("fs");
const { request } = require("http");
const path = require("path");
const supabase = require ('../utils/supabase'); 
const { formatAppointmentDateTime } = require("../utils/appointmentFormat");
const { buildIcsContent } = require("../utils/icsBuilder");
const { sendAppointmentEmail } = require("../utils/resend");
const appointmentEmail = require("../utils/template"); // tu template


//------------------------------------------------------


exports.getAcceptDate = (request, response, next) => {
    let images = [];
    
    const galleryFolder = path.join(
        __dirname,
        "../public/images/gallery"
    );
    
    try {
        images = fs.readdirSync(galleryFolder)
            .filter(file =>
                /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
            .sort()
            .map(file => `/images/gallery/${file}`);
    } catch(err){
        console.error(err);
        request.session.error = 'Las imagenes no pudieron ser cargadas. Contactame preciosa.';
        return response.redirect('/');
    }

    response.render("pages/dates",{
        title: "Cita? ♡",
        images,
        currentStep: 1
    });
};


//------------------------------------------------------


exports.getCategoryPage = async (request,response,next)=>{
    const { data: categories, error} = await supabase
        .from("category")
        .select("name, image");

    if (error) {
        console.error(error);
        return response.status(500).send("Error loading categories");
        request.session.error = 'Las categorias no pudieron ser cargadas de base de datos.\n Contactame preciosa.';
        return response.redirect('/date/accept');
    }

    response.render("pages/category", {
        categories,
        title: '✦ Categoría',
        currentStep: 2
    });
}

//------------------------------------------------------

exports.getTopicsByCategory = async (request, response, next) => {
    const { category } = request.query;

    if (!category) {
        return response.status(400).json({ error: "category es requerido" });
        request.session.error = 'Se requiere de una categoria.\n Contactame preciosa.';
        return response.redirect('/date/category');
    }

    const { data: categoryRow, error: categoryError } = await supabase
        .from("category")
        .select("id")
        .eq("name", category)
        .single();

    if (categoryError || !categoryRow) {
        return response.status(404).json({ error: "Categoría no encontrada" });
        request.session.error = 'Categoria no encontrada';
        return response.redirect('/date/category');
    }

    const { data: topics, error: topicsError } = await supabase
        .from("options")
        .select("name, id")
        .eq("category_id", categoryRow.id);

    if (topicsError) {
        console.error(topicsError);
        return response.status(500).json({ error: "Error cargando actividades" });
        request.session.error = 'Error cargando actividades';
        return response.redirect('/date/category');
    }

    response.json({ topics });
};

//------------------------------------------------------

exports.getDatesPage = async (request, response, next) => {
    const { category, activity } = request.query;
    const today = new Date().toISOString();

    console.log(activity);
    console.log(category);

    const { data: dates, error: datesError } = await supabase
        .from("dates")
        .select("start_date, end_date, option_id, created_by")
        .gte("end_date", today);
    
    if (datesError) {
        console.log(datesError);
        request.session.error = 'Citas anteriores no pudieron ser obtenidas';
        return response.redirect('/date/category');
    }

    const { data: topicData, error: topicError } = await supabase
        .from("options")
        .select("id")
        .eq("id", activity)   
        .single();

    if (topicError || !topicData) {
        console.log(topicError)
        request.session.error = 'La actividad seleccionada no fue encontrada';
        return response.redirect('/date/category');
    }

    response.render('pages/date', {
        title: '✦ Fecha y Hora',
        dates,
        category,
        activity,
        activityId: activity,
        csrfToken: request.csrfToken(),
        currentStep: 3
    });
};

//------------------------------------------------------

exports.finishDate = async (request, response, next) => {
    const { activityId, startDate, endDate } = request.body;
    const user_id = request.session.user.id;

    // 1. Guardar la cita
    const { data, error } = await supabase
        .from("dates")
        .insert({
            start_date: startDate,
            end_date: endDate,
            option_id: activityId,
            created_by: user_id
        })
        .select();

    if (error) {
        return response.status(500).json({ success: false, error: "La cita no pudo guardarse correctamente" });
    }

    // 2. Obtener destinatarios
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('username, display_name, email');

    if (profilesError) {
        return response.status(500).json({ success: false, error: "Nuestra información no pudo obtenerse correctamente." });
    }

    // 3. Obtener nombre de la actividad + categoría (para la descripción)
    const { data: activityData } = await supabase
        .from("options")
        .select("name, category_id")
        .eq("id", activityId)
        .single();

    let categoryName = "";
    if (activityData?.category_id) {
        const { data: categoryData } = await supabase
            .from("category")
            .select("name")
            .eq("id", activityData.category_id)
            .single();
        categoryName = categoryData?.name || "";
    }

    const activityName = activityData?.name || "Actividad sorpresa";
    const description = categoryName ? `${categoryName} — ${activityName}` : activityName;

    // 4. Obtener nombre del organizador (quien agendó)
    const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user_id)
        .single();
    const creatorName = creatorProfile?.display_name || "Alguien especial";

    // 5. Formatear fecha/hora para mostrar
    const { dateText, timeText, isRange } = formatAppointmentDateTime(startDate, endDate);

    // 6. Construir el .ics
    const icsContent = buildIcsContent({
        summary: `Cita: ${activityName}`,
        description,
        startIso: startDate,
        endIso: endDate,
        isRange
    });

    const icsAttachment = {
        filename: "cita.ics",
        content: Buffer.from(icsContent).toString("base64")
    };

    // 7. Enviar un correo a cada perfil (en paralelo, sin bloquear si uno falla)
    const emailResults = await Promise.allSettled(
        profiles.map(profile => {
            const html = appointmentEmail({
                display_name: profile.display_name || profile.username,
                date: dateText,
                time: timeText,
                description,
                creator: creatorName
            });

            return sendAppointmentEmail(
                profile.email,
                "¡Nuestra cita está confirmada! ✨",
                html,
                [icsAttachment]
            );
        })
    );

    const failedEmails = emailResults.filter(r => r.status === "rejected");
    if (failedEmails.length > 0) {
        console.error("Algunos correos no pudieron enviarse:", failedEmails);
        // No se aborta la respuesta — la cita YA quedó guardada, el correo es secundario
    }

    return response.status(200).json({ success: true });
};