/*
Title: landing.controller.js
Author: R. Hurtado
Date: 07/15/2026 
Description: 
Controller of the landing page of the application.
The current file joins the traditional controller + model 
functions as the database calls (Supabase) are performed here.
*/

//Import of express and supabase
const { request, response } = require("express");
const supabase = require ('../utils/webServices/supabase/supabase');

/*getLogin
Function responsible for rendering the login page.
*/

exports.getLandingPage = (request, response, next)=>{
    return response.render('pages/landing', {
        title: 'Bolillosos ✦',
        announcements: [
        {
            date: '8 Jul 2025',
            title: 'Sección de Citas disponible ✦',
            description: 'Ya pueden agendar su primera cita juntos ♡',
            image: '/images/news/dates.png', // or null
            isNew: true
        }]
    });
}
