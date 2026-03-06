const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const ProductRoutes = require('./routes/ProductRoutes');
const adminConsoleRoute = require('./routes/adminConsoleRoute');
const { ensureBootstrapAdmin } = require('./config/adminBootstrap');
const morgan = require('morgan');
const serverless = require('serverless-http'); // This will help adapt your Express app to work on Vercel.
const { attachTestRunId } = require('./config/safety');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const isOriginAllowed = (origin) => !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin);

const corsOptions = {
    origin: (origin, callback) => {
        callback(null, isOriginAllowed(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Break-Glass-Token', 'X-Test-Run-Id'],
};

// Middleware to parse JSON bodies
app.use(express.json({ limit: '1mb' }));
app.set('trust proxy', 1);

// CORS configuration for production
app.use(cors(corsOptions));
app.use((req, res, next) => {
    if (isOriginAllowed(req.headers.origin)) {
        next();
        return;
    }

    res.status(403).json({
        success: false,
        message: 'Origin not allowed by CORS',
    });
});

// HTTP request logging (optional but useful for debugging)
app.use(attachTestRunId);
morgan.token('test-run-id', (req) => req.testRunId || '-');
app.use(morgan(':method :url :status :res[content-length] - :response-time ms testRun=:test-run-id'));

// Define routes
app.use('/', adminConsoleRoute);
app.use('/api/users', userRoutes);
app.use('/api/products', ProductRoutes);

const PORT = process.env.PORT || 3001;

const start = async () => {
    await connectDB();
    await ensureBootstrapAdmin();

    if (require.main === module) {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
};

start().catch((error) => {
    console.error('Failed to start server:', error.message);
    if (require.main === module) {
        process.exit(1);
    }
});

module.exports.handler = serverless(app); // Expose the handler for serverless deployment
