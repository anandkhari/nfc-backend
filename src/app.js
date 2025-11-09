const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // load env once

// Routers
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const indexRouter = require('./routes/index');
const profileRouter = require('./routes/profile');

// Database connection
const connectDB = require('./config/db');
connectDB();

const app = express();

// CORS setup to allow frontend and cookies
app.use(
  cors({
    origin: [
      "http://localhost:5173",                // for local dev
      "https://lustrous-lolly-ece855.netlify.app", // your Netlify frontend
    ],
    credentials: true, // allow cookies or auth headers
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Multer setup
const uploadFolder = path.join(__dirname, '../public/images/upload');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', profileRouter);
app.use('/', indexRouter);

// Landing page
app.get('/', (req, res) => {
  res.render('public/landing');
});

// Optional: Error handler
// app.use(require('./src/middleware/errorHandler'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log("JWT_SECRET is:", process.env.JWT_SECRET);
});

module.exports = { app, upload };
