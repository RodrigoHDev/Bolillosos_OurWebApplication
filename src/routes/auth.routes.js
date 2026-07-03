const express = require('express');
const router = express.Router();
const isAuth = require('../utils/isAuth');

const authController = require('../controllers/auth.controller');

router.get('/', authController.getLogin);
router.post('/', authController.doLogin);

module.exports = router;
