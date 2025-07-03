const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3016;

// Middleware
app.use(cors({
  origin: 'http://localhost:8033', // Change this to your frontend's domain if different
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Static frontend routes
app.use('/Login', express.static(path.join(__dirname, '../Login')));
app.use('/Sign', express.static(path.join(__dirname, '../Sign')));
app.use('/Forgot_password', express.static(path.join(__dirname, '../Forgot_password')));
app.use('/Dashboard', express.static(path.join(__dirname, '../Dashboard')));

// API route example (e.g. user data)
app.get('/api/user', (req, res) => {
  // Sample mock response – replace this with actual DB query or session logic
  const user = {
    name: 'John Doe',
    profilePicture: 'https://via.placeholder.com/150'
  };
  res.json(user);
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('token'); // Adjust if you're using a different cookie name
  res.status(200).json({ message: 'Logged out successfully' });
});

// Root route fallback (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Sign/index.html'));
});

// 404 fallback for any other route
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
