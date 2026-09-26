/*
Title: landing.routes.js
Author: R. Hurtado
Date: 07/15/2026 
Description: 
Routes for the Landing module.

Actions available:
- Render landing page
*/

const express = require('express');
const router = express.Router();

//Not used. Stays for further development.
const isAuth = require('../middleware/isAuth');

const landingController = require('../controllers/landing.controller');

router.get('/', landingController.getLandingPage);

module.exports = router;
