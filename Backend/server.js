const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3016;

// Middleware
app.use(cors({
  origin: 'http://43.204.100.237:8033', // Your frontend IP and port
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static frontend files
app.use('/Login', express.static(path.join(__dirname, '../Login')));
app.use('/Sign', express.static(path.join(__dirname, '../Sign')));
app.use('/Forgot_password', express.static(path.join(__dirname, '../Forgot_password')));
app.use('/Dashboard', express.static(path.join(__dirname, '../Dashboard')));

// Mock user route (replace with real auth/session logic)
app.get('/api/user', (req, res) => {
  const user = {
    name: 'John Doe',
    profilePicture: 'https://via.placeholder.com/150'
  };
  res.json(user);
});

// NEW: Signup API route
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;

  // Simple validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Mock response - Replace with actual DB logic
  console.log(`Received signup: ${username}, ${email}`);
  res.status(201).json({
    message: 'Signup successful',
    user: { username, email }
  });
});

// Logout route
app.post('/api/logout', (req, res) => {
  res.clearCookie('token'); // Adjust token name if needed
  res.status(200).json({ message: 'Logged out successfully' });
});

// Serve default page on root access
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Sign/index.html'));
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://43.204.100.237:${PORT}`);
});
