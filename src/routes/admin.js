const express = require("express");
const router = express.Router();
// 1. Add your missing imports
const { 
  getDashboardStats, 
  recordScan, 
  getScanAnalytics, // <-- This was missing
  getAdminDetails, // <-- NEW
  updateAdminDetails,
  changeAdminPassword,
  exportAllProfiles
} = require("../controller/adminController");

// 2. You also need to import your middleware
const { isLoggedIn } = require('../middleware/isLoggedin'); // <-- This was also missing

// Dashboard stats (for frontend dashboard)
router.get("/dashboard-stats", getDashboardStats);

// Record a new scan (called by your public NFC scan endpoint)
router.post("/record-scan", recordScan);

router.get('/scan-analytics', isLoggedIn, getScanAnalytics);

router.get('/account/details', isLoggedIn, getAdminDetails); // <-- NEW ROUTE
router.put('/account/details', isLoggedIn, updateAdminDetails);
router.put('/account/password', isLoggedIn, changeAdminPassword);

router.get('/export-all-profiles', isLoggedIn, exportAllProfiles);

module.exports = router;
