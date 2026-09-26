/*
Title: dates.routes.js
Author: R. Hurtado
Date: 07/07/2026
Description:
Routes for the Dates module. Mounted at /dates.

Actions available:
- Render invitation page. (Step 1)
- Render category page. (Step 2)
- Return available activities for the given category (AJAX)
- Render schedule page. (Step 3)
- Receive the date information. Store information in database. Resend API call.
Redirect.
*/

const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');

const datesController = require('../controllers/dates.controller');

//Only available once logged in
router.get('/invitation', isAuth, datesController.getInvitationPage);
router.get('/category', isAuth, datesController.getCategoryPage);
router.get('/activities', isAuth, datesController.getActivitiesByCategory);
router.get('/schedule', isAuth, datesController.getSchedulePage);
router.post('/schedule', isAuth, datesController.saveDate);

module.exports = router;
