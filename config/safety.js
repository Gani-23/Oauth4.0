const crypto = require('crypto');

const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const parseNumber = (value, defaultValue) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
};

const normalizeIp = (rawIp) => {
    const ip = String(rawIp || '').trim().toLowerCase();
    if (!ip) {
        return '';
    }
    if (ip.startsWith('::ffff:')) {
        return ip.slice(7);
    }
    return ip;
};

const AUTH_TEST_MODE = parseBoolean(process.env.AUTH_TEST_MODE, false);
const BREAK_GLASS_ADMIN_TOKEN = String(process.env.BREAK_GLASS_ADMIN_TOKEN || '').trim();
const BREAK_GLASS_USERNAME = String(process.env.BREAK_GLASS_USERNAME || 'breakglass-admin').trim().toLowerCase();
const BREAK_GLASS_APP_ID = String(process.env.BREAK_GLASS_APP_ID || '').trim().toLowerCase();
const ADMIN_IP_ALLOWLIST = (process.env.ADMIN_IP_ALLOWLIST || '')
    .split(',')
    .map((ip) => normalizeIp(ip))
    .filter(Boolean);

const SAFETY_CONFIG = {
    windowMs: Math.max(30_000, parseNumber(process.env.AUTH_GUARD_WINDOW_MS, 300_000)),
    minRequests: Math.max(5, parseNumber(process.env.AUTH_GUARD_MIN_REQUESTS, 20)),
    maxFailureRate: Math.min(1, Math.max(0.05, parseNumber(process.env.AUTH_GUARD_MAX_FAILURE_RATE, 0.45))),
    cooldownMs: Math.max(60_000, parseNumber(process.env.AUTH_GUARD_COOLDOWN_MS, 300_000)),
};

const FEATURE_KEYS = [
    'PASSKEY',
    'DPOP',
    'RISK_ENGINE',
    'FACE_AUTH',
    'DEVICE_QUORUM',
];

const featureDefaults = {
    PASSKEY: parseBoolean(process.env.FEATURE_PASSKEY, false),
    DPOP: parseBoolean(process.env.FEATURE_DPOP, false),
    RISK_ENGINE: parseBoolean(process.env.FEATURE_RISK_ENGINE, true),
    FACE_AUTH: parseBoolean(process.env.FEATURE_FACE_AUTH, false),
    DEVICE_QUORUM: parseBoolean(process.env.FEATURE_DEVICE_QUORUM, false),
};

const featureOverrides = {};

const guardState = {
    windowStartAt: Date.now(),
    totalAttempts: 0,
    failedAttempts: 0,
    paused: false,
    pauseReason: null,
    pausedAt: null,
};

const safeCompare = (left, right) => {
    if (!left || !right) {
        return false;
    }
    const a = Buffer.from(String(left));
    const b = Buffer.from(String(right));
    if (a.length !== b.length) {
        return false;
    }
    return crypto.timingSafeEqual(a, b);
};

const getRequestIp = (req) => {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0];
    const candidate = forwarded || req.ip || req.socket?.remoteAddress || '';
    return normalizeIp(candidate);
};

const getFeatureFlags = () => ({ ...featureDefaults, ...featureOverrides });

const isFeatureEnabled = (key) => Boolean(getFeatureFlags()[String(key || '').toUpperCase()]);

const setFeatureFlag = (key, enabled) => {
    const normalizedKey = String(key || '').toUpperCase();
    if (!FEATURE_KEYS.includes(normalizedKey)) {
        return false;
    }
    featureOverrides[normalizedKey] = Boolean(enabled);
    return true;
};

const hasBreakGlassToken = (req) => {
    if (!AUTH_TEST_MODE || !BREAK_GLASS_ADMIN_TOKEN) {
        return false;
    }

    const fromHeader = String(req.headers['x-break-glass-token'] || '').trim();
    const fromQuery = String(req.query?.break_glass_token || '').trim();
    const token = fromHeader || fromQuery;

    return safeCompare(token, BREAK_GLASS_ADMIN_TOKEN);
};

