const express = require('express');
const app = express();
const insightsRoutes = require('./src/routes/insights.routes');
const { checkRegistryHealth } = require('./src/clients/registry.client');

const PORT = 3000;

/**
 * 1. Health Check
 * Kept in server.js as a top-level monitoring endpoint.
 */
app.get('/health', async (req, res) => {
    try {
        await checkRegistryHealth();
        res.json({ 
            status: "UP", 
            registryConnection: "OK",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: "DEGRADED", 
            error: "Registry unreachable",
            details: error.message 
        });
    }
});

/**
 * 2. Mount Insights Routes
 * This maps everything in insights.routes.js under the /insights prefix.
 */
app.use('/insights', insightsRoutes);

/**
 * Server Activation
 */
app.listen(PORT, () => {
    console.log(`🚀 Deployment Insights Service running on port ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`🔗 Metrics: http://localhost:${PORT}/insights/frequency`);
});
