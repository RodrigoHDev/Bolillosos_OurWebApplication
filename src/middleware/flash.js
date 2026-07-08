/*
Title: flash.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Middleware responsible for rendering the actual flash messages
of .success or .error at each page render*/

module.exports = function flash(req, res, next) {
    // Make available to all views rendered in this request
    res.locals.success = req.session.success || null;
    res.locals.error   = req.session.error   || null;

    // Clear so they don't persist into the next request
    delete req.session.success;
    delete req.session.error;

    next();
};
