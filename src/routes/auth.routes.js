const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register
router.post('/register', authController.postRegister);

// Login
router.post('/login', authController.postLogin);

// Logout
router.post('/logout', authController.logout);
router.get('/logout', authController.logout); // Optional: keep GET for simple href logouts

module.exports = router;
