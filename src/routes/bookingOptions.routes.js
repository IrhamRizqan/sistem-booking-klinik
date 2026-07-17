const express = require('express');
const router = express.Router();
const bookingOptionsController = require('../controllers/bookingOptionsController');

router.get('/specializations', bookingOptionsController.getSpecializations);
router.get('/doctors', bookingOptionsController.getDoctors);
router.get('/schedules', bookingOptionsController.getSchedules);

module.exports = router;
