/*
Title: server.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Creation of the server.
Main file that controls the web application, its redirections to any route and
handle of middlewares.
*/

//Import of the used middleware and resources to assemble the application

const https = require("https");
const fs = require("fs");
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');
const session = require('express-session');
const compression = require("compression");
const PORT = process.env.PORT || 3000;
const flash   = require('./src/middleware/flash');
const renderNotFound = require('./src/middleware/renderNotFound');
const isAuth = require('./src/middleware/isAuth');


//-------------------------------------------------------------------------

/*Creation of the app in express server*/
const app = express();


/*captureRawBody(request, response, buffer)
Function that allows to easily read JSON content
.*/
const captureRawBody = function captureRawBody(request, response, buffer) {
    if (buffer && buffer.length > 0) {
        request.rawBody = buffer.toString('utf8');
    }
};

app.use(express.json({
    verify: captureRawBody,
}));


/* Compression middleware to optimize response sizes for faster load times and reduced bandwidth usage.*/
app.use(compression());


//Creation of static folder directed to public
const path = require('path');
app.use(express.static(path.join(__dirname, 'src', 'public')));


//Web application graphic engine declaration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);


/*bodyParser declaration easier readability over posted forms.*/
const bodyParser = require('body-parser');
app.use(express.urlencoded({
    extended: false,
    verify: captureRawBody,
}));
app.use(bodyParser.urlencoded({extended: false}));


/*Configuration of the Environment Variables*/
require('dotenv').config();


/*Usage of express-session to store temporary the session of a user in the web
application*/
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,        
    saveUninitialized: false, 
}));

/*Usage of the flash middleware
This middleware allows to send messages and show them in message after render
by sending them as:
.success
.error*/
app.use(flash);

/*Instalacion de csurf
Declaration to increase security against page saturation*/
const csrf = require('csurf');
const csrfProtection = csrf({ session: true });
app.use(csrfProtection);

/* Declaration required for work in Render*/
app.set('trust proxy', 1); 

/*Routes redirection*/
//Landing page
const routesLanding = require('./src/routes/landing.routes');
app.use('/', routesLanding);

//Auth
const routesAuth = require('./src/routes/auth.routes');
app.use('/auth', routesAuth);

//Dates
const routesDates = require('./src/routes/dates.routes');
app.use('/date', routesDates);


/*Additional catch over expired csurf verification code
Usage of the flash middleware to show the error*/
app.use((error, request, response, next) => {
    if (error.code !== 'EBADCSRFTOKEN') {
        next(error);
        return;
    }

    request.session.error = 'Your form expired. Please try again.';
    response.redirect(request.get('Referrer') || '/');
});

// Middleware that used to handle error when page was not found.
app.use(renderNotFound);

/*Formallity for development, allows to get a URL with the user port to copy to
preferred brower*/
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
