const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;

const extractBearerToken = (req) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7).trim();
};

const requireAuth = async (req, res, next) => {
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

        req.user = {
            id: user._id.toString(),
            username: user.username,
            role: user.role,
            projects: user.projects,
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
