const Profile = require("../models/profile-model"); // Mongoose Profile model
const Scan = require("../models/scan-model");
const Save = require('../models/save-model');

// Controller to create or update a user profile

exports.createProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const textData = JSON.parse(req.body.data);

    const profileData = {
      ...textData,
      user: userId,
    };

    if (req.files?.profileImage?.length > 0) {
      profileData.profileImageUrl = `/images/upload/${req.files.profileImage[0].filename}`;
    }

    if (req.files?.galleryImages?.length > 0) {
      profileData.galleryImages = req.files.galleryImages.map(
        (file) => `/images/upload/${file.filename}`
      );
    }

    const profile = await Profile.create(profileData);
    res.status(201).json(profile);
  } catch (err) {
    console.error("Profile save error:", err);
    res.status(500).json({ message: "Server error while saving the profile." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const profileId = req.params.id; // the profile to update
    const textData = JSON.parse(req.body.data);

    const profile = await Profile.findById(profileId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    Object.assign(profile, textData);

    if (req.files?.profileImage?.length > 0) {
      profile.profileImageUrl = `/images/upload/${req.files.profileImage[0].filename}`;
    }

    if (req.files?.galleryImages?.length > 0) {
      profile.galleryImages = req.files.galleryImages.map(
        (file) => `/images/upload/${file.filename}`
      );
    }

    await profile.save();
    res.status(200).json(profile);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

// ⬇️ REPLACE your old 'getAllProfiles' with this new version ⬇️

exports.getAllProfiles = async (req, res) => {
  try {
    // 1. Get query parameters from the frontend (e.g., /api/profile?page=1&q=dilshan)
    const { 
      page = 1, 
      limit = 9, 
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      q = '' 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 2. Build the main query object
    const queryObject = {
      // This ensures the admin only sees their own profiles
      user: req.user.id, 
    };

    // 3. Add search functionality (if 'q' exists)
    if (q) {
      // This will search for the text 'q' in the 'name' or 'title' fields
      // '$options: 'i'` makes the search case-insensitive
      queryObject.$or = [
        { name: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } }, // Bonus: search company
      ];
    }

    // 4. Build the sort object
    const sortObject = {};
    const sortValue = sortOrder === 'desc' ? -1 : 1;
    sortObject[sortBy] = sortValue;

    // 5. Execute two queries at the same time for speed
    const [profiles, totalProfiles] = await Promise.all([
      // Query 1: Get the 9 profiles for the current page
      Profile.find(queryObject)
        .sort(sortObject)
        .skip(skip)
        .limit(limitNum),
      
      // Query 2: Get the TOTAL number of profiles that match the search
      Profile.countDocuments(queryObject)
    ]);

    // 6. Calculate total pages
    const totalPages = Math.ceil(totalProfiles / limitNum);

    // 7. Send the complete response (exactly what the frontend expects)
    res.status(200).json({
      success: true,
      profiles,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProfiles,
      },
    });

  } catch (error) {
    console.error("Get all profiles error:", error);
    res.status(500).json({ message: "Server error while fetching profiles." });
  }
};

//delete profile

module.exports.deleteProfile = async (req, res) => {
  try {
    const profileId = req.params.id;

    // Validate ObjectId
    if (!profileId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid profile ID" });
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    await Profile.findByIdAndDelete(profileId); // ✅ delete directly
    res.status(200).json({ message: "Profile deleted successfully", profile });
  } catch (err) {
    console.error("Error deleting profile:", err);
    res.status(500).json({ message: "Server error while deleting profile" });
  }
};

exports.getProfileByIdPublic = async (req, res) => {
  try {
    const profileId = req.params.id;

    // Fetch profile by ID
    const profile = await Profile.findById(profileId);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // --- 2. ADD THIS SCAN LOGIC ---
    try {
      Scan.create({
        profileId: profile._id,
        ipAddress: req.ip || req.socket.remoteAddress,
        device: req.headers["user-agent"],
      })
        .then(() => {
          // THIS is where the log goes
          console.log("Scan logged successfully for profile:", profile._id);
        })
        .catch((scanError) => {
          // This will catch errors just for the scan
          console.error("Failed to log scan:", scanError);
        });
    } catch (scanError) {
      // If logging the scan fails, just log it to the server.
      // Do NOT block the user from seeing the profile.
      console.error("Failed to log scan:", scanError);
    }
    // --- END OF NEW LOGIC ---

    // Exclude any private fields (e.g., internal user ID, tokens, etc.)
    const publicProfile = profile.toObject();
    delete publicProfile.user; // remove reference to admin user
    delete publicProfile.__v; // remove mongoose version key

    res.status(200).json({
      success: true,
      profile: publicProfile,
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    res.status(500).json({ message: "Server error while fetching profile." });
  }
};

exports.logVcfSave = async (req, res) => {
  try {
    const { profileId } = req.body;

    if (!profileId) {
      return res.status(400).json({ message: "Profile ID is required." });
    }

    // Fire and forget
    Save.create({
      profileId: profileId,
      ipAddress: req.ip || req.socket.remoteAddress,
      device: req.headers['user-agent'],
    })
    .then(() => {
      console.log("VCF Save logged for profile:", profileId);
    })
    .catch(saveError => {
      console.error("Failed to log save:", saveError);
    });

    // Respond immediately so the download can start
    res.status(200).json({ success: true, message: "Save logged." });

  } catch (error) {
    console.error("Error logging VCF save:", error);
    res.status(500).json({ message: "Server error." });
  }
};