const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');

const exportController = require('../controllers/exportController');

router.get('/bookings', archiveController.getArchive);
router.get('/export/csv', exportController.exportCsv);
router.get('/export/pdf', exportController.exportPdf);

module.exports = router;
