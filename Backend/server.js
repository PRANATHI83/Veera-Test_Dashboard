const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3016;

// Middleware
app.use(cors({
  origin: 'http://43.204.100.237:8033', // Replace with actual frontend URL if different
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ✅ GET: Mock user data (for authenticated profile loading)
app.get('/api/user', (req, res) => {
  res.json({
    name: 'John Doe',
    profilePicture: 'https://via.placeholder.com/150'
  });
});

// ✅ POST: Signup endpoint (mock logic — replace with real DB logic later)
app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;

  // Validate presence of required fields
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Log data and return success mock response
  console.log(`Received signup: Name=${name}, Email=${email}`);
  res.status(201).json({
    message: 'Signup successful',
    user: { name, email }
  });
});

// ✅ POST: Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// ✅ Default root
app.get('/', (req, res) => {
  res.send('Backend is running.');
});

// ✅ Catch-all 404
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// ✅ Start the backend server
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://43.204.100.237:${PORT}`);
});
