const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');

// Setup
const app = express();
const PORT = process.env.PORT || 3016;

// CORS
app.use(cors({
  origin: 'http://43.204.100.237:8033',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Create 'uploads' folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Serve static frontend routes
app.use('/Login', express.static(path.join(__dirname, '../Login')));
app.use('/Sign', express.static(path.join(__dirname, '../Sign')));
app.use('/Forgot_password', express.static(path.join(__dirname, '../Forgot_password')));
app.use('/Dashboard', express.static(path.join(__dirname, '../Dashboard')));

// GET: Mock user route
app.get('/api/user', (req, res) => {
  res.json({
    name: 'John Doe',
    profilePicture: 'https://via.placeholder.com/150'
  });
});

// POST: Signup route with multer
app.post('/api/signup', upload.single('profilePicture'), (req, res) => {
  const { username, email, password } = req.body;
  const profilePicture = req.file;

  if (!username || !email || !password || !profilePicture) {
    return res.status(400).json({ error: 'All fields including profile picture are required' });
  }

  console.log('Signup data:', { username, email, picture: profilePicture.originalname });

  // Respond success
  res.status(201).json({
    message: 'Signup successful',
    user: {
      username,
      email,
      profilePicture: `/uploads/${profilePicture.filename}`
    }
  });
});

// POST: Logout route
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// Root fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Sign/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://43.204.100.237:${PORT}`);
});
