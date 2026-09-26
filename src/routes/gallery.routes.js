/*
Title: gallery.routes.js
Author: R. Hurtado
Date: 09/26/2026
Description:
Routes for the Gallery module. Mounted at /gallery.

Actions available:
- Render the gallery of one anniversary year (?year=N)
- Return the labels of the new photo modal (AJAX)
- Add a new photo (AJAX, multipart)
*/

const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const uploadImage = require('../middleware/uploadImage');

const galleryController = require('../controllers/gallery.controller');

//Only available once logged in
router.get('/', isAuth, galleryController.getGalleryPage);
router.get('/labels', isAuth, galleryController.getLabels);
router.post('/photo', isAuth, uploadImage, galleryController.createPhoto);

module.exports = router;
