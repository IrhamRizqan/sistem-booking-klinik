const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register
router.post('/register', authController.postRegister);

// Login
router.post('/login', authController.postLogin);

// Admin Login
router.post('/admin-login', authController.postAdminLogin);

// Logout
router.post('/logout', authController.logout);
router.get('/logout', authController.logout); // Optional: keep GET for simple href logouts

// Get current session info
router.get('/me', authController.getMe);

module.exports = router;
