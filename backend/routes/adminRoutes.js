const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const Agency = require('../models/agencyModel');
const User = require('../models/userModel');
const { generatePassword, generateAgencyCode, sendAgencyCredentials } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const adminController = require('../controllers/adminController');

// Admin Login
router.post('/login', adminController.loginAdmin);

// Get Dashboard Data
router.get('/dashboard', authenticateAdmin, async (req, res) => {
    try {
        // Get real-time statistics from database
        const stats = await getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// Get Monthly Customer Growth
router.get('/stats/customer-growth', authenticateAdmin, async (req, res) => {
    try {
        const monthlyGrowth = await getMonthlyCustomerGrowth();
        res.json(monthlyGrowth);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching customer growth data' });
    }
});

// Get News Interests Distribution
router.get('/stats/news-interests', authenticateAdmin, async (req, res) => {
    try {
        const interests = await getNewsInterestsDistribution();
        res.json(interests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching news interests data' });
    }
});

// Get Agency Performance
router.get('/stats/agency-performance', authenticateAdmin, async (req, res) => {
    try {
        const performance = await getAgencyPerformance();
        res.json(performance);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching agency performance data' });
    }
});

// Add New Agency
router.post('/agencies', authenticateAdmin, async (req, res) => {
    try {
        // Generate credentials
        const password = generatePassword();
        const agencyCode = await generateAgencyCode(Agency);
        
        // Create agency with generated credentials
        const agency = await Agency.create({
            ...req.body,
            agencyCode,
            password: await bcrypt.hash(password, 10)
        });

        // Send credentials via email
        const emailSent = await sendAgencyCredentials(
            req.body.email,
            req.body.name,
            agencyCode,
            password
        );

        if (!emailSent) {
            // If email fails, delete the agency and return error
            await Agency.findByIdAndDelete(agency._id);
            return res.status(500).json({ 
                message: 'Agency creation failed due to email sending error' 
            });
        }

        res.status(201).json({ 
            message: 'Agency created successfully. Credentials sent via email.',
            agency: {
                ...agency.toObject(),
                password: undefined // Don't send password in response
            }
        });
    } catch (error) {
        console.error('Agency creation error:', error);
        res.status(500).json({ message: 'Error creating agency' });
    }
});

// Get All Agencies
router.get('/agencies', authenticateAdmin, async (req, res) => {
    try {
        const agencies = await Agency.find();
        res.json(agencies);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching agencies' });
    }
});

// Server Status
router.get('/server/status', authenticateAdmin, adminController.getServerStatus);

// Toggle Server Status
router.post('/server/toggle', authenticateAdmin, adminController.toggleServer);

// Server Metrics
router.get('/server/metrics', authenticateAdmin, adminController.getMetrics);

// Server Logs
router.get('/server/logs', authenticateAdmin, adminController.getLogs);

router.delete('/server/logs', authenticateAdmin, (req, res) => {
    global.serverLogs = [];
    res.json({ message: 'Logs cleared successfully' });
});

// Helper function to get dashboard statistics
async function getDashboardStats() {
    const totalCustomers = await User.countDocuments();
    const activeAgencies = await Agency.countDocuments({ status: 'active' });
    const totalRevenue = await calculateTotalRevenue();
    const activeSubscriptions = await User.countDocuments({ status: 'active' });

    return {
        totalCustomers,
        activeAgencies,
        totalRevenue,
        activeSubscriptions
    };
}

// Helper function to get monthly customer growth
async function getMonthlyCustomerGrowth() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await User.aggregate([
        {
            $match: {
                createdAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        }
    ]);

    return monthlyData;
}

// Helper function to get news interests distribution
async function getNewsInterestsDistribution() {
    return await User.aggregate([
        { $unwind: '$newsInterests' },
        {
            $group: {
                _id: '$newsInterests',
                count: { $sum: 1 }
            }
        }
    ]);
}

// Helper function to get agency performance
async function getAgencyPerformance() {
    return await Agency.aggregate([
        {
            $project: {
                name: 1,
                subscriptionCount: 1,
                revenue: 1
            }
        },
        {
            $sort: { subscriptionCount: -1 }
        },
        {
            $limit: 6
        }
    ]);
}

// Helper function to calculate total revenue
async function calculateTotalRevenue() {
    const result = await Agency.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$revenue' }
            }
        }
    ]);
    return result[0]?.totalRevenue || 0;
}

// Helper function to get active connections
function getActiveConnections() {
    return require('http').globalAgent.sockets || [];
}

// Admin Authentication Middleware
function authenticateAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'abc123');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
}

// Get Single Agency
router.get('/agencies/:id', authenticateAdmin, async (req, res) => {
    try {
        const agency = await Agency.findById(req.params.id);
        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }
        res.json(agency);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching agency' });
    }
});

// Update Agency
router.put('/agencies/:id', authenticateAdmin, async (req, res) => {
    try {
        const agency = await Agency.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }
        res.json(agency);
    } catch (error) {
        res.status(500).json({ message: 'Error updating agency' });
    }
});

// Update Agency Status
router.put('/agencies/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const agency = await Agency.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }
        res.json(agency);
    } catch (error) {
        res.status(500).json({ message: 'Error updating agency status' });
    }
});

// Delete Agency
router.delete('/agencies/:id', authenticateAdmin, async (req, res) => {
    try {
        const agency = await Agency.findByIdAndDelete(req.params.id);
        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }
        res.json({ message: 'Agency deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting agency' });
    }
});

// Add this route to your existing adminRoutes.js
router.get('/analytics', authenticateAdmin, async (req, res) => {
    try {
        const startDate = req.query.start ? new Date(req.query.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.end ? new Date(req.query.end) : new Date();

        const analyticsData = await getAnalyticsData(startDate, endDate);
        res.json(analyticsData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics data' });
    }
});

// Helper function to get analytics data
async function getAnalyticsData(startDate, endDate) {
    // Implement your analytics data gathering logic here
    return {
        revenue: {
            // Revenue data
        },
        subscriptions: {
            // Subscription data
        },
        newspapers: {
            // Newspaper popularity data
        },
        demographics: {
            // Demographics data
        }
    };
}

module.exports = router; 