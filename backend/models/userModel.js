const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const familyMemberSchema = new mongoose.Schema({
    relation: String,
    age: Number,
    qualification: String,
    education: String
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    fullAddress: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true,
        trim: true
    },
    agencyCode: {
        type: String,
        required: true,
        trim: true
    },
    newsInterests: [{
        type: String,
        enum: ['sports', 'politics', 'technology', 'entertainment', 'business']
    }],
    geoLocation: {
        latitude: Number,
        longitude: Number
    },
    familySize: {
        type: Number,
        default: 0
    },
    familyMembers: [familyMemberSchema],
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User; 