const nock = require('nock');
const assert = require('assert');
const { getDeployments } = require('../src/clients/registry.client');

describe('Registry API Integration', () => {
    
    afterEach(() => {
        nock.cleanAll();
    });

    it('should fetch deployment data from the Registry API', async () => {
        // Intercept the outgoing HTTP call to the registry
        const scope = nock('http://deployment-registry:5176')
            .get('/api/deployments')
            .reply(200, [
                { 
                    id: 'test-123', 
                    serviceName: 'payment-service', 
                    status: 'Success' 
                }
            ]);

        const data = await getDeployments();

        // Verify the data returned matches what the API sent
        assert.ok(Array.isArray(data));
        assert.strictEqual(data[0].serviceName, 'payment-service');
        assert.strictEqual(data[0].id, 'test-123');
        
        // Verify that the call actually happened
        assert.ok(scope.isDone(), 'The Registry API was never called');
    });

    it('should handle API errors gracefully', async () => {
        nock('http://deployment-registry:5176')
            .get('/api/deployments')
            .reply(500);

        try {
            await getDeployments();
            assert.fail('Should have thrown an error on 500 status');
        } catch (error) {
            assert.ok(error, 'Error was successfully caught');
        }
    });
});
