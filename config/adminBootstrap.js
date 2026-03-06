const bcrypt = require('bcryptjs');
const User = require('../models/User');

const normalizeUsername = (value) => String(value || '').trim().toLowerCase();
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeAppId = (value) => String(value || '').trim().toLowerCase();
const normalizeAppList = (values) => [...new Set((values || []).map(normalizeAppId).filter(Boolean))];

const isStrongPassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,128}$/.test(password);

const ensureBootstrapAdmin = async () => {
    const enabled = String(process.env.ADMIN_BOOTSTRAP_ENABLED || 'true').toLowerCase() !== 'false';
    if (!enabled) {
        return;
    }

    const username = normalizeUsername(process.env.ADMIN_BOOTSTRAP_USERNAME);
    const email = normalizeEmail(process.env.ADMIN_BOOTSTRAP_EMAIL);
    const name = String(process.env.ADMIN_BOOTSTRAP_NAME || 'Platform Admin').trim();
    const password = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '');
    const bootstrapApps = normalizeAppList(String(process.env.ADMIN_BOOTSTRAP_APPS || '').split(','));
    const forcePasswordSync = String(process.env.ADMIN_BOOTSTRAP_FORCE_PASSWORD_SYNC || 'false').toLowerCase() === 'true';
    const rounds = Math.max(10, Number(process.env.BCRYPT_ROUNDS || 12));

    if (!username || !email || !password) {
        console.warn('[admin-bootstrap] Skipped: set ADMIN_BOOTSTRAP_USERNAME, ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD');
        return;
    }

    if (!isStrongPassword(password)) {
        console.warn('[admin-bootstrap] Skipped: ADMIN_BOOTSTRAP_PASSWORD must be 12+ chars with upper/lower/number/special');
        return;
    }

    const passwordHash = await bcrypt.hash(password, rounds);
    const existing = await User.findOne({
        $or: [{ username }, { email }],
    }).select('+password role projects username email name');

    if (!existing) {
        await User.create({
            name,
            username,
            email,
            password: passwordHash,
            role: 'admin',
            projects: bootstrapApps,
        });
        console.log(`[admin-bootstrap] Created admin '${username}'`);
        return;
    }

    let changed = false;
    if (existing.role !== 'admin') {
        existing.role = 'admin';
        changed = true;
    }

    if (existing.username !== username) {
        existing.username = username;
        changed = true;
    }

    if (existing.email !== email) {
        existing.email = email;
        changed = true;
    }

    if (existing.name !== name && name.length >= 2) {
        existing.name = name;
        changed = true;
    }

    if (bootstrapApps.length > 0) {
        const mergedApps = normalizeAppList([...(existing.projects || []), ...bootstrapApps]);
        if (mergedApps.join(',') !== normalizeAppList(existing.projects).join(',')) {
            existing.projects = mergedApps;
            changed = true;
        }
    }

    if (forcePasswordSync) {
        existing.password = passwordHash;
        existing.tokenVersion = (Number(existing.tokenVersion) || 0) + 1;
        existing.refreshTokenHash = null;
        existing.refreshTokenExpiresAt = null;
        changed = true;
    }

    if (changed) {
        await existing.save();
        console.log(`[admin-bootstrap] Updated admin '${existing.username}'`);
    } else {
        console.log(`[admin-bootstrap] Admin '${existing.username}' already configured`);
    }
};

module.exports = {
    ensureBootstrapAdmin,
};
