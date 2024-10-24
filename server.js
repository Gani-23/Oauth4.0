const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const { initTracer } = require('./jaegerconfig');
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing');

// Initialize Jaeger Tracer
const tracer = initTracer('user-service');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// CORS configuration for production
app.use(cors());

// Middleware to create a span for each request
app.use((req, res, next) => {
    const wireCtx = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
    const span = tracer.startSpan('http_request', { childOf: wireCtx });

    span.setTag(Tags.HTTP_METHOD, req.method);
    span.setTag(Tags.HTTP_URL, req.url);
    span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_SERVER);

    // Store span in request object
    req.span = span;

    // Finish span on response finish
    res.on('finish', () => {
        span.setTag(Tags.HTTP_STATUS_CODE, res.statusCode);
        if (res.statusCode >= 500) {
            span.setTag(Tags.ERROR, true);
            span.log({ event: 'error', message: 'Server error occurred' });
        }
        span.finish();
    });

    next();
});

// Define routes
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    tracer.close();
    process.exit(0);
});