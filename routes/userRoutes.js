const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Counter, Histogram, Registry, Gauge } = require('prom-client');
const osu = require('node-os-utils');
const winston = require('winston');
const LokiTransport = require('winston-loki');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const metricsRegistry = new Registry();

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);
const REFRESH_TOKEN_EXPIRES_IN = `${REFRESH_TOKEN_TTL_DAYS}d`;
const REFRESH_TOKEN_MAX_AGE_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
    console.warn('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET should be set in environment variables.');
}

// Initialize logger for Loki
const logger = winston.createLogger({
    transports: [
        new LokiTransport({
            host: process.env.LOKI_HOST || 'http://49.121.3.2:3100',
            json: true,
            level: 'info',
        }),
    ],
});

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again in 15 minutes',
});

const PROJECT_URLS = {
    testing: 'https://www.example.com/project1',
    project2: 'https://www.example.com/project2',
    KrushiGowrava: '/store',
    krushigowrava: '/store',
    musicApp: '/GenAI',
    krick: '/krick',
};

const ALLOWED_PROJECTS = Object.keys(PROJECT_URLS);

// Metrics
const httpRequestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
});
metricsRegistry.registerMetric(httpRequestCounter);

const httpRequestDurationMicroseconds = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
});
metricsRegistry.registerMetric(httpRequestDurationMicroseconds);

const memoryUsageGauge = new Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
});
metricsRegistry.registerMetric(memoryUsageGauge);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeUsername = (username) => String(username || '').trim().toLowerCase();

const isStrongPassword = (password) => {
    if (typeof password !== 'string') {
        return false;
    }
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,128}$/.test(password);
};

const parseCookies = (cookieHeader) => {
    if (!cookieHeader) {
        return {};
    }

    return cookieHeader.split(';').reduce((acc, cookie) => {
        const [rawKey, ...rawValue] = cookie.trim().split('=');
        if (!rawKey) {
            return acc;
        }
        acc[rawKey] = decodeURIComponent(rawValue.join('='));
        return acc;
    }, {});
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const issueAccessToken = (user) => jwt.sign(
    {
        sub: user._id.toString(),
        username: user.username,
        role: user.role,
        projects: user.projects,
        tokenVersion: user.tokenVersion,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
);

const issueRefreshToken = (user) => jwt.sign(
    {
        sub: user._id.toString(),
        tokenVersion: user.tokenVersion,
        type: 'refresh',
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
);

const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/users/auth/refresh',
        maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
};

const clearRefreshTokenCookie = (res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/users/auth/refresh',
    });
};

// Update system metrics periodically
const metricsInterval = setInterval(async () => {
    try {
        const mem = await osu.mem.info();
        memoryUsageGauge.set(mem.usedMem);
    } catch (error) {
        logger.error('Failed to retrieve memory info', { error: error.message });
    }
}, 5000);
metricsInterval.unref();

// Middleware for logging and metrics
router.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    const routeLabel = `${req.baseUrl || ''}${req.path}`;

    res.on('finish', () => {
        const labels = { method: req.method, route: routeLabel, status: String(res.statusCode) };
        httpRequestCounter.inc(labels);
        end(labels);
        logger.info(`Request: ${req.method} ${req.url} - Status: ${res.statusCode}`);
    });

    next();
});

// Test route
router.get('/', async (req, res) => {
    res.send('Hello World');
});

// Registration route
router.post('/register', authLimiter, async (req, res) => {
    const {
        name,
        username,
        email,
        password,
        projects,
    } = req.body || {};

    try {
        if (!name || !username || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields in request body' });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be 12+ chars with upper, lower, number, and special character',
            });
        }

        const normalizedUsername = normalizeUsername(username);
        const normalizedEmail = normalizeEmail(email);
        const safeProjectsInput = Array.isArray(projects) ? projects : ['testing'];
        const normalizedProjects = [...new Set(safeProjectsInput.filter((project) => ALLOWED_PROJECTS.includes(project)))];
        const userProjects = normalizedProjects.length > 0 ? normalizedProjects : ['testing'];

        const existingUser = await User.findOne({
            $or: [
                { username: normalizedUsername },
                { email: normalizedEmail },
            ],
        });

        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const newUser = new User({
            name: String(name).trim(),
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'user',
            projects: userProjects,
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: newUser._id,
        });
    } catch (error) {
        logger.error('Error registering user', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Error registering new user',
        });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    const { email, password, project } = req.body || {};

    try {
        if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
            return res.status(500).json({ success: false, message: 'Server auth configuration is missing' });
        }

        if (!email || !password || !project) {
            return res.status(400).json({ success: false, message: 'Missing email, password, or project' });
        }

        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({ email: normalizedEmail })
            .select('+password +refreshTokenHash +refreshTokenExpiresAt tokenVersion');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.projects.includes(project)) {
            return res.status(403).json({ success: false, message: "You don't have access to this project" });
        }

        const projectUrl = PROJECT_URLS[project];
        if (!projectUrl) {
            return res.status(403).json({ success: false, message: 'Project is not available' });
        }

        const accessToken = issueAccessToken(user);
        const refreshToken = issueRefreshToken(user);

        user.refreshTokenHash = hashToken(refreshToken);
        user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
        await user.save();

        setRefreshTokenCookie(res, refreshToken);

        return res.json({
            success: true,
            accessToken,
            tokenType: 'Bearer',
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
            username: user.username,
            project_url: projectUrl,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                projects: user.projects,
            },
        });
    } catch (error) {
        logger.error('Login error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/auth/refresh', authLimiter, async (req, res) => {
    try {
        if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
            return res.status(500).json({ success: false, message: 'Server auth configuration is missing' });
        }

        const cookies = parseCookies(req.headers.cookie);
        const refreshToken = cookies.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token is required' });
        }

        const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        if (payload.type !== 'refresh') {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const user = await User.findById(payload.sub)
            .select('+refreshTokenHash +refreshTokenExpiresAt tokenVersion username role projects');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        if (payload.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ success: false, message: 'Session expired. Login again.' });
        }

        if (!user.refreshTokenHash || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
            return res.status(401).json({ success: false, message: 'Refresh token expired' });
        }

        if (hashToken(refreshToken) !== user.refreshTokenHash) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const newRefreshToken = issueRefreshToken(user);
        user.refreshTokenHash = hashToken(newRefreshToken);
        user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
        await user.save();

        setRefreshTokenCookie(res, newRefreshToken);

        const accessToken = issueAccessToken(user);
        return res.json({
            success: true,
            accessToken,
            tokenType: 'Bearer',
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        });
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
});

router.post('/logout', requireAuth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            refreshTokenHash: null,
            refreshTokenExpiresAt: null,
        });
        clearRefreshTokenCookie(res);

        return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Logout failed' });
    }
});

// PUT: Update password by username
router.put('/update-password/:username', requireAuth, authLimiter, async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    const username = normalizeUsername(req.params.username);
    const isAdmin = req.user.role === 'admin';
    const isOwnAccount = req.user.username === username;

    try {
        if (!isAdmin && !isOwnAccount) {
            return res.status(403).json({ success: false, message: 'You can only update your own password' });
        }

        if (!newPassword) {
            return res.status(400).json({ success: false, message: 'New password is required' });
        }

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be 12+ chars with upper, lower, number, and special character',
            });
        }

        const user = await User.findOne({ username })
            .select('+password +refreshTokenHash +refreshTokenExpiresAt tokenVersion');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!isAdmin) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }
        }

        user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        user.tokenVersion += 1;
        user.refreshTokenHash = null;
        user.refreshTokenExpiresAt = null;
        await user.save();

        clearRefreshTokenCookie(res);

        return res.json({ success: true, message: 'Password updated successfully. Please login again.' });
    } catch (error) {
        logger.error('Error updating password', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error updating password' });
    }
});

// PUT: Update name by username
router.put('/update-name/:username', requireAuth, async (req, res) => {
    const { newName } = req.body || {};
    const username = normalizeUsername(req.params.username);
    const isAdmin = req.user.role === 'admin';
    const isOwnAccount = req.user.username === username;

    try {
        if (!isAdmin && !isOwnAccount) {
            return res.status(403).json({ success: false, message: 'You can only update your own profile' });
        }

        if (!newName || String(newName).trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Valid new name is required' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { username },
            { name: String(newName).trim() },
            { new: true },
        ).select('name username email role projects');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({
            success: true,
            message: 'Name updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        logger.error('Error updating name', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error updating name' });
    }
});

// DELETE: User by username or email
router.delete('/delete-user/:usernameOrEmail', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const identifier = String(req.params.usernameOrEmail || '').trim().toLowerCase();
        const user = await User.findOneAndDelete({
            $or: [
                { username: identifier },
                { email: identifier },
            ],
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Error deleting user', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error deleting user' });
    }
});

// Route to expose metrics
router.get('/metrics', requireAuth, requireRole(['admin']), async (req, res) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
});

module.exports = router;
