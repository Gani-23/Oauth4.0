const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { Counter, Histogram, Registry, Gauge } = require('prom-client');
const osu = require('node-os-utils');
const winston = require('winston');
const LokiTransport = require('winston-loki');
const User = require('../models/User');
const Shop = require('../models/Shop'); // Correct import

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

// Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 3 * 60 * 60 * 1000, // 3 hours
    max: 100,
    message: "Too many login attempts, please try again after 3 hours",
});

// Sample project URLs (replace with actual URLs)
const PROJECT_URLS = {
    testing: "https://www.example.com/project1",
    project2: "https://www.example.com/project2",
    KrushiGowrava: "/store",
    krushigowrava: "/store",
    musicApp:"/GenAI"
};

// Metrics
const httpRequestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
});
register.registerMetric(httpRequestCounter);

const httpRequestDurationMicroseconds = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
});
register.registerMetric(httpRequestDurationMicroseconds);

const memoryUsageGauge = new Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
});
register.registerMetric(memoryUsageGauge);

// Update system metrics periodically
setInterval(async () => {
    try {
        const mem = await osu.mem.info();
        memoryUsageGauge.set(mem.usedMem);
    } catch (error) {
        logger.error('Failed to retrieve memory info:', error);
    }
}, 5000);

// Middleware for logging and metrics
router.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        httpRequestCounter.inc({ method: req.method, route: req.route.path, status: res.statusCode });
        end({ method: req.method, route: req.route.path, status: res.statusCode });
        logger.info(`Request: ${req.method} ${req.url} - Status: ${res.statusCode}`);
    });
    next();
});

// Test route
router.get('/', async (req, res) => {
    res.send("Hello World");
});

// Registration route
router.post('/register', async (req, res) => {
    const { name, username, email, password, role, projects } = req.body;

    try {
        // Validate required fields
        if (!name || !username || !email || !password || !role || !projects || !Array.isArray(projects)) {
            return res.status(400).json({ success: false, message: "Missing or invalid fields in request body" });
        }

        // Check if user with the same username or email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Username or email already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 8);

        // Create a new user object
        const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword,
            role,
            projects,
        });

        // Save the new user to the database
        await newUser.save();

        // Send success response with status 201 (Created)
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            userId: newUser._id,
        });
    } catch (error) {
        console.error('Error registering new user:', error);
        return res.status(500).json({
            success: false,
            message: "Error registering new user",
            error: error.message,
        });
    }
});


// Login route
 
router.post('/login', async (req, res) => {
    const { email, password, project } = req.body;

    try {
        if (!email || !password || !project) {
            return res.status(400).json({ success: false, message: "Missing email, password, or project" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.projects.includes(project)) {
            return res.status(403).json({ success: false, message: "You don't have access to this project" });
        }

        const projectUrl = PROJECT_URLS[project];
        if (projectUrl) {
            res.json({ success: true, username: user.username, project_url: projectUrl });
        } else {
            res.status(404).json({ success: false, message: "Project URL not found" });
        }
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT: Update password by username
router.put('/update-password/:username', async (req, res) => {
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

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        logger.error('Error updating password:', error);
        res.status(500).json({ success: false, message: "Error updating password", error: error.message });
    }
});

// PUT: Update name by username
router.put('/update-name/:username', async (req, res) => {
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

        res.json({ success: true, message: "Name updated successfully", updatedUser });
    } catch (error) {
        logger.error('Error updating name:', error);
        res.status(500).json({ success: false, message: "Error updating name", error: error.message });
    }
});

// DELETE: User by username or email
router.delete('/delete-user/:usernameOrEmail', async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ $or: [{ username: req.params.usernameOrEmail }, { email: req.params.usernameOrEmail }] });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
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
