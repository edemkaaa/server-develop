const express = require('express');
const loggerController = require('../controllers/loggerController');

const router = express.Router();

router.get('/level', loggerController.getLogLevel);
router.put('/level', loggerController.setLogLevel);

module.exports = router; 