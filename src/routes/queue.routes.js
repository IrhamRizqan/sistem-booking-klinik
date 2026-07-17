const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

router.get('/', queueController.index);
router.patch('/:id/status', queueController.updateStatus);

module.exports = router;
