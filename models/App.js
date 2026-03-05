const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
    appId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 2,
        maxlength: 100,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120,
    },
    appUrl: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    description: {
        type: String,
        trim: true,
        maxlength: 300,
        default: '',
    },
}, { timestamps: true });

module.exports = mongoose.model('App', appSchema);
