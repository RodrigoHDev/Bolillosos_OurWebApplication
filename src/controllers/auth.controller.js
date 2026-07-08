/*
Title: auth.controller.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Controller of the authentication system of the application.
The current file joins the traditional controller + model 
functions as the database calls (Supabase) are performed here.
*/

//Import of express and supabase
const { request, response } = require("express");
const supabase = require ('../utils/webServices/supabase/supabase');

/*getLogin
Function responsible for rendering the login page.
*/

exports.getLogin = (request, response, next)=>{
    return response.render('pages/login', {
        csrfToken: request.csrfToken(),
        avatarUrl: '/images/bolillo-perfil.jpg',
        title: 'Bolillosos Login ✦'
    });
}

//------------------------------------------------------

/* 
doLogin
Function responsible for login into the platform, creating
the actual session of the user and store required data of the
user.
*/

exports.doLogin = async (request, response, next) => {
    //Obtation of the information of the form.
    const email = request.body.email;
    const password = request.body.password;

    try {

        /*Signin with Supabase Authenticator System [Supabase]
        Function signInWithPassword({email, password})*/
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        //Supabase Error Handling
        if (error || !data.user) {
            console.log(error);
            
            request.session.error = 'Correo o contraseña inválida.';
            return response.redirect('/');
        }

        
        const user = data.user;
        const isAuth = true;
        request.session.isAuth = true;

        /*Call and obtain profile information from user [Supabase]*/
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', user.id);

        //Supabase Error Handling
        if (profileError || !profile) {
            console.log(profileError);
            request.session.error = 'No se pudo acceder a la base de datos. Contactame vida mia';
            return response.redirect('/');
        }

        /*Creation of the user object into the express session.
        Easy access ot required information*/
        request.session.user = {
            id: user.id,
            email: user.email,
            username: profile.username || '',
            displayName: profile.display_name || '',
            isAuth
        };

        request.session.success = 'Welcome back.';

        /*Save of the session objects
        This is the point that allows to access the application*/
        return request.session.save((error) => {
            if (error) {
                console.log(error);
                request.session.error = 'No fue posible guardar la sesión.';
                request.session.success = '';
                return response.redirect('/');
            }
            return response.redirect('/date/accept');
        });

    //General Error Handling
    } catch (error) {
        console.log(error);
        request.session.error = 'No fue posible realizar el acceso.';
        return response.redirect('/');
    }
};


//------------------------------------------------------

//! Unused
/*getLogout
Function responsible for logout the current session.
Only available for authenticated users.

Note: There is no point in the actual application when
a user can perform a logout*/

exports.getLogout = (request, response, next) => {
    request.session.destroy(async error => {
        if (error) {
            return next(error);
        }
        await supabase.auth.signOut();
        response.redirect("/");
    });
};