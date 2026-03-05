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
const App = require('../models/App');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
    AUTH_TEST_MODE,
    hasBreakGlassToken,
    adminIpGuard,
    authGuardMiddleware,
    recordAuthAttempt,
    resetSafetyGuard,
    getSafetySnapshot,
    getFeatureFlags,
    setFeatureFlag,
    isFeatureEnabled,
} = require('../config/safety');

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

const lokiHost = String(process.env.LOKI_HOST || '').trim();
const loggerTransports = [
    new winston.transports.Console({
        level: 'info',
    }),
];

if (lokiHost && lokiHost !== '#') {
    loggerTransports.push(
        new LokiTransport({
            host: lokiHost,
            json: true,
            level: 'info',
        }),
    );
}

const logger = winston.createLogger({
    level: 'info',
    transports: loggerTransports,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again in 15 minutes',
    skip: (req) => AUTH_TEST_MODE && hasBreakGlassToken(req),
});

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
const BYTES_PER_MB = 1024 * 1024;
const METRICS_INTERVAL_MS = Math.max(5000, Number(process.env.SYSTEM_METRICS_INTERVAL_MS || 15000));
const METRICS_ERROR_LOG_THROTTLE_MS = Math.max(10000, Number(process.env.SYSTEM_METRICS_ERROR_THROTTLE_MS || 60000));
const SYSTEM_METRICS_ENABLED = String(process.env.SYSTEM_METRICS_ENABLED || 'true').toLowerCase() !== 'false';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeUsername = (username) => String(username || '').trim().toLowerCase();
const normalizeAppId = (appId) => String(appId || '').trim().toLowerCase();
const normalizeAppList = (appIds) => [...new Set((appIds || []).map(normalizeAppId).filter(Boolean))];

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

const issueAccessToken = (user, appId) => jwt.sign(
    {
        sub: user._id.toString(),
        username: user.username,
        role: user.role,
        projects: user.projects,
        tokenVersion: user.tokenVersion,
        appId,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN, audience: appId },
);

const issueRefreshToken = (user, appId) => jwt.sign(
    {
        sub: user._id.toString(),
        tokenVersion: user.tokenVersion,
        type: 'refresh',
        appId,
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

const getAppsMap = async ({ includeInactive = false } = {}) => {
    const appsMap = new Map();

    const dbQuery = includeInactive ? {} : { status: 'active' };
    const dbApps = await App.find(dbQuery)
        .select('appId name appUrl description status')
        .lean();

    dbApps.forEach((app) => {
        appsMap.set(app.appId, {
            appId: app.appId,
            name: app.name,
            appUrl: app.appUrl,
            description: app.description || '',
            status: app.status,
        });
    });

    return appsMap;
};

const requireAdminSafe = [requireAuth, requireRole(['admin']), adminIpGuard];

const getUsedMemoryBytes = (mem) => {
    if (!mem || typeof mem !== 'object') {
        return null;
    }

    if (Number.isFinite(mem.usedMem)) {
        return Number(mem.usedMem);
    }

    if (Number.isFinite(mem.usedMemMb)) {
        return Number(mem.usedMemMb) * BYTES_PER_MB;
    }

    return null;
};

let lastMetricsErrorAt = 0;
const logMetricsIssue = (message, meta = {}) => {
    const now = Date.now();
    if ((now - lastMetricsErrorAt) < METRICS_ERROR_LOG_THROTTLE_MS) {
        return;
    }
    lastMetricsErrorAt = now;
    logger.warn(message, meta);
};

if (SYSTEM_METRICS_ENABLED) {
    const metricsInterval = setInterval(async () => {
        try {
            const mem = await osu.mem.info();
            const usedBytes = getUsedMemoryBytes(mem);

            if (!Number.isFinite(usedBytes) || usedBytes < 0) {
                logMetricsIssue('Skipping memory gauge update due to invalid memory payload', {
                    keys: Object.keys(mem || {}),
                });
                return;
            }

            memoryUsageGauge.set(usedBytes);
        } catch (error) {
            logMetricsIssue('Failed to retrieve memory info', { error: error.message });
        }
    }, METRICS_INTERVAL_MS);
    metricsInterval.unref();
}

router.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    const routeLabel = `${req.baseUrl || ''}${req.path}`;

    res.on('finish', () => {
        const labels = { method: req.method, route: routeLabel, status: String(res.statusCode) };
        httpRequestCounter.inc(labels);
        end(labels);
        logger.info(`Request: ${req.method} ${req.url} - Status: ${res.statusCode} - testRun: ${req.testRunId || '-'}`);
    });

    next();
});

router.get('/', async (req, res) => {
    res.send('Hello World');
});

router.post('/register', authGuardMiddleware, authLimiter, async (req, res) => {
    const {
        name,
        username,
        email,
        password,
        projects,
        apps,
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
        const appsMap = await getAppsMap();
        const allowedAppIds = new Set([...appsMap.keys()]);
        const requestedApps = Array.isArray(apps) ? apps : projects;
        const normalizedApps = normalizeAppList(requestedApps).filter((appId) => allowedAppIds.has(appId));

        if (Array.isArray(requestedApps) && requestedApps.length > 0 && normalizedApps.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'None of the provided apps exist. Admin must create apps first.',
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { username: normalizedUsername },
                { email: normalizedEmail },
            ],
        });

        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Username or email already exists' });
        }

        const userApps = normalizedApps;
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const newUser = new User({
            name: String(name).trim(),
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'user',
            projects: userApps,
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: newUser._id,
            apps: userApps,
        });
    } catch (error) {
        logger.error('Error registering user', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Error registering new user',
        });
    }
});

router.post('/login', authGuardMiddleware, authLimiter, async (req, res) => {
    const {
        email,
        password,
        appId,
        project,
    } = req.body || {};

    try {
        if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
            return res.status(500).json({ success: false, message: 'Server auth configuration is missing' });
        }

        const requestedAppId = normalizeAppId(appId || project);
        if (!email || !password || !requestedAppId) {
            return res.status(400).json({ success: false, message: 'Missing email, password, or appId' });
        }

        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({ email: normalizedEmail })
            .select('+password +refreshTokenHash +refreshTokenExpiresAt tokenVersion');

        if (!user) {
            recordAuthAttempt(false, 'login');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            recordAuthAttempt(false, 'login');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const userAppIds = normalizeAppList(user.projects);
        if (!userAppIds.includes(requestedAppId)) {
            return res.status(403).json({ success: false, message: "You don't have access to this app" });
        }

        const appsMap = await getAppsMap();
        const targetApp = appsMap.get(requestedAppId);
        if (!targetApp || targetApp.status !== 'active') {
            return res.status(403).json({ success: false, message: 'App is not available' });
        }

        const accessToken = issueAccessToken(user, requestedAppId);
        const refreshToken = issueRefreshToken(user, requestedAppId);

        user.refreshTokenHash = hashToken(refreshToken);
        user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
        await user.save();

        setRefreshTokenCookie(res, refreshToken);
        recordAuthAttempt(true, 'login');

        return res.json({
            success: true,
            accessToken,
            tokenType: 'Bearer',
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
            username: user.username,
            app_id: targetApp.appId,
            app: targetApp,
            project_url: targetApp.appUrl,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                apps: userAppIds,
                projects: userAppIds,
            },
        });
    } catch (error) {
        logger.error('Login error', { error: error.message });
        recordAuthAttempt(false, 'login');
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/auth/refresh', authGuardMiddleware, authLimiter, async (req, res) => {
    try {
        if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
            return res.status(500).json({ success: false, message: 'Server auth configuration is missing' });
        }

        const cookies = parseCookies(req.headers.cookie);
        const refreshToken = cookies.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            recordAuthAttempt(false, 'refresh');
            return res.status(401).json({ success: false, message: 'Refresh token is required' });
        }

        const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        if (payload.type !== 'refresh') {
            recordAuthAttempt(false, 'refresh');
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const requestedAppId = normalizeAppId(req.body?.appId || req.body?.project || payload.appId);
        if (!requestedAppId || requestedAppId !== payload.appId) {
            recordAuthAttempt(false, 'refresh');
            return res.status(401).json({ success: false, message: 'Refresh token app mismatch' });
        }

        const user = await User.findById(payload.sub)
            .select('+refreshTokenHash +refreshTokenExpiresAt tokenVersion username role projects');

        if (!user) {
            recordAuthAttempt(false, 'refresh');
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        if (payload.tokenVersion !== user.tokenVersion) {
            recordAuthAttempt(false, 'refresh');
            return res.status(401).json({ success: false, message: 'Session expired. Login again.' });
        }

        if (!user.refreshTokenHash || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
            recordAuthAttempt(false, 'refresh');
            return res.status(401).json({ success: false, message: 'Refresh token expired' });
        }

        if (hashToken(refreshToken) !== user.refreshTokenHash) {
            recordAuthAttempt(false, 'refresh');
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const userAppIds = normalizeAppList(user.projects);
        if (!userAppIds.includes(requestedAppId)) {
            recordAuthAttempt(false, 'refresh');
            return res.status(403).json({ success: false, message: 'Access to this app has been revoked' });
        }

        const appsMap = await getAppsMap();
        const targetApp = appsMap.get(requestedAppId);
        if (!targetApp || targetApp.status !== 'active') {
            recordAuthAttempt(false, 'refresh');
            return res.status(403).json({ success: false, message: 'App is not available' });
        }

        const newRefreshToken = issueRefreshToken(user, requestedAppId);
        user.refreshTokenHash = hashToken(newRefreshToken);
        user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
        await user.save();

        setRefreshTokenCookie(res, newRefreshToken);

        const accessToken = issueAccessToken(user, requestedAppId);
        recordAuthAttempt(true, 'refresh');
        return res.json({
            success: true,
            accessToken,
            tokenType: 'Bearer',
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
            app_id: targetApp.appId,
            app: targetApp,
        });
    } catch (error) {
        recordAuthAttempt(false, 'refresh');
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

router.get('/apps', requireAuth, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            let allowed = false;
            adminIpGuard(req, res, () => {
                allowed = true;
            });
            if (!allowed) {
                return;
            }

            const appsMap = await getAppsMap({ includeInactive: true });
            return res.json({
                success: true,
                total: appsMap.size,
                apps: [...appsMap.values()],
            });
        }

        const appsMap = await getAppsMap();
        const apps = normalizeAppList(req.user.projects)
            .map((appId) => appsMap.get(appId))
            .filter(Boolean);

        return res.json({
            success: true,
            total: apps.length,
            apps,
        });
    } catch (error) {
        logger.error('Get apps error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error retrieving apps' });
    }
});

router.post('/apps', ...requireAdminSafe, async (req, res) => {
    const { appId, name, appUrl, description, status } = req.body || {};

    try {
        const normalizedAppId = normalizeAppId(appId);
        if (!normalizedAppId || !name || !appUrl) {
            return res.status(400).json({ success: false, message: 'appId, name and appUrl are required' });
        }

        const existing = await App.findOne({ appId: normalizedAppId });
        if (existing) {
            return res.status(409).json({ success: false, message: 'appId already exists' });
        }

        const createdApp = await App.create({
            appId: normalizedAppId,
            name: String(name).trim(),
            appUrl: String(appUrl).trim(),
            description: String(description || '').trim(),
            status: status === 'inactive' ? 'inactive' : 'active',
        });

        return res.status(201).json({
            success: true,
            message: 'App created successfully',
            app: createdApp,
        });
    } catch (error) {
        logger.error('Create app error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error creating app' });
    }
});

router.put('/apps/:appId/status', ...requireAdminSafe, async (req, res) => {
    try {
        const normalizedAppId = normalizeAppId(req.params.appId);
        const { status } = req.body || {};

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: 'status must be active or inactive' });
        }

        const updatedApp = await App.findOneAndUpdate(
            { appId: normalizedAppId },
            { status },
            { new: true },
        );

        if (!updatedApp) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        return res.json({
            success: true,
            message: 'App status updated successfully',
            app: updatedApp,
        });
    } catch (error) {
        logger.error('Update app status error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error updating app status' });
    }
});

router.put('/apps/:appId/assign/:username', ...requireAdminSafe, async (req, res) => {
    try {
        const normalizedAppId = normalizeAppId(req.params.appId);
        const normalizedUsername = normalizeUsername(req.params.username);

        const appsMap = await getAppsMap({ includeInactive: true });
        const targetApp = appsMap.get(normalizedAppId);
        if (!targetApp) {
            return res.status(404).json({ success: false, message: 'App not found' });
        }

        const user = await User.findOne({ username: normalizedUsername });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userAppIds = normalizeAppList(user.projects);
        if (!userAppIds.includes(normalizedAppId)) {
            user.projects = [...userAppIds, normalizedAppId];
            await user.save();
        }

        return res.json({
            success: true,
            message: 'App assigned successfully',
            username: user.username,
            apps: normalizeAppList(user.projects),
        });
    } catch (error) {
        logger.error('Assign app error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error assigning app' });
    }
});

router.put('/apps/:appId/unassign/:username', ...requireAdminSafe, async (req, res) => {
    try {
        const normalizedAppId = normalizeAppId(req.params.appId);
        const normalizedUsername = normalizeUsername(req.params.username);
        const user = await User.findOne({ username: normalizedUsername });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.projects = normalizeAppList(user.projects).filter((app) => app !== normalizedAppId);
        user.tokenVersion += 1;
        user.refreshTokenHash = null;
        user.refreshTokenExpiresAt = null;
        await user.save();

        return res.json({
            success: true,
            message: 'App unassigned successfully',
            username: user.username,
            apps: normalizeAppList(user.projects),
        });
    } catch (error) {
        logger.error('Unassign app error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error unassigning app' });
    }
});

router.get('/admin/summary', ...requireAdminSafe, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const adminUsers = await User.countDocuments({ role: 'admin' });

        const appsMap = await getAppsMap({ includeInactive: true });
        const apps = [...appsMap.values()];
        const activeApps = apps.filter((app) => app.status === 'active').length;

        return res.json({
            success: true,
            totalUsers,
            adminUsers,
            totalApps: apps.length,
            activeApps,
            inactiveApps: apps.length - activeApps,
        });
    } catch (error) {
        logger.error('Admin summary error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error fetching admin summary' });
    }
});

router.get('/admin/users', ...requireAdminSafe, async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
        const users = await User.find({})
            .select('name username email role projects createdAt')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.json({
            success: true,
            total: users.length,
            users,
        });
    } catch (error) {
        logger.error('Admin users error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error fetching users' });
    }
});

router.put('/admin/role/:username', ...requireAdminSafe, async (req, res) => {
    try {
        const username = normalizeUsername(req.params.username);
        const role = String(req.body?.role || '').trim().toLowerCase();

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'role must be user or admin' });
        }

        const targetUser = await User.findOneAndUpdate(
            { username },
            { role },
            { new: true },
        ).select('name username email role projects');

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({
            success: true,
            message: 'User role updated successfully',
            user: targetUser,
        });
    } catch (error) {
        logger.error('Admin role update error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error updating user role' });
    }
});

router.get('/admin/safety/status', ...requireAdminSafe, async (_req, res) => {
    try {
        const snapshot = getSafetySnapshot();
        return res.json({
            success: true,
            safety: snapshot,
            highlights: {
                passkey: isFeatureEnabled('PASSKEY'),
                dpop: isFeatureEnabled('DPOP'),
                riskEngine: isFeatureEnabled('RISK_ENGINE'),
                faceAuth: isFeatureEnabled('FACE_AUTH'),
                deviceQuorum: isFeatureEnabled('DEVICE_QUORUM'),
            },
        });
    } catch (error) {
        logger.error('Safety status error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error fetching safety status' });
    }
});

router.post('/admin/safety/reset', ...requireAdminSafe, async (req, res) => {
    try {
        const reason = String(req.body?.reason || 'manual admin reset').trim();
        resetSafetyGuard(reason);
        return res.json({
            success: true,
            message: 'Safety guard reset successfully',
            safety: getSafetySnapshot(),
        });
    } catch (error) {
        logger.error('Safety reset error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error resetting safety guard' });
    }
});

router.get('/admin/features', ...requireAdminSafe, async (_req, res) => {
    try {
        return res.json({
            success: true,
            features: getFeatureFlags(),
        });
    } catch (error) {
        logger.error('Feature list error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error fetching feature flags' });
    }
});

router.put('/admin/features/:featureKey', ...requireAdminSafe, async (req, res) => {
    try {
        const featureKey = String(req.params.featureKey || '').trim().toUpperCase();
        const enabled = Boolean(req.body?.enabled);
        const updated = setFeatureFlag(featureKey, enabled);
        if (!updated) {
            return res.status(400).json({ success: false, message: 'Unknown feature key' });
        }

        return res.json({
            success: true,
            message: 'Feature flag updated successfully',
            features: getFeatureFlags(),
        });
    } catch (error) {
        logger.error('Feature update error', { error: error.message });
        return res.status(500).json({ success: false, message: 'Error updating feature flag' });
    }
});

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

router.delete('/delete-user/:usernameOrEmail', ...requireAdminSafe, async (req, res) => {
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

router.get('/metrics', ...requireAdminSafe, async (req, res) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
});

module.exports = router;
