const https = require("https");
const fs = require("fs");
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');
const compression = require("compression");
const PORT = process.env.PORT || 3000;

//Not in usage, may implement from Unitas System
// const flashMessage = require('./src/middleware/flashMessage');
// const viewPermission = require('./src/middleware/viewPermission');

const renderNotFound = require('./src/utils/renderNotFound');

//-------------------------------------------------------------------------
const app = express();

/*captureRawBody(request, response, buffer)
Function responsible for preserving request raw payload for webhook
signature validation (Slack).*/

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

//Creation of static folder
const path = require('path');
app.use(express.static(path.join(__dirname, 'src', 'public')));

//Web application graphic engine declaration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(expressLayouts);
app.set('layout', false); 

//bodyParser declaration.
const bodyParser = require('body-parser');
app.use(express.urlencoded({
    extended: false,
    verify: captureRawBody,
}));
app.use(bodyParser.urlencoded({extended: false}));

/*Configuracion de Environment Variables*/
require('dotenv').config();

//Usage of express-session
const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,        
    saveUninitialized: false, 
}));


/*Instalacion de csurf*/
const csrf = require('csurf');
const csrfProtection = csrf({ session: true });
app.use(csrfProtection);

//Flash Message declaration
// app.use(flashMessage);

//Usage of viewPermission
// app.use(viewPermission);

//Uso de Auth middleware that redirects to login if no auth is given
const isAuth = require('./src/utils/isAuth');

//Auth
const routesAuth = require('./src/routes/auth.routes');
app.use('/', routesAuth);

//Dates
const routesDates = require('./src/routes/dates.routes');
app.use('/date', routesDates);


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

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
