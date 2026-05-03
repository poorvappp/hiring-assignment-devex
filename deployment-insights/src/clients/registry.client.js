const axios = require('axios');

// Logically defaults to the Docker service name and internal port 5176
const REGISTRY_URL = process.env.REGISTRY_URL || 'http://registry:5176/api';

const getDeployments = async () => {
    const { data } = await axios.get(`${REGISTRY_URL}/deployments`);
    return data;
};

const checkRegistryHealth = async () => {
    return await axios.get(`${REGISTRY_URL}/deployments`); // Testing connectivity
};

module.exports = { getDeployments, checkRegistryHealth, REGISTRY_URL };
