const mongoose = require('mongoose');

const trialLicenseGrantSchema = new mongoose.Schema({
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
    source: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    tokenId: {
        type: String,
        required: true,
        trim: true,
    },
    claimRef: {
        type: String,
        default: '',
        trim: true,
    },
    apps: {
        type: [String],
        default: [],
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    revokedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

trialLicenseGrantSchema.index({ userId: 1, source: 1, revokedAt: 1, expiresAt: 1 });

module.exports = mongoose.model('TrialLicenseGrant', trialLicenseGrantSchema);
