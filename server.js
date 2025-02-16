// server.js
const jsonServer = require('json-server');
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults({
  static: './public'
});

// Konfigurasi CORS
server.use(cors());

// Konfigurasi email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'faildegaskar870@gmail.com', // Ganti dengan email Anda
    pass: 'hcth zlyr rtwu pprg' // Ganti dengan password aplikasi Gmail
  }
});

// Simpan subscriber dalam file db.json
const db = router.db; // Gunakan lowdb yang sudah ada di json-server
if (!db.has('subscribers').value()) {
  db.set('subscribers', []).write();
}

// Konfigurasi multer dengan error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
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

// Endpoint untuk subscribe email
server.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    const subscribers = db.get('subscribers').value();

    if (subscribers.includes(email)) {
      return res.json({ success: false, message: 'Email sudah terdaftar' });
    }

    // Tambah subscriber baru
    db.get('subscribers')
      .push(email)
      .write();

    // Kirim email konfirmasi
    await transporter.sendMail({
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Subscription Berhasil - Job Board Notification',
      html: `
        <h2>Terima kasih telah berlangganan!</h2>
        <p>Anda akan menerima notifikasi ketika ada lowongan kerja baru.</p>
      `
    });

    res.json({ success: true, message: 'Subscription berhasil' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: 'Gagal melakukan subscription' });
  }
});

// Endpoint untuk notifikasi job baru
server.post('/api/notify-new-job', async (req, res) => {
  try {
    const { jobTitle, company } = req.body;
    const subscribers = db.get('subscribers').value();

    // Kirim email ke semua subscriber
    await Promise.all(subscribers.map(email => 
      transporter.sendMail({
        from: 'faildegaskar870@gmail.com',
        to: email,
        subject: 'Lowongan Kerja Baru Tersedia!',
        html: `
          <h2>Lowongan Kerja Baru</h2>
          <p>Posisi: ${jobTitle}</p>
          <p>Perusahaan: ${company}</p>
          <a href="http://localhost:3000">Lihat Detail</a>
        `
      })
    ));

    res.json({ success: true, message: 'Notifikasi terkirim ke semua subscriber' });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengirim notifikasi' });
  }
});

// Endpoint untuk upload file
server.post('/upload', upload.single('file'), (req, res) => {
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

// Tambahkan middleware untuk menangkap post job baru
server.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/jobs') {
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      try {
        // Kirim notifikasi setelah job berhasil ditambahkan
        await fetch('http://localhost:5000/api/notify-new-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: req.body.title,
            company: req.body.company
          })
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
      originalJson(data);
    };
  }
  next();
});

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "akuadminsigma123";

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, token: "random_generated_token" });
  } else {
    res.status(401).json({ success: false, message: "Username atau password salah!" });
  }
});

server.use(router);

const port = 5000;
server.listen(port, '0.0.0.0', () => {
  console.log(`JSON Server is running on port ${port}`);
});