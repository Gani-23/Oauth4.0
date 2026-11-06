const mongoose = require('mongoose');

const renewalRequestSchema = new mongoose.Schema(
    {
        requestId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        appId: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        username: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        userEmail: {
            type: String,
            trim: true,
            default: null,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'declined'],
            default: 'pending',
            index: true,
        },
        reason: {
            type: String,
            default: '',
        },
        approvedDays: {
            type: Number,
            default: 0,
        },
        newLicenseToken: {
            type: String,
            default: null,
        },
        newExpiresAt: {
            type: Date,
            default: null,
        },
        telegramMessageId: {
            type: Number,
            default: null,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { versionKey: false },
);

// TTL index: auto-delete completed/stale renewal requests after 60 days
renewalRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

module.exports = mongoose.model('RenewalRequest', renewalRequestSchema);
