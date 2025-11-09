const express = require('express');
const router = express.Router();

// Import individual route files
const authRoutes = require('./auth');       // handles /api/auth
const adminRoutes = require('./admin');     // handles /api/admin

// Mount routers
router.use('/api/auth', authRoutes);
router.use('/api/admin', adminRoutes);

// Optional: base route
router.get('/', (req, res) => {
    res.send('API is running');
});

module.exports = router;