const resetSafetyGuard = (reason = 'manual reset') => {
    guardState.windowStartAt = Date.now();
    guardState.totalAttempts = 0;
    guardState.failedAttempts = 0;
    guardState.paused = false;
    guardState.pauseReason = reason;
    guardState.pausedAt = null;
};

const maybeRotateWindow = (now) => {
    if (now - guardState.windowStartAt >= SAFETY_CONFIG.windowMs) {
        guardState.windowStartAt = now;
        guardState.totalAttempts = 0;
        guardState.failedAttempts = 0;
    }

    if (guardState.paused && guardState.pausedAt && (now - guardState.pausedAt >= SAFETY_CONFIG.cooldownMs)) {
        resetSafetyGuard('automatic cooldown reset');
    }
};

const recordAuthAttempt = (isSuccess, routeLabel = 'unknown') => {
    const now = Date.now();
    maybeRotateWindow(now);

    if (guardState.paused) {
        return;
    }

    guardState.totalAttempts += 1;
    if (!isSuccess) {
        guardState.failedAttempts += 1;
    }

    const shouldEvaluate = guardState.totalAttempts >= SAFETY_CONFIG.minRequests;
    if (!shouldEvaluate) {
        return;
    }

    const failureRate = guardState.failedAttempts / guardState.totalAttempts;
    if (failureRate >= SAFETY_CONFIG.maxFailureRate) {
        guardState.paused = true;
        guardState.pausedAt = now;
        guardState.pauseReason = `Guard paused due to elevated auth failures on ${routeLabel}`;
    }
};

const isGuardPaused = () => {
    maybeRotateWindow(Date.now());
    return guardState.paused;
};

const getSafetySnapshot = () => ({
    testMode: AUTH_TEST_MODE,
    breakGlassConfigured: Boolean(BREAK_GLASS_ADMIN_TOKEN),
    adminIpAllowlistEnabled: ADMIN_IP_ALLOWLIST.length > 0,
    adminIpAllowlist: ADMIN_IP_ALLOWLIST,
    guard: {
        ...guardState,
        failureRate: guardState.totalAttempts > 0
            ? Number((guardState.failedAttempts / guardState.totalAttempts).toFixed(3))
            : 0,
        ...SAFETY_CONFIG,
    },
    features: getFeatureFlags(),
});

const authGuardMiddleware = (req, res, next) => {
    if (!isGuardPaused() || hasBreakGlassToken(req)) {
        return next();
    }

    return res.status(503).json({
        success: false,
        message: 'Auth guard is active due to elevated failures. Wait for cooldown or use break-glass token.',
    });
};

const adminIpGuard = (req, res, next) => {
    if (hasBreakGlassToken(req)) {
        return next();
    }

    if (ADMIN_IP_ALLOWLIST.length === 0) {
        return next();
    }

    const ip = getRequestIp(req);
    const localAliases = new Set(['127.0.0.1', '::1', 'localhost']);
    const allow = localAliases.has(ip) || ADMIN_IP_ALLOWLIST.includes(ip);
    if (allow) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: `Admin access is blocked for IP ${ip || 'unknown'}`,
    });
};

const attachTestRunId = (req, _res, next) => {
    const testRunId = String(req.headers['x-test-run-id'] || '').trim();
    req.testRunId = testRunId || null;
    return next();
};

module.exports = {
    AUTH_TEST_MODE,
    BREAK_GLASS_USERNAME,
    BREAK_GLASS_APP_ID,
    hasBreakGlassToken,
    adminIpGuard,
    authGuardMiddleware,
    recordAuthAttempt,
    resetSafetyGuard,
    getSafetySnapshot,
    getFeatureFlags,
    setFeatureFlag,
    isFeatureEnabled,
    attachTestRunId,
};
