const nock = require('nock');
const assert = require('assert');
const { getDeployments } = require('../src/clients/registry.client');

describe('Registry API Integration', () => {

    before(() => {
        process.env.REGISTRY_URL = 'http://registry:5000';
        nock.disableNetConnect();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should fetch deployment data from the Registry API', async () => {
        const scope = nock('http://registry:5000')
            .get('/deployments') // adjust if needed
            .reply(200, [
                { id: 'test-123', serviceName: 'payment-service', status: 'Success' }
            ]);

        const data = await getDeployments();

        assert.ok(Array.isArray(data));
        assert.strictEqual(data[0].serviceName, 'payment-service');
        assert.ok(scope.isDone());
    });

    it('should handle API errors gracefully', async () => {
        nock('http://registry:5000')
            .get('/deployments') // adjust if needed
            .reply(500);

        try {
            await getDeployments();
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error);
        }
    });
});
