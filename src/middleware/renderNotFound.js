/*
Title: renderNotFound.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Middleware that handles the render of the 404 page when a route has not
been found.
Logged users see the window navigation and return to /home. (e.g. Gallery
while it is not created)*/

const renderNotFound = function renderNotFound(request, response) {
    const isAuth = Boolean(request.session && request.session.isAuth);

    return response.status(404).render('pages/404.ejs', {
        imageUrl: '/images/404-confusion.jpg',
        imageAlt: 'Bollito creia que esta pagina existia...',
        homeUrl:  isAuth ? '/home' : '/',
        isAuth,
        title: 'Error 404 ✦'
    });
};

module.exports = renderNotFound;
