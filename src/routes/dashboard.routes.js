const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requirePatientAuth, requireAdminAuth } = require('../middlewares/authMiddleware');

router.get('/admin', requireAdminAuth, dashboardController.getAdminDashboard);
router.get('/patient/active', requirePatientAuth, dashboardController.getPatientActiveBooking);

module.exports = router;
