const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { Counter, Histogram, Registry, Gauge } = require('prom-client');
const osu = require('node-os-utils');
const winston = require('winston');
const LokiTransport = require('winston-loki');
const User = require('../models/User');
const { Tags } = require('opentracing');

const router = express.Router();
const register = new Registry();

// Initialize logger for Loki
const logger = winston.createLogger({
    transports: [
        new LokiTransport({
            host: 'http://49.121.3.2:3100',
            json: true,
            level: 'info',
        }),
    ],
});

// Create route span middleware
const createRouteSpan = (operationName) => (req, res, next) => {
    const span = req.tracer.startSpan(operationName, { childOf: req.span });
    req.routeSpan = span;
    next();
};

// Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 3 * 60 * 60 * 1000, // 3 hours
    max: 100,
    message: "Too many login attempts, please try again after 3 hours",
});

// Metrics
const httpRequestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
});
register.registerMetric(httpRequestCounter);

const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
});
register.registerMetric(httpRequestDuration);

const memoryUsageGauge = new Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
});
register.registerMetric(memoryUsageGauge);

const cpuUsageGauge = new Gauge({
    name: 'cpu_usage_percentage',
    help: 'CPU usage percentage',
});
register.registerMetric(cpuUsageGauge);

const totalUsersCounter = new Gauge({
    name: 'total_users',
    help: 'Total number of users in the database',
});
register.registerMetric(totalUsersCounter);

const userRegistrationRate = new Counter({
    name: 'user_registration_rate',
    help: 'Rate of user registrations per minute',
});
register.registerMetric(userRegistrationRate);

const failedLoginAttemptsCounter = new Counter({
    name: 'failed_login_attempts',
    help: 'Total number of failed login attempts',
});
register.registerMetric(failedLoginAttemptsCounter);

const successfulLoginsCounter = new Counter({
    name: 'successful_logins',
    help: 'Total number of successful logins',
});
register.registerMetric(successfulLoginsCounter);

const passwordUpdateRate = new Counter({
    name: 'password_update_rate',
    help: 'Rate of password updates per minute',
});
register.registerMetric(passwordUpdateRate);

const userUpdateRate = new Counter({
    name: 'user_update_rate',
    help: 'Rate of user updates per minute',
});
register.registerMetric(userUpdateRate);

const userDeletionRate = new Counter({
    name: 'user_deletion_rate',
    help: 'Rate of user deletions per minute',
});
register.registerMetric(userDeletionRate);

const activeUserSessionsGauge = new Gauge({
    name: 'active_user_sessions',
    help: 'Count of currently active user sessions',
});
register.registerMetric(activeUserSessionsGauge);

// Additional system metrics
const diskUsageGauge = new Gauge({
    name: 'disk_usage_percentage',
    help: 'Percentage of disk space used',
});
register.registerMetric(diskUsageGauge);

const networkTrafficGauge = new Gauge({
    name: 'network_traffic_bytes',
    help: 'Total network traffic in bytes',
    labelNames: ['direction'], // 'in' or 'out'
});
register.registerMetric(networkTrafficGauge);

const openFileDescriptorsGauge = new Gauge({
    name: 'open_file_descriptors',
    help: 'Number of open file descriptors',
});
register.registerMetric(openFileDescriptorsGauge);

const processCountGauge = new Gauge({
    name: 'process_count',
    help: 'Total number of running processes',
});
register.registerMetric(processCountGauge);

const loadAverageGauge = new Gauge({
    name: 'system_load_average',
    help: 'System load average over 1, 5, and 15 minutes',
    labelNames: ['interval'], // '1', '5', '15'
});
register.registerMetric(loadAverageGauge);

// Update system metrics periodically
setInterval(async () => {
    try {
        const mem = await osu.mem.info();
        memoryUsageGauge.set(mem.usedMem);

        const cpu = await osu.cpu.usage();
        cpuUsageGauge.set(cpu);

        const totalUsers = await User.countDocuments();
        totalUsersCounter.set(totalUsers);

        const disk = await osu.fs.info();
        diskUsageGauge.set((disk.used / disk.total) * 100); // Convert to percentage

        const network = await osu.netstat.inOut();
        networkTrafficGauge.set({ direction: 'in' }, network.in);
        networkTrafficGauge.set({ direction: 'out' }, network.out);

        const processes = await osu.processes.count();
        processCountGauge.set(processes);

        const loadAverage = osu.os.loadavg();
        loadAverageGauge.set({ interval: '1' }, loadAverage[0]);
        loadAverageGauge.set({ interval: '5' }, loadAverage[1]);
        loadAverageGauge.set({ interval: '15' }, loadAverage[2]);

        const openFileDescriptors = await osu.fs.stat();
        openFileDescriptorsGauge.set(openFileDescriptors.open);
    } catch (error) {
        logger.error('Failed to retrieve system info:', error);
    }
}, 5000);

