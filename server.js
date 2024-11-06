const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const ProductRoutes = require('./routes/ProductRoutes');
const morgan = require('morgan');
const serverless = require('serverless-http'); // This will help adapt your Express app to work on Vercel.

const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// CORS configuration for production
app.use(cors());

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
