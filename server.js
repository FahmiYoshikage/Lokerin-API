const jsonServer = require('json-server');
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults({
  static: './public'
});

// Environment variables
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// CORS configuration
server.use(cors());

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Database initialization
const db = router.db;
if (!db.has('subscribers').value()) {
  db.set('subscribers', []).write();
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './public/images/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

server.use(middlewares);
server.use(express.json());

// Public routes (no authentication required)
server.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { username, role: 'admin' },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
    res.json({ 
      success: true, 
      token,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: "Invalid credentials" 
    });
  }
});

// Protected API routes
const apiRouter = express.Router();
apiRouter.use(authenticateToken);

apiRouter.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    const subscribers = db.get('subscribers').value();

    if (subscribers.includes(email)) {
      return res.json({ success: false, message: 'Email already registered' });
    }

    db.get('subscribers').push(email).write();

    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: 'Subscription Confirmation - Job Board',
      html: `
        <h2>Thank you for subscribing!</h2>
        <p>You will receive notifications when new job positions are available.</p>
      `
    });

    res.json({ success: true, message: 'Subscription successful' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: 'Subscription failed' });
  }
});

apiRouter.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: `/images/${req.file.filename}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Mount protected API routes
server.use('/api', apiRouter);

// Middleware to protect certain json-server routes
server.use((req, res, next) => {
  // List of routes that need authentication
  const protectedRoutes = [
    { path: '/jobs', methods: ['POST', 'PUT', 'DELETE'] },
    { path: '/categories', methods: ['POST', 'PUT', 'DELETE'] }
    // Add other routes that need protection
  ];

  const isProtected = protectedRoutes.some(route => 
    req.path.startsWith(route.path) && route.methods.includes(req.method)
  );

  if (isProtected) {
    authenticateToken(req, res, next);
  } else {
    next();
  }
});

// Use JSON Server router
server.use(router);

const port = process.env.PORT || 5000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});