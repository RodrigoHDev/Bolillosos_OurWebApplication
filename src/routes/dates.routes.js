/*
Title: dates.routes.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Routes for the Dates module.

Actions available:
- Render accept page.
- Render category acceptance.
- Return available activities for the given category (AJAX)
- Render date page.
- Receive the date information. Store information in database. Resend API call. 
Redirect.
*/

const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');

const datesController = require('../controllers/dates.controller');

//Only available once logged in
router.get('/accept', isAuth, datesController.getAcceptDate);
router.get('/category', isAuth, datesController.getCategoryPage);
router.get('/topics', isAuth, datesController.getTopicsByCategory);
router.get('/date', isAuth, datesController.getDatesPage);
router.post('/date', isAuth, datesController.finishDate);

module.exports = router;
