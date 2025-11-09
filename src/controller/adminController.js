// controller/adminController.js

const Scan = require("../models/scan-model");
const Profile = require("../models/profile-model");
const Save = require('../models/save-model'); // 1. Import the Save model
const Admin = require('../models/admin-model')
const bcrypt = require('bcrypt')

// --- ✅ Dashboard Stats ---
exports.getDashboardStats = async (req, res) => {
  try {
    // 2. Use Promise.all to fetch all stats at the same time (it's faster)
    const [totalProfiles, totalScans, totalSaves] = await Promise.all([
      Profile.countDocuments(),
      Scan.countDocuments(),
      Save.countDocuments() // 3. This is the fix: Count docs in the 'Save' collection
    ]);

    res.json({
      totalProfiles,
      totalScans,
      totalSaves, // This will now send the correct count
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

// --- ✅ Record a new scan ---
// (This function is fine, no changes needed)
exports.recordScan = async (req, res) => {
  try {
    const { profileId, location, device } = req.body;
    const ipAddress = req.ip;

    if (!profileId) {
      return res.status(400).json({ message: "Profile ID is required" });
    }

    const newScan = await Scan.create({
      profileId,
      location,
      device,
      ipAddress,
    });

    res.status(201).json({ message: "Scan recorded successfully", newScan });
  } catch (err) {
    console.error("Error recording scan:", err);
    res.status(500).json({ message: "Failed to record scan" });
  }
};


exports.getScanAnalytics = async (req, res) => {
  try {
    // Get data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Use MongoDB Aggregation to group scans by day
    const scanData = await Scan.aggregate([
      // 1. Filter for scans in the last 30 days
      { $match: { scannedAt: { $gte: thirtyDaysAgo } } },
      
      // 2. Group by the date part of 'scannedAt'
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } },
          count: { $sum: 1 } // Count 1 for each scan in that day
        }
      },
      
      // 3. Sort by date ascending
      { $sort: { _id: 1 } },
      
      // 4. Format the output to be clean (e.g., { date: "2025-11-05", scans: 12 })
      {
        $project: {
          _id: 0, // Remove the ugly _id
          date: "$_id",
          scans: "$count"
        }
      }
    ]);

    res.json({ success: true, scanData });
  } catch (err) {
    console.error("Scan analytics error:", err);
    res.status(500).json({ message: "Error fetching scan analytics" });
  }
};


// --- ✅ NEW: Get Current Admin Details ---
exports.getAdminDetails = async (req, res) => {
  try {
    // req.user.id is added by your isLoggedIn middleware
    const user = await Admin.findById(req.user.id).select('-password'); // Find user, hide password

    if (!user) {
      return res.status(404).json({ message: "Admin user not found." });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Get admin details error:", err);
    res.status(500).json({ message: "Error fetching account details." });
  }
};

// --- ✅ CORRECTED: Update Account Details ---
exports.updateAdminDetails = async (req, res) => {
  try {
    // Note: We use 'username' and 'email' from your schema
    const { username, email } = req.body; 
    const userId = req.user.id; 

    if (!username || !email) {
      return res.status(400).json({ message: "Username and email are required." });
    }

    // Find the user using your 'Admin' model
    const user = await Admin.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update and save
    user.username = username;
    user.email = email;
    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("Update details error:", err);
    res.status(500).json({ message: "Error updating account details." });
  }
};



exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match." });
    }

    // Find the user using your 'Admin' model
    const user = await Admin.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully." });

  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Error changing password." });
  }
};

// --- ✅ NEW: Export All Profiles ---

exports.exportAllProfiles = async (req, res) => {
  try {
    // 1. Fetch all profiles from the database
    // .select('-__v') removes the version key from the export
    const profiles = await Profile.find().select('-__v');

    // 2. Set headers to tell the browser this is a file download
    const fileName = `trueline-profiles-export-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/json');

    // 3. Send the profile data as a JSON response
    res.status(200).json(profiles);

  } catch (err) {
    console.error("Export profiles error:", err);
    res.status(500).json({ message: "Error exporting profiles" });
  }
};