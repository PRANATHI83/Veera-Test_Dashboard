const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3016;

// Enable CORS for frontend
app.use(cors({
  origin: 'http://43.204.100.237:8033',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Serve static frontend folders
app.use('/Login', express.static(path.join(__dirname, '../Login')));
app.use('/Sign', express.static(path.join(__dirname, '../Sign')));
app.use('/Forgot_password', express.static(path.join(__dirname, '../Forgot_password')));
app.use('/Dashboard', express.static(path.join(__dirname, '../Dashboard')));
app.use('/uploads', express.static(uploadDir)); // Serve uploaded images

// GET user (example)
app.get('/api/user', (req, res) => {
  const user = {
    name: 'John Doe',
    profilePicture: 'https://via.placeholder.com/150'
  };
  res.json(user);
});

// POST /api/signup
app.post('/api/signup', upload.single('profilePicture'), (req, res) => {
  const { name, email, password } = req.body;
  const profilePicture = req.file;

  if (!name || !email || !password || !profilePicture) {
    return res.status(400).json({ error: 'All fields including profile picture are required' });
  }

  // Log signup data
  console.log('Signup data received:', { name, email, file: profilePicture.filename });

  // Send success response
  res.status(201).json({
    message: 'Signup successful',
    user: {
      name,
      email,
      profilePicture: `/uploads/${profilePicture.filename}`
    }
  });
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// Serve index.html by default on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Sign/index.html'));
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://43.204.100.237:${PORT}`);
});
