const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    agencyCode: {
        type: String,
        required: true,
        unique: true
    },
    contact: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    newspapers: [{
        type: String,
        required: true
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    subscriptionCount: {
        type: Number,
        default: 0
    },
    revenue: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Agency = mongoose.model('Agency', agencySchema);
module.exports = Agency; 