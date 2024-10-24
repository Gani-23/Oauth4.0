// jaegerconfig.js
const initJaegerTracer = require('jaeger-client').initTracer;

function initTracer(serviceName) {
    const config = {
        serviceName: serviceName,
        sampler: {
            type: 'const',
            param: 1,
        },
        reporter: {
            logSpans: true,
            agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
            agentPort: process.env.JAEGER_AGENT_PORT || 6832,
        },
    };

    const options = {
        logger: {
            info(msg) {
                console.log('Jaeger Logger INFO:', msg);
            },
            error(msg) {
                console.error('Jaeger Logger ERROR:', msg);
            },
        },
    };

    return initJaegerTracer(config, options);
}

module.exports = { initTracer };