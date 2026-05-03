const { getDeployments } = require('../clients/registry.client');

const getLatestVersions = async () => {
    const data = await getDeployments();
    const latest = {};
    data.forEach(d => {
        const key = `${d.serviceName}-${d.environment}`;
        if (!latest[key] || new Date(d.finishedAt) > new Date(latest[key].finishedAt)) {
            latest[key] = d;
        }
    });
    return Object.values(latest);
};

const getFrequency = async () => {
    const data = await getDeployments();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const frequency = {};
    data.filter(d => new Date(d.finishedAt) > oneWeekAgo)
        .forEach(d => {
            frequency[d.serviceName] = (frequency[d.serviceName] || 0) + 1;
        });
    return { period: "last-7-days", frequency };
};

/**
 * Failure Rate Logic
 * Calculates the percentage of 'Failed' deployments vs total deployments.
 */
const getFailureRate = async () => {
    const data = await getDeployments();
    if (data.length === 0) return { failureRate: "0%" };

    const failedCount = data.filter(d => d.status === 'Failed').length;
    const rate = (failedCount / data.length) * 100;

    return {
        totalDeployments: data.length,
        failedDeployments: failedCount,
        failureRate: `${rate.toFixed(2)}%`
    };
};

/**
 * Lead Time Logic
 * Calculates average time from 'createdAt' to 'finishedAt' in minutes.
 */
const getLeadTime = async () => {
    const data = await getDeployments();
    // Only calculate for deployments that actually finished
    const finishedDeployments = data.filter(d => d.finishedAt && d.createdAt);

    if (finishedDeployments.length === 0) return { averageLeadTimeMinutes: 0 };

    const totalLeadTime = finishedDeployments.reduce((acc, d) => {
        const durationMs = new Date(d.finishedAt) - new Date(d.createdAt);
        return acc + durationMs;
    }, 0);

    const averageMs = totalLeadTime / finishedDeployments.length;
    const averageMinutes = averageMs / (1000 * 60);

    return {
        count: finishedDeployments.length,
        averageLeadTimeMinutes: parseFloat(averageMinutes.toFixed(2))
    };
};

// Export all functions so they can be tested in aggregation.test.js
module.exports = { 
    getLatestVersions, 
    getFrequency, 
    getFailureRate, 
    getLeadTime 
};
