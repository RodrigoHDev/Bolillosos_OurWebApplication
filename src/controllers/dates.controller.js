/*
Title: dates.controller.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Controller of the dates section of the application.
Render of the pages that form part of the Dates Module.
*/

//Import of used resources.
const { response } = require("express");
const fs = require("fs");
const { request } = require("http");
const path = require("path");
const supabase = require ('../utils/webServices/supabase/supabase'); 
const { formatAppointmentDateTime } = require("../utils/webServices/resend/appointmentFormat");
const { buildIcsContent } = require("../utils/webServices/resend/icsBuilder");
const { sendAppointmentEmail } = require("../utils/webServices/resend/resend");
const appointmentEmail = require("../utils/webServices/resend/template"); // tu template


/* AUXILIAR FUNCTIONS */

/*getGalleryImages
Auxiliar function responsible for obtaining all file names of a given direction and
store them into an array*/

function getGalleryImages(folderPath, urlPrefix) {
    return fs.readdirSync(folderPath)
        .filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
        .sort() //Not required
        .map(file => `${urlPrefix}/${file}`);
}



//------------------------------------------------------

/*getAcceptDate
Render of the invitation and letter page.*/

exports.getAcceptDate = (request, response, next) => {

    //=========================
    /* Obtention of all available images in the gallery folder
    Usage of the auxiliar function getGalleryImages*/
    let images = [];
    
    try{
        images = getGalleryImages(
            path.join(__dirname,"../public/images/gallery"),
            '/images/gallery');    
    } catch(error){
        console.error(error);
        request.session.error = 'Las imagenes no pudieron ser cargadas. Contactame preciosa.';
        return response.redirect('/');
    }
    //=========================
    /*Render of the dates page*/
    response.render("pages/dates",{
        title: "Cita? ♡",
        images,
        currentStep: 1
    });
};


//------------------------------------------------------

/*getCategoryPage
Function responsible for rendering the actual categories stored in Supabase
and gather then into an object to be used for the slots mechanism.
*/

exports.getCategoryPage = async (request,response,next)=>{
    //=========================
    /*Call and obtain categories information [Supabase]*/
    const { data: categories, error} = await supabase
        .from("category")
        .select("name, image");

    //Supabase Error Handling
    if (error) {
        console.error(error);
        return response.status(500).send("Error loading categories");
        request.session.error = 'Las categorias no pudieron ser cargadas de base de datos.\n Contactame preciosa.';
        return response.redirect('/date/accept');
    }
    //=========================
    /*Render of the category page*/
    response.render("pages/category", {
        categories,
        title: '✦ Categoría',
        currentStep: 2
    });
}

//------------------------------------------------------

/*getTopicsByCategory
AJAX response to return activities of a given category*/

exports.getTopicsByCategory = async (request, response, next) => {
    //Obtention of the given category
    const { category } = request.query;

    if (!category) {
        return response.status(400).json({ error: "category es requerido" });
        request.session.error = 'Se requiere de una categoria.\n Contactame preciosa.';
        return response.redirect('/date/category');
    }

    //=========================
    /*Call and obtain the id of a given category [Supabase]*/
    const { data: categoryRow, error: categoryError } = await supabase
        .from("category")
        .select("id")
        .eq("name", category)
        .single();

    //Supabase Error Handling
    if (categoryError || !categoryRow) {
        return response.status(404).json({ error: "Categoría no encontrada" });
        request.session.error = 'Categoria no encontrada';
        return response.redirect('/date/category');
    }
    //=========================

    //=========================
    /*Call and obtain the activities of a given category based on its id [Supabase]*/
    const { data: topics, error: topicsError } = await supabase
        .from("options")
        .select("name, id")
        .eq("category_id", categoryRow.id);

    //Supabase Error Handling
    if (topicsError) {
        console.error(topicsError);
        return response.status(500).json({ error: "Error cargando actividades" });
        request.session.error = 'Error cargando actividades';
        return response.redirect('/date/category');
    }
    //=========================

    //Return the topics objects
    response.json({ topics });
};

//------------------------------------------------------

/*getDatesPage
Function responsible for the render of the date pages*/

exports.getDatesPage = async (request, response, next) => {
    //Obtention of the category and activity sent by URL
    const { category, activity } = request.query;

    //Obtain today's date
    const today = new Date().toISOString();

    //=========================
    /*Call and obtain the dates of any date stored which end date is greater or equal than today [Supabase]*/
    const { data: dates, error: datesError } = await supabase
        .from("dates")
        .select("start_date, end_date, option_id, created_by")
        .gte("end_date", today);
    
    //Supabase Error Handling
        if (datesError) {
        console.log(datesError);
        request.session.error = 'Citas anteriores no pudieron ser obtenidas';
        return response.redirect('/date/category');
    }
    //=========================

    //=========================
    /*Call and obtain the name of a given activity based on its id [Supabase]*/
    const { data: topicData, error: topicError } = await supabase
        .from("options")
        .select("id")
        .eq("id", activity)   
        .single();

    //Supabase Error Handling
    if (topicError || !topicData) {
        console.log(topicError)
        request.session.error = 'La actividad seleccionada no fue encontrada';
        return response.redirect('/date/category');
    }
    //=========================

    //Render of the date pages
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

/*finishDate
Function responsible for gathering every information from the given 
form in the date page and process it before triggering the conclusion
modal*/

exports.finishDate = async (request, response, next) => {
    //Stored variables in hidden form
    const { activityId, startDate, endDate } = request.body;
    const user_id = request.session.user.id;

    //=========================
    /*Insertion of a date into the dates table [Supabase]*/
    const { data, error } = await supabase
        .from("dates")
        .insert({
            start_date: startDate,
            end_date: endDate,
            option_id: activityId,
            created_by: user_id
        })
        .select();

    //Supabase Error Handling
    if (error) {
        return response.status(500).json({ success: false, error: "La cita no pudo guardarse correctamente" });
    }
    //=========================


    //=========================
    /*Obtention of all given profiles in the application (Only Partner and I) [Supabase]*/
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('username, display_name, email');

    //Supabase Error Handling
    if (profilesError) {
        return response.status(500).json({ success: false, error: "Nuestra información no pudo obtenerse correctamente." });
    }
    //=========================
    

    //=========================
    /*Obtention of the activity name based on ID [Supabase]*/
    const { data: activityData } = await supabase
        .from("options")
        .select("name, category_id")
        .eq("id", activityId)
        .single();
    
    //=========================

    let categoryName = "";

    //=========================
    /*Obtention of the category name based on id [Supabase]*/
    if (activityData?.category_id) {
        const { data: categoryData } = await supabase
            .from("category")
            .select("name")
            .eq("id", activityData.category_id)
            .single();
        categoryName = categoryData?.name || "";
    }
    //=========================

    const activityName = activityData?.name || "Actividad sorpresa";
    const description = categoryName ? `${categoryName} — ${activityName}` : activityName;

    //=========================
    /*Obtention of the Display Name of the Date Creator [Supabase]*/
    const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user_id)
        .single();
    
    //=========================

    const creatorName = creatorProfile?.display_name || "Alguien especial";
    // Give format to given date and time
    const { dateText, timeText, isRange } = formatAppointmentDateTime(startDate, endDate);

    //=========================
    /*Usage of the functions icsContent and icsAttachment
    created in Utils*/

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
    //=========================

    //=========================
    /*Usage of the sendAppointmentEmail function per each given profile account*/
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
    }

    //=========================
    //Return AJAX response
    return response.status(200).json({ success: true });
};