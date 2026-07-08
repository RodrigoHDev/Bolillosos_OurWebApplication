/*
Title: auth.routes.js
Author: R. Hurtado
Date: 07/07/2026 
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

const authController = require('../controllers/auth.controller');

router.get('/', authController.getLogin);
router.post('/', authController.doLogin);

module.exports = router;
