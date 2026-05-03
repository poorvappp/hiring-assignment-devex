const insightsService = require('../services/insights.service');

/**
 * Logic: Group by service and environment to find the most recent record.
 */
async function getLatest(req, res) {
    try {
        const data = await insightsService.getLatestVersions();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Logic: Deployments happened per service in the last 7 days.
 */
async function getFrequency(req, res) {
    try {
        const data = await insightsService.getFrequency();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Logic: Failure rate calculation per service.
 */
async function getFailureRate(req, res) {
    try {
        const data = await insightsService.getFailureRate();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Logic: Average time from start to success.
 */
async function getLeadTime(req, res) {
    try {
        const data = await insightsService.getLeadTime();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getLatest,
    getFrequency,
    getFailureRate,
    getLeadTime
};
