/*
Title: home.controller.js
Author: R. Hurtado
Date: 09/26/2026
Description:
Controller of the home page of the application (main page after login).
The current file joins the traditional controller + model
functions as the database calls (Supabase) are performed here.
*/

//Import of used resources.
const supabase = require('../utils/webServices/supabase/supabase');
const { getHomePhotoUrl, uploadHomePhoto } = require("../utils/webServices/supabase/storage");


//------------------------------------------------------

/*getHomePage
Function responsible for rendering the home page with the anniversary photo
and the future dates shown in the calendar*/

exports.getHomePage = async (request, response, next) => {
    //Obtain today's date
    const today = new Date().toISOString();

    //=========================
    /*Call and obtain the future dates with their activity and category [Supabase]
    dates.option_id → options.id → options.category_id → category.id*/
    const { data: upcomingRows, error: upcomingError } = await supabase
        .from("dates")
        .select("start_date, end_date, options(name, category(name))")
        .gte("end_date", today)
        .order("start_date", { ascending: true });

    //Supabase Error Handling
    if (upcomingError) {
        console.error(upcomingError);
        response.locals.error = 'Las citas futuras no pudieron ser cargadas.';
    }
    //=========================

    //Simplified object used by the calendar
    const upcomingDates = (upcomingRows || []).map(row => ({
        start: row.start_date,
        end: row.end_date,
        activity: row.options?.name || "Actividad sorpresa",
        category: row.options?.category?.name || ""
    }));

    //=========================
    /*Obtention of the anniversary photo [Supabase Storage]*/
    let photoUrl = null;

    try {
        photoUrl = await getHomePhotoUrl();
    } catch (error) {
        console.error(error);
    }
    //=========================

    //Render of the home page
    response.render('pages/home', {
        title: 'Bolillosos ✦ Inicio',
        upcomingDates,
        photoUrl,
        csrfToken: request.csrfToken()
    });
};

//------------------------------------------------------

/*uploadPhoto
AJAX response to upload (or change) the anniversary photo of the home page.
Receives the image in request.file (uploadImage middleware)*/

exports.uploadPhoto = async (request, response, next) => {
    const image = request.file;

    if (!image) {
        return response.status(400).json({ success: false, error: "La imagen es requerida." });
    }

    //=========================
    /*Upload of the photo [Supabase Storage]*/
    try {
        const { publicUrl } = await uploadHomePhoto(image);

        //Return AJAX response
        return response.status(201).json({ success: true, photoUrl: publicUrl });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ success: false, error: "La foto no pudo guardarse." });
    }
    //=========================
};
