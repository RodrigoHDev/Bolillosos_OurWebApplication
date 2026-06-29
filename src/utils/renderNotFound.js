const renderNotFound = function renderNotFound(request, response) {
    return response.status(404).render('pages/404.ejs', {
        imageUrl: '/images/404-confusion.jpg',
        imageAlt: 'Bollito creia que esta pagina existia...',
        homeUrl:  '/',
        title: 'Error 404 ✦'
    });
};

module.exports = renderNotFound;