// Middleware for logging and metrics
router.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
        httpRequestCounter.inc({ method: req.method, route: req.route.path, status: res.statusCode });
        end({ method: req.method, route: req.route.path, status: res.statusCode });
        logger.info({
            event: 'request_completed',
            method: req.method,
            url: req.url,
            status: res.statusCode,
            requestSize: req.headers['content-length'] || 0,
            responseSize: res.get('Content-Length') || 0,
        });
    });
    next();
});

// Centralized error handling
const handleError = (res, span, error, message) => {
    span.setTag(Tags.ERROR, true);
    span.log({ event: 'error', message, error: error.message });
    span.finish();
    logger.error(message, error);
    res.status(500).json({ success: false, message });
};

// User registration
router.post('/register', createRouteSpan('register_user'), async (req, res) => {
    const span = req.routeSpan;
    const { name, username, email, password, role, projects } = req.body;

    try {
        if (!name || !username || !email || !password || !role || !projects || !Array.isArray(projects)) {
            return handleError(res, span, new Error("Missing or invalid fields"), "Validation failed");
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return handleError(res, span, new Error("User already exists"), "User registration failed");
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const newUser = new User({ name, username, email, password: hashedPassword, role, projects });
        await newUser.save();
        
        userRegistrationRate.inc(); // Increment registration rate

        span.log({ event: 'user_registered' });
        span.finish();
        res.status(201).json({ success: true, message: "User registered successfully", userId: newUser._id });
    } catch (error) {
        handleError(res, span, error, "Error registering user");
    }
});

// User login
router.post('/login', loginLimiter, createRouteSpan('user_login'), async (req, res) => {
    const span = req.routeSpan;
    const { email, password, project } = req.body;

    try {
        if (!email || !password || !project) {
            return handleError(res, span, new Error("Missing email, password, or project"), "Validation failed");
        }

        const user = await User.findOne({ email });
        if (!user) {
            failedLoginAttemptsCounter.inc(); // Increment failed login attempts
            return handleError(res, span, new Error("User not found"), "User login failed");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            failedLoginAttemptsCounter.inc(); // Increment failed login attempts
            return handleError(res, span, new Error("Invalid credentials"), "User login failed");
        }

        successfulLoginsCounter.inc(); // Increment successful logins

        if (!user.projects.includes(project)) {
            return handleError(res, span, new Error("Project access denied"), "User login failed");
        }

        const projectUrl = PROJECT_URLS[project];
        if (projectUrl) {
            span.log({ event: 'login_successful' });
            span.finish();
            res.json({ success: true, username: user.username, project_url: projectUrl });
        } else {
            return handleError(res, span, new Error("Project URL not found"), "User login failed");
        }
    } catch (error) {
        handleError(res, span, error, "Error during login");
    }
});

// Update password by username
router.put('/update-password/:username', createRouteSpan('update_password'), async (req, res) => {
    const { newPassword } = req.body;
    const { username } = req.params;

    try {
        if (!newPassword) {
            return res.status(400).json({ success: false, message: "New password is required" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 8);
        const updatedUser = await User.findOneAndUpdate(
            { username },
            { password: hashedPassword },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        passwordUpdateRate.inc(); // Increment password update rate

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        logger.error('Error updating password:', error);
        res.status(500).json({ success: false, message: "Error updating password", error: error.message });
    }
});

// Update name by username
router.put('/update-name/:username', createRouteSpan('update_name'), async (req, res) => {
    const { newName } = req.body;
    const { username } = req.params;

    try {
        if (!newName) {
            return res.status(400).json({ success: false, message: "New name is required" });
        }

        const updatedUser = await User.findOneAndUpdate(
            { username },
            { name: newName },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        userUpdateRate.inc(); // Increment user update rate

        res.json({ success: true, message: "Name updated successfully", updatedUser });
    } catch (error) {
        logger.error('Error updating name:', error);
        res.status(500).json({ success: false, message: "Error updating name", error: error.message });
    }
});

// Delete user by username or email
router.delete('/delete-user/:usernameOrEmail', createRouteSpan('delete_user'), async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ $or: [{ username: req.params.usernameOrEmail }, { email: req.params.usernameOrEmail }] });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        userDeletionRate.inc(); // Increment user deletion rate

        res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        logger.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: "Error deleting user", error: error.message });
    }
});

// Route to expose metrics
router.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

module.exports = router;
