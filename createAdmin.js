const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB using the MONGO_URI from .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Admin Schema
const adminSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: {
        type: String,
        default: 'admin'
    }
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Create new admin
        const newAdmin = new Admin({
            email: 'admin@ratib.com',
            password: hashedPassword,
            role: 'admin'
        });

        // Save admin to database
        await newAdmin.save();
        console.log('Admin created successfully!');
        console.log('Email: admin@ratib.com');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        mongoose.connection.close();
    }
}

createAdmin();