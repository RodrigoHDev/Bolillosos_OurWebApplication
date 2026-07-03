const express = require('express');
const router = express.Router();
const isAuth = require('../utils/isAuth');

const datesController = require('../controllers/dates.controller');

router.get('/accept', isAuth, datesController.getAcceptDate);
router.get('/category', isAuth, datesController.getCategoryPage);
router.get('/topics', isAuth, datesController.getTopicsByCategory);
router.get('/date', isAuth, datesController.getDatesPage);
router.post('/date', isAuth, datesController.finishDate);

module.exports = router;
