/*
Title: home.routes.js
Author: R. Hurtado
Date: 09/26/2026
Description:
Routes for the Home module. Mounted at /home.

Actions available:
- Render home page.
- Upload / change the anniversary photo (AJAX, multipart)
*/

const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const uploadImage = require('../middleware/uploadImage');

const homeController = require('../controllers/home.controller');

//Only available once logged in
router.get('/', isAuth, homeController.getHomePage);
router.post('/photo', isAuth, uploadImage, homeController.uploadPhoto);

module.exports = router;
