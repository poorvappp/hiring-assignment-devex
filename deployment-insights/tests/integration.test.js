const nock = require('nock');
const assert = require('assert');
const { getDeployments } = require('../src/clients/registry.client');

describe('Registry API Integration', () => {

    before(() => {
        // Match EXACTLY what your client uses
        process.env.REGISTRY_URL = 'http://registry:5176/api';

        // Prevent real HTTP calls (very important)
        nock.disableNetConnect();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should fetch deployment data from the Registry API', async () => {
        const scope = nock('http://registry:5176')
            .get('/api/deployments')  // ✅ EXACT MATCH
            .reply(200, [
                { 
                    id: 'test-123', 
                    serviceName: 'payment-service', 
                    status: 'Success' 
                }
            ]);

        const data = await getDeployments();

        assert.ok(Array.isArray(data));
        assert.strictEqual(data[0].serviceName, 'payment-service');
        assert.strictEqual(data[0].id, 'test-123');

        assert.ok(scope.isDone(), 'The Registry API was never called');
    });

    it('should handle API errors gracefully', async () => {
        nock('http://registry:5176')
            .get('/api/deployments') // ✅ EXACT MATCH
            .reply(500);

        try {
            await getDeployments();
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error);
        }
    });
});
