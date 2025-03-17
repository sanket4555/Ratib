const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files and views
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use(express.static(path.join(__dirname, '../frontend/views')));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// HTML Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/register.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/admin-login.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/admin-dashboard.html'));
});

app.get('/admin/server-control', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/server-control.html'));
});

app.get('/admin/agencies', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/agency-management.html'));
});

app.get('/admin/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/analytics.html'));
});

// Handle 404 - Keep this as the last route
app.use((req, res) => {
    console.log('404 for:', req.url); // For debugging
    res.status(404).sendFile(path.join(__dirname, '../frontend/views/404.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 