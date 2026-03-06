const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
    hasBreakGlassToken,
    BREAK_GLASS_USERNAME,
    BREAK_GLASS_APP_ID,
} = require('../config/safety');

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const normalizeAppId = (appId) => String(appId || '').trim().toLowerCase();
const normalizeAppList = (appIds) => [...new Set((appIds || []).map(normalizeAppId).filter(Boolean))];

const extractBearerToken = (req) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7).trim();
};

const requireAuth = async (req, res, next) => {
    if (hasBreakGlassToken(req)) {
        const breakGlassProjects = BREAK_GLASS_APP_ID ? [BREAK_GLASS_APP_ID] : [];
        req.user = {
            id: 'break-glass',
            username: BREAK_GLASS_USERNAME,
            role: 'admin',
            projects: breakGlassProjects,
            appId: BREAK_GLASS_APP_ID || null,
            isBreakGlass: true,
        };
        return next();
    }

    if (!ACCESS_TOKEN_SECRET) {
        return res.status(500).json({ success: false, message: 'Server auth configuration is missing' });
    }

    const token = extractBearerToken(req);
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const user = await User.findById(payload.sub).select('username role projects tokenVersion');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid authentication token' });
        }

        if (payload.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ success: false, message: 'Session has expired. Please login again.' });
        }

        const userAppIds = (user.projects || []).map(normalizeAppId);
        const tokenScopedApps = normalizeAppList(payload.projects || payload.apps);
        const effectiveApps = normalizeAppList([...userAppIds, ...tokenScopedApps]);
        const isTrialGrant = payload.trialGrant === true;
        const normalizedPayloadAppId = normalizeAppId(payload.appId);

        if (
            payload.appId &&
            normalizedPayloadAppId !== '*' &&
            !effectiveApps.includes(normalizedPayloadAppId) &&
            !isTrialGrant
        ) {
            return res.status(403).json({ success: false, message: 'Access to this app has been revoked' });
        }

        req.user = {
            id: user._id.toString(),
            username: user.username,
            role: user.role,
            projects: effectiveApps,
            appId: payload.appId || null,
            isTrialGrant,
        };

        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
    }
};

const requireRole = (roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    return next();
};

module.exports = {
    requireAuth,
    requireRole,
};
