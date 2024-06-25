const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    projects: { type: [String], default: ['testing'], required: true } // Array of projects
});

module.exports = mongoose.model('oauth4.0', userSchema);
