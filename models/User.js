const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 30,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    projects: {
        type: [String],
        default: [],
        required: true,
    },
    tokenVersion: {
        type: Number,
        default: 0,
    },
    refreshTokenHash: {
        type: String,
        default: null,
        select: false,
    },
    refreshTokenExpiresAt: {
        type: Date,
        default: null,
        select: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('oauth4.0', userSchema);
