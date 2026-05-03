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

// ... include logic for Failure Rate and Lead Time here similarly ...

module.exports = { getLatestVersions, getFrequency };
