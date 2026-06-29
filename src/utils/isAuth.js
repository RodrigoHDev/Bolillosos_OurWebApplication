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