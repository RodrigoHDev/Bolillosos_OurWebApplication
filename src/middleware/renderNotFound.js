/*
Title: renderNotFound.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Middleware that handles the render of the 404 page when a route has not
been found*/

const renderNotFound = function renderNotFound(request, response) {
    return response.status(404).render('pages/404.ejs', {
        imageUrl: '/images/404-confusion.jpg',
        imageAlt: 'Bollito creia que esta pagina existia...',
        homeUrl:  '/',
        title: 'Error 404 ✦'
    });
};

module.exports = renderNotFound;
