const buffer = require('buffer');
if (!buffer.SlowBuffer) {
    buffer.SlowBuffer = function SlowBuffer() {};
    buffer.SlowBuffer.prototype = {};
}

require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const TrialLicenseGrant = require('../models/TrialLicenseGrant');

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

if (!ACCESS_TOKEN_SECRET || !MONGODB_URI) {
    console.error('Missing JWT_ACCESS_SECRET or MONGODB_URI in environment variables.');
    process.exit(1);
}

// Year 2099-12-31 23:59:59 UTC timestamp
const EXP_2099 = 4102444799;

async function generateLicense({
    username = 'ganiadmin',
    appId = 'agentbuddy',
    expiresAtUnix = EXP_2099,
    source = 'agentbuddy_lifetime',
}) {
    await mongoose.connect(MONGODB_URI);

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
        console.error(`User '${username}' not found in database.`);
        await mongoose.disconnect();
        process.exit(1);
    }

    // Ensure the user has the app in their projects list
    if (!user.projects || !user.projects.includes(appId)) {
        await User.updateOne({ _id: user._id }, { $addToSet: { projects: appId } });
    }

    const tokenId = `license-${appId}-lifetime`;
    const expiresAtDate = new Date(expiresAtUnix * 1000);

    // Save/update permanent grant in database
    await TrialLicenseGrant.findOneAndUpdate(
        { userId: user._id, tokenId },
        {
            userId: user._id,
            username: user.username,
            source,
            tokenId,
            claimRef: `${appId}-lifetime-license`,
            apps: [appId],
            expiresAt: expiresAtDate,
            revokedAt: null,
        },
        { upsert: true, new: true }
    );

    const payload = {
        sub: user._id.toString(),
        username: user.username,
        role: user.role,
        projects: [appId],
        tokenVersion: user.tokenVersion,
        appId: appId,
        trialGrant: true,
        trialSource: source,
        trialTokenId: tokenId,
        exp: expiresAtUnix,
    };

    const licenseToken = jwt.sign(payload, ACCESS_TOKEN_SECRET);

    console.log('================================================================');
    console.log(`LIFETIME LICENSE TOKEN FOR: ${appId.toUpperCase()}`);
    console.log('================================================================');
    console.log(`User:         ${user.username} (${user.email})`);
    console.log(`App Scope:    ${appId}`);
    console.log(`Expires At:   ${expiresAtDate.toUTCString()} (Unix: ${expiresAtUnix})`);
    console.log(`Valid In:     AgentBuddy (Online & Offline modes)`);
    console.log('\n--- PASTE THIS TOKEN INTO AGENTBUDDY ---');
    console.log(licenseToken);
    console.log('----------------------------------------\n');

    await mongoose.disconnect();
    return licenseToken;
}

const targetUser = process.argv[2] || 'ganiadmin';
const targetApp = process.argv[3] || 'agentbuddy';
const daysArg = process.argv[4];

const isLifetime = !daysArg || daysArg === 'lifetime' || daysArg === 'never' || Number(daysArg) >= 36500;
const days = isLifetime ? 36500 : Math.max(1, Number(daysArg) || 30);
const targetExpUnix = isLifetime ? EXP_2099 : Math.floor((Date.now() + days * 86400000) / 1000);

generateLicense({ username: targetUser, appId: targetApp, expiresAtUnix: targetExpUnix })
    .catch((err) => {
        console.error('Error generating license:', err.message);
        process.exit(1);
    });
