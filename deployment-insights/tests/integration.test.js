const nock = require('nock');
const assert = require('assert');
const registryClient = require('../src/clients/registry.client');

describe('Registry API Integration', () => {
    it('should successfully fetch data from the Registry API', async () => {
        // Mock the Registry API response
        nock('http://deployment-registry:5176')
            .get('/api/deployments')
            .reply(200, [{ id: '1', serviceName: 'auth-service', status: 'Success' }]);

        const data = await registryClient.getDeployments(); // Adjust based on your actual function name
        assert.strictEqual(data[0].serviceName, 'auth-service');
    });
});
