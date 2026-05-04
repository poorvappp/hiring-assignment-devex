const { getDeployments } = require('../clients/registry.client');

/**
 * -------------------------------
 * PURE FUNCTIONS (TESTABLE)
 * -------------------------------
 */

const calculateLatestVersions = (data) => {
    const latest = {};

    data.forEach((d) => {
        // Ensure we only process records that actually finished
        if (!d.finishedAt) return;

        const key = `${d.serviceName}-${d.environment}`;
        if (!latest[key] || new Date(d.finishedAt) > new Date(latest[key].finishedAt)) {
            latest[key] = d;
        }
    });

    return Object.values(latest);
};

const calculateFrequency = (data) => {
    if (data.length === 0) return { period: 'no-data', frequency: {} };

    // FIX: Instead of hardcoding "now", find the range in the actual data
    const timestamps = data.map((d) => new Date(d.startedAt).getTime());
    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));

    // Calculate weeks in the data set (minimum 1 week to avoid infinity)
    const diffWeeks = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24 * 7));

    const frequencyCount = {};

    data.forEach((d) => {
        frequencyCount[d.serviceName] = (frequencyCount[d.serviceName] || 0) + 1;
    });

    // Calculate per-week average
    const averageFrequency = {};
    Object.keys(frequencyCount).forEach((svc) => {
        averageFrequency[svc] = parseFloat((frequencyCount[svc] / diffWeeks).toFixed(2));
    });

    return {
        period: 'data-range-total',
        dataStart: minDate.toISOString(),
        dataEnd: maxDate.toISOString(),
        avgDeploymentsPerWeek: averageFrequency,
    };
};

const calculateFailureRate = (data) => {
    if (data.length === 0) {
        return { failureRate: '0%' };
    }

    // FIX: Registry uses "Succeeded". We check for anything NOT successful/succeeded.
    const failedCount = data.filter((d) => {
        const status = d.status ? d.status.toLowerCase() : '';
        return status === 'failed' || status === 'error';
    }).length;

    const rate = (failedCount / data.length) * 100;

    return {
        totalDeployments: data.length,
        failedDeployments: failedCount,
        failureRate: `${rate.toFixed(2)}%`,
    };
};

const calculateLeadTime = (data) => {
    // FIX: Registry uses 'startedAt', not 'createdAt'
    const finishedDeployments = data.filter((d) => d.finishedAt && d.startedAt);

    if (finishedDeployments.length === 0) {
        return {
            averageLeadTimeMinutes: 0,
            note: 'No deployments with both start and finish timestamps found',
        };
    }

    const totalLeadTime = finishedDeployments.reduce((acc, d) => {
        const durationMs = new Date(d.finishedAt) - new Date(d.startedAt);
        return acc + durationMs;
    }, 0);

    const averageMs = totalLeadTime / finishedDeployments.length;
    const averageMinutes = averageMs / (1000 * 60);

    return {
        count: finishedDeployments.length,
        averageLeadTimeMinutes: parseFloat(averageMinutes.toFixed(2)),
    };
};

/**
 * -------------------------------
 * WRAPPER FUNCTIONS (API CALLS)
 * -------------------------------
 */

const getLatestVersions = async () => {
    const data = await getDeployments();
    return calculateLatestVersions(data);
};

const getFrequency = async () => {
    const data = await getDeployments();
    return calculateFrequency(data);
};

const getFailureRate = async () => {
    const data = await getDeployments();
    return calculateFailureRate(data);
};

const getLeadTime = async () => {
    const data = await getDeployments();
    return calculateLeadTime(data);
};

/**
 * EXPORTS
 */

module.exports = {
    calculateLatestVersions,
    calculateFrequency,
    calculateFailureRate,
    calculateLeadTime,
    getLatestVersions,
    getFrequency,
    getFailureRate,
    getLeadTime,
};
