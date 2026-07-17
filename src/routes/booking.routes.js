const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Only allow authenticated patients to book
router.post('/', bookingController.store);
router.get('/history', bookingController.history);

module.exports = router;
