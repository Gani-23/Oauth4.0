// tracerconfig.js (lowercase naming)
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { MongoDBInstrumentation } = require('@opentelemetry/instrumentation-mongodb');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const opentelemetry = require('@opentelemetry/api');

function initTracer(serviceName) {
    // Configure Jaeger exporter
    const exporter = new JaegerExporter({
        endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
        tags: [],
        maxPacketSize: 65000
    });

    // Create and configure the tracer provider
    const provider = new NodeTracerProvider({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        }),
    });

    // Use the BatchSpanProcessor for better performance
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    // Register the provider globally
    provider.register();

    // Register automatic instrumentations
    registerInstrumentations({
        instrumentations: [
            new ExpressInstrumentation(),
            new HttpInstrumentation(),
            new MongoDBInstrumentation(),
        ],
        tracerProvider: provider,
    });

    return opentelemetry.trace.getTracer(serviceName);
}

module.exports = { initTracer };