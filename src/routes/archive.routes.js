const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');

router.get('/bookings', archiveController.getArchive);

module.exports = router;
