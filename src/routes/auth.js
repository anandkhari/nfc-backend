const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { isLoggedIn } = require('../middleware/isLoggedin');

// --- Admin Registration ---
router.post('/register-admin', authController.registerAdmin);

// --- Admin Login ---
router.post('/login-admin', authController.loginAdmin);

// --- Logout ---
router.post('/logout', authController.logoutAdmin);

// --- Check if logged in ---
router.get("/check-auth", isLoggedIn, (req, res) => {
  console.log("✅ /check-auth route hit!");
  res.status(200).json({ valid: true, user: req.user });
});




module.exports = router;
