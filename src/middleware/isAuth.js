/*
Title: isAuth.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Middleware that checks if the user has looged in or not. 
If not, returns to login page*/

function isAuthenticated(request, response, next) {
    if (request.session.isAuth) {
        response.locals.isAuth = true;
        return next();
    }
    else{
        response.locals.isAuth = false;
        return response.redirect('/');
    }
}

module.exports = isAuthenticated;