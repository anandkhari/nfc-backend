const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminModel = require('../models/admin-model'); // ensure path is correct

module.exports.registerAdmin = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if any admin already exists
        const adminExists = await adminModel.exists({});
        if (adminExists) {
            return res.status(400).json({ message: "Admin account already exists. Cannot create another." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the admin
        const admin = await adminModel.create({
            username,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id, role: 'admin' },
            process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
            { expiresIn: '1d' }
        );

        // Set token in HTTP-only cookie
        res.cookie('token', token, { httpOnly: true });

        // Success response
        res.status(201).json({ message: "Admin created successfully", adminId: admin._id });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



module.exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email only
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Compare passwords
    const verified = await bcrypt.compare(password, admin.password);
    if (!verified) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // expires in 1 day
    );

    // ✅ Store token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true, // Prevents JavaScript access (protects from XSS)
      secure: false, // Use true in production (HTTPS)
      sameSite: 'Lax', // Allow cross-site if needed
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // ✅ Return success message (no token in body!)
    res.status(200).json({
      message: "Admin logged in successfully",
      adminId: admin._id
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: error.message });
  }
};


module.exports.logoutAdmin = (req, res) => {
    // Clear the 'token' cookie
    res.clearCookie('token', {
        httpOnly: true,
        secure:false,
        sameSite: 'Lax',
        path: '/' // make sure path matches how cookie was set
    });

    res.status(200).json({ message: "Logged out successfully" });
};


module.exports.getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await adminModel.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({ admin });
  } catch (error) {
    console.error('getCurrentUser error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

