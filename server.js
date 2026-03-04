const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const ProductRoutes = require('./routes/ProductRoutes');
const morgan = require('morgan');
const serverless = require('serverless-http'); // This will help adapt your Express app to work on Vercel.

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json({ limit: '1mb' }));
app.set('trust proxy', 1);

// CORS configuration for production
app.use(cors(corsOptions));

// HTTP request logging (optional but useful for debugging)
app.use(morgan('dev'));

// Define routes
app.use('/api/users', userRoutes);
app.use('/api/products', ProductRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


module.exports.handler = serverless(app);  // Expose the handler for serverless deployment
