const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Setup koneksi ke MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Middleware autentikasi JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Memisahkan Bearer dari token
  
    if (!token) return res.status(401).json({ message: 'No token provided, authorization denied' });
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Token is not valid' }); // 403 Forbidden jika token tidak valid
      req.user = user;
      next();
    });
  };
  

// Registrasi user
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.status(400).json({ message: 'Username and password are required.' });
  if(username.length >= 8){
    return res.status(400).json({ message: 'Username must consist of a maximum of 8 characters.' });
  }
  if (password.length < 6 || !/[a-zA-Z]/.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long and contain letters.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error registering user.' });
    res.status(201).json({ message: 'User registered successfully.' });
  });
});

// Login user
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.status(400).json({ message: 'Username and password are required.' });

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ message: 'Invalid username or password.' });

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) return res.status(400).json({ message: 'Invalid username or password.' });

    const accessToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
    const refreshToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

    res.json({ accessToken, refreshToken });
  });
});

// Endpoint untuk mendapatkan informasi user (misalnya untuk menampilkan di dashboard)
app.get('/api/user', authenticateToken, (req, res) => {
    db.query('SELECT username FROM users WHERE id = ?', [req.user.id], (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      res.json({ username: results[0].username });
    });
  });
  

// Refresh token
app.post('/api/token', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    const accessToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
    res.json({ accessToken });
  });
});

// CRUD To-Do List

// Create To-Do
app.post('/api/todos', authenticateToken, (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required.' });

  db.query('INSERT INTO todos (title, status, user_id) VALUES (?, ?, ?)', [title, 'not completed', req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error creating to-do.' });
    res.status(201).json({ message: 'To-do created successfully.' });
  });
});

// Read To-Do List
app.get('/api/todos', authenticateToken, (req, res) => {
  db.query('SELECT * FROM todos WHERE user_id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching to-do list.' });
    res.json(results);
  });
});

// Update To-Do status
app.put('/api/todos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, status } = req.body; // Tambahkan title dan status ke dalam request body
  
    db.query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id], (err, results) => {
      if (err || results.length === 0) return res.status(404).json({ message: 'To-do not found.' });
  
      const updatedTitle = title || results[0].title; // Jika tidak ada title baru, gunakan title yang lama
      const updatedStatus = status || results[0].status; // Jika tidak ada status baru, gunakan status yang lama
  
      db.query('UPDATE todos SET title = ?, status = ? WHERE id = ?', [updatedTitle, updatedStatus, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error updating to-do.' });
        res.json({ message: 'To-do updated successfully.' });
      });
    });
  });
  

// Delete To-Do
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id], (err, results) => {
    if (err || results.affectedRows === 0) return res.status(404).json({ message: 'To-do not found.' });
    res.json({ message: 'To-do deleted successfully.' });
  });
});

// Update User Data
app.put('/api/user', authenticateToken, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.status(400).json({ message: 'Username and password are required.' });
  if(username.length >= 8){
    return res.status(400).json({ message: 'Username must consist of a maximum of 8 characters.' });
  }
  if (password.length < 6 || !/[a-zA-Z]/.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long and contain letters.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query('UPDATE users SET username = ?, password = ? WHERE id = ?', [username, hashedPassword, req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error updating user.' });
    res.json({ message: 'User updated successfully.' });
  });
});

// Mulai server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
