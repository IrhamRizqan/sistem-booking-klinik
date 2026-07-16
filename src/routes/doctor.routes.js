const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

router.get('/', doctorController.index);
router.get('/:id', doctorController.show);
router.post('/', doctorController.store);
router.put('/:id', doctorController.update);
router.delete('/:id', doctorController.destroy);

module.exports = router;
