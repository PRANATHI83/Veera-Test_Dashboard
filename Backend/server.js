const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3016;

// Enable CORS
app.use(cors({
  origin: 'http://43.204.100.237:8033',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Serve static files from correct folders (relative to server.js)
app.use('/Login', express.static(path.join(__dirname, '../Login')));
app.use('/Sign', express.static(path.join(__dirname, '../Sign')));
app.use('/Forgot_password', express.static(path.join(__dirname, '../Forgot_password')));
app.use('/Dashboard', express.static(path.join(__dirname, '../Dashboard')));

// API route: mock signup
app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  res.status(201).json({ message: 'Signup successful', user: { name, email } });
});

// Logout route
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// Redirect root to /Sign/index.html
app.get('/', (req, res) => {
  res.redirect('/Sign');
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://43.204.100.237:${PORT}`);
});
