const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const router = express.Router();

// Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 3 * 60 * 60 * 1000, // 3 hours
    max: 100,
    message: "Too many login attempts, please try again after 3 hours",
    onLimitReached: function(req, res, options) {
        console.log(`Too many login attempts from ${req.ip}, temporarily blocked`);
        res.status(429).json({ success: false,message: "Too many login attempts, please try again after 3 hours" });
    }
});

// Sample project URLs (replace with actual URLs)
const PROJECT_URLS = {
    testing: "https://www.example.com/project1",
    project2: "https://www.example.com/project2"
};

// POST: Register a new user
router.post('/register', async (req, res) => {
    const { name, username, email, password, role, projects } = req.body;

    try {
        // Validate input
        if (!name || !username || !email || !password || !role || !projects || !Array.isArray(projects)) {
            return res.status(400).json({ success: false, message: "Missing or invalid fields in request body" });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const newUser = new User({ name, username, email, password: hashedPassword, role, projects });
        await newUser.save();

        console.log('Saved User:', newUser);
        res.status(201).json({ success: true, message: "User registered successfully", userId: newUser._id });
    } catch (error) {
        console.error('Error registering new user:', error);
        res.status(500).json({ success: false, message: "Error registering new user", error: error.message });
    }
});

router.put('/update-password/:username', async (req, res) => {
    const { newPassword } = req.body;
    const { username } = req.params;

    try {
        // Validate input
        if (!newPassword) {
            return res.status(400).json({ success: false, message: "New password is required" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 8);

        // Update password in the database
        const updatedUser = await User.findOneAndUpdate(
            { username },
            { password: hashedPassword },
            { new: true } // To return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ success: false, message: "Error updating password", error: error.message });
    }
});


// POST: Login, with rate limiting
router.post('/login', loginLimiter, async (req, res) => {
    const { email, password, project } = req.body;

    try {
        // Validate input
        if (!email || !password || !project) {
            return res.status(400).json({ success: false, message: "Missing email, password, or project" });
        }

        // Authenticate the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check password validity
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check project access
        if (!user.projects.includes(project)) {
            return res.status(403).json({ success: false, message: "You don't have access to this project" });
        }

        // Retrieve the project URL from the PROJECT_URLS object
        const projectUrl = PROJECT_URLS[project];
        if (projectUrl) {
            res.json({ success: true, username: user.username, project_url: projectUrl });
        } else {
            res.status(404).json({ success: false, message: "Project URL not found" });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT: Update password by username
router.put('/update-password/:username', async (req, res) => {
    const { newPassword } = req.body;
    const { username } = req.params;

    try {
        // Validate input
        if (!newPassword) {
            return res.status(400).json({ success: false, message: "New password is required" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 8);

        // Update password in the database
        const updatedUser = await User.findOneAndUpdate(
            { username },
            { password: hashedPassword },
            { new: true } // To return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ success: false, message: "Error updating password", error: error.message });
    }
});
// PUT: Update name by username
router.put('/update-name/:username', async (req, res) => {
    const { newName } = req.body;
    const { username } = req.params;

    try {
        // Validate input
        if (!newName) {
            return res.status(400).json({ success: false, message: "New name is required" });
        }

        // Update name in the database
        const updatedUser = await User.findOneAndUpdate(
            { username },
            { name: newName },
            { new: true } // To return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "Name updated successfully", updatedUser });
    } catch (error) {
        console.error('Error updating name:', error);
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
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: "Error deleting user", error: error.message });
    }
});

module.exports = router;
