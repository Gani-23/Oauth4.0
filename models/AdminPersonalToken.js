const mongoose = require('mongoose');

const adminPersonalTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    tokenId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
    },
    label: {
        type: String,
        trim: true,
        maxlength: 100,
        default: 'primary-admin-token',
    },
    tokenHash: {
        type: String,
        required: true,
        select: false,
    },
    revokedAt: {
        type: Date,
        default: null,
    },
    revokedReason: {
        type: String,
        trim: true,
        maxlength: 200,
        default: '',
    },
    lastUsedAt: {
        type: Date,
        default: null,
    },
    lastUsedIp: {
        type: String,
        trim: true,
        maxlength: 100,
        default: '',
    },
}, { timestamps: true });

module.exports = mongoose.model('admin_personal_tokens', adminPersonalTokenSchema);
