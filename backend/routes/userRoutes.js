const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register User
router.post('/register', async (req, res) => {
    try {
        const {
            email,
            username,
            password,
            confirmPassword,
            captcha,
            address: fullAddress,
            mobileNumber,
            agencyCode,
            interests: newsInterests,
            familySize,
            familyMembers
        } = req.body;

        // Validate password match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Validate captcha (implement your captcha validation logic here)
        if (!validateCaptcha(captcha)) {
            return res.status(400).json({ message: 'Invalid captcha' });
        }

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ 
                message: userExists.email === email ? 
                    'Email already registered' : 
                    'Username already taken' 
            });
        }

        // Create user
        const user = await User.create({
            email,
            username,
            password,
            fullAddress,
            mobileNumber,
            agencyCode,
            newsInterests,
            familySize: parseInt(familySize) || 0,
            familyMembers: parseFamilyMembers(familyMembers)
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                email: user.email,
                username: user.username,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Registration failed', 
            error: error.message 
        });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                email: user.email,
                username: user.username,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ 
            message: 'Login failed', 
            error: error.message 
        });
    }
});

// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Helper Functions
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'abc123', {
        expiresIn: '30d',
    });
};

const validateCaptcha = (captchaValue) => {
    // Implement your captcha validation logic here
    // For development, return true
    return true;
};

const parseFamilyMembers = (familyMembersString) => {
    if (!familyMembersString) return [];
    
    try {
        // Parse the family members string into structured data
        return familyMembersString.split(';')
            .map(member => {
                const [relation, details] = member.split(':').map(s => s.trim());
                const [age, ...eduDetails] = details.split(',').map(s => s.trim());
                return {
                    relation: relation,
                    age: parseInt(age),
                    qualification: eduDetails[0] || '',
                    education: eduDetails[1] || ''
                };
            })
            .filter(member => member.relation && member.age);
    } catch (error) {
        console.error('Error parsing family members:', error);
        return [];
    }
};

// Middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'abc123', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

module.exports = router; 