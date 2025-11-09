const express = require('express');
const router = express.Router();
const profileController = require('../controller/profilecontroller');
const { isLoggedIn } = require('../middleware/isLoggedin');
const upload = require('../middleware/multerConfig'); // Multer configuration

// Get all profiles
router.get('/profile', isLoggedIn, profileController.getAllProfiles);

// Create profile
router.post(
  '/profile',
  isLoggedIn,
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 5 }
  ]),
  profileController.createProfile
);

// ✅ Update profile
router.put(
  '/profile/:id',
  isLoggedIn,
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 5 }
  ]),
  profileController.updateProfile
);

// Delete profile
router.delete('/profile/:id', isLoggedIn, profileController.deleteProfile);

// Public route: Get profile by ID (for NFC or public links)
router.get('/profile/:id', profileController.getProfileByIdPublic);

// It's used to log a save event
router.post('/profile/log-save', profileController.logVcfSave);

module.exports = router;
