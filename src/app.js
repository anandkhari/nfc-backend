// server.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // load env

// -----------------------------
// Routers
// -----------------------------
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const indexRouter = require('./routes/index');
const profileRouter = require('./routes/profile');
const publicVcfRouter = require('./routes/publicVcf');


// -----------------------------
// Database connection
// -----------------------------
const connectDB = require('./config/db');
connectDB();

// -----------------------------
// Express app setup
// -----------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------
// CORS setup
// -----------------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",                // local dev
      "https://lustrous-lolly-ece855.netlify.app", // production frontend
    ],
    credentials: true,
  })
);

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -----------------------------
// Project root and upload folder
// -----------------------------
const projectRoot = path.resolve(__dirname, '../'); // one level above src
const publicFolder = path.join(projectRoot, 'public');
const uploadFolder = path.join(process.cwd(), 'public/images/upload');

// Ensure upload folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
  console.log(`✅ Created upload folder at: ${uploadFolder}`);
}

// Serve public folder
app.use('/images/upload', express.static(uploadFolder));

// Explicitly serve uploaded images
app.use('/images/upload', express.static(uploadFolder));

// -----------------------------
// View engine
// -----------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// -----------------------------
// Multer setup for file uploads
// -----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// -----------------------------
// Set BASE_URL for absolute file URLs
// -----------------------------
process.env.BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
console.log(`🌐 BASE_URL set to: ${process.env.BASE_URL}`);

// -----------------------------
// Routes
// -----------------------------
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', profileRouter);
app.use('/', indexRouter);
app.use('/api/public', publicVcfRouter);


// Landing page example
app.get('/', (req, res) => {
  res.render('public/landing');
});

// -----------------------------
// Global error handler
// -----------------------------
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// -----------------------------
// Start server
// -----------------------------
app.listen(PORT, () => {
  console.log(`✅ Server running at ${process.env.BASE_URL}`);
  console.log("JWT_SECRET is:", process.env.JWT_SECRET ? "DEFINED" : "NOT DEFINED");
});

// -----------------------------
// Export app & upload for routes
// -----------------------------
module.exports = { app, upload };
