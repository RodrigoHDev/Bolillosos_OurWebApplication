/*
Title: auth.routes.js
Author: R. Hurtado
Date: 07/15/2026 
Description: 
Routes for the Auth module.

Actions available:
- Render login
- Perform login
*/

const express = require('express');
const router = express.Router();

//Not used. Stays for further development.
const isAuth = require('../middleware/isAuth');

const landingController = require('../controllers/landing.controller');

router.get('/', landingController.getLandingPage);

module.exports = router;
