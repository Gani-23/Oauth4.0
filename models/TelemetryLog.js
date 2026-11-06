const mongoose = require('mongoose');

const telemetryLogSchema = new mongoose.Schema(
    {
        appId: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        eventType: {
            type: String,
            required: true,
            enum: ['heartbeat', 'crash', 'license_check', 'auth_event', 'system'],
            index: true,
        },
        user: {
            type: String,
            trim: true,
            default: null,
        },
        version: {
            type: String,
            trim: true,
            default: null,
        },
        os: {
            type: String,
            trim: true,
            default: null,
        },
        ip: {
            type: String,
            trim: true,
            default: null,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { versionKey: false },
);

// TTL Index: Automatically expires and purges documents after 60 days (2 months)
// 60 days * 24 hours * 60 mins * 60 secs = 5,184,000 seconds
telemetryLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

module.exports = mongoose.model('TelemetryLog', telemetryLogSchema);
