require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3016;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_DATABASE || 'login',
  password: process.env.DB_PASSWORD || 'admin234',
  port: parseInt(process.env.DB_PORT) || 5432,
});

// Allow both local and deployed frontend origins
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://43.204.100.237:8033',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for origin: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../')));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_picture TEXT
      )
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden - Invalid token' });
    }
    req.user = user;
    next();
  });
};

const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Login/index.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../Sign_up/index.html'));
});
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../Forgot/index.html'));
});
app.get('/dashboard', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../Dashboard/dashboard.html'));
});

// Signup API
app.post('/api/signup', upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePicture = req.file ? req.file.buffer.toString('base64') : null;

    const result = await pool.query(
      'INSERT INTO users (name, email, password, profile_picture) VALUES ($1, $2, $3, $4) RETURNING id, name, email, profile_picture',
      [name, email, hashedPassword, profilePicture]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'Signup successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profile_picture ? `data:image/jpeg;base64,${user.profile_picture}` : null
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'Email not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Incorrect password' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: rememberMe ? '7d' : '1h'
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profile_picture ? `data:image/jpeg;base64,${user.profile_picture}` : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Forgot Password
app.post('/api/forgot-password', async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;
  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Email not registered' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
  res.json({ message: 'Password reset successful' });
});

// Get user info
app.get('/api/user', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT id, name, email, profile_picture FROM users WHERE email = $1', [req.user.email]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    profilePicture: user.profile_picture ? `data:image/jpeg;base64,${user.profile_picture}` : null
  });
});

// Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Protected route test
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Access granted to protected route', user: req.user });
});

// Start server
initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://43.204.100.237:${port}`);
  });
});
