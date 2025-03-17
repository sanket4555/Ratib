const Admin = require('../models/adminModel'); // Adjust the path and name as necessary
const jwt = require('jsonwebtoken');

exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    console.log('Login request received:', { email, password }); // Log the received email and password

    try {
        const admin = await Admin.findOne({ email });
        console.log('Admin found:', admin); // Log the found admin

        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await admin.comparePassword(password);
        console.log('Password match:', isMatch); // Log the result of password comparison

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add these new controller functions
exports.getServerStatus = async (req, res) => {
    try {
        res.json({ status: 'running' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.toggleServer = async (req, res) => {
    try {
        // Add your server toggle logic here
        res.json({ status: 'running' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMetrics = async (req, res) => {
    try {
        const metrics = {
            connections: 0,
            memory: process.memoryUsage().heapUsed / 1024 / 1024,
            cpu: 0,
            uptime: process.uptime(),
            connectionsHistory: [{ time: new Date().toISOString(), value: 0 }],
            memoryHistory: [{ time: new Date().toISOString(), value: 0 }],
            cpuHistory: [{ time: new Date().toISOString(), value: 0 }]
        };
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getLogs = async (req, res) => {
    try {
        res.json({ logs: [] });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}; 