const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const ProductRoutes = require('./routes/ProductRoutes');
const { initTracer } = require('./jaegerconfig');
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing');
const morgan = require('morgan');
const serverless = require('serverless-http'); // This will help adapt your Express app to work on Vercel.


// Initialize Jaeger Tracer conditionally based on environment
let tracer;
if (process.env.NODE_ENV !== 'development') {
    tracer = initTracer('user-service');
}

const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// CORS configuration for production
app.use(cors());

// HTTP request logging (optional but useful for debugging)
app.use(morgan('dev'));

// Middleware to create a span for each request
app.use((req, res, next) => {
    if (!tracer) return next(); // If tracer is not initialized, skip the middleware

    const wireCtx = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
    const span = tracer.startSpan('http_request', { childOf: wireCtx });

    span.setTag(Tags.HTTP_METHOD, req.method);
    span.setTag(Tags.HTTP_URL, req.url);
    span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_SERVER);

    req.span = span;
    req.tracer = tracer;

    res.on('finish', () => {
        span.setTag(Tags.HTTP_STATUS_CODE, res.statusCode);
        if (res.statusCode >= 500) {
            span.setTag(Tags.ERROR, true);
            span.log({ event: 'error', message: 'Server error occurred' });
        }
        span.finish();
    });

    res.on('close', () => {
        span.finish();
    });

    next();
});

// Define routes
app.use('/api/users', userRoutes);
app.use('/api/products', ProductRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    if (tracer) {
        tracer.close();
    }
    await connectDB.close();  // Assuming your DB connection has a close method
    process.exit(0);
});

module.exports.handler = serverless(app);  // Expose the handler for serverless deployment
