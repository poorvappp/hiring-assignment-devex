const assert = require('assert');
const nock = require('nock');
const insightsService = require('../src/services/insights.service');

describe('Insights Aggregation Logic', () => {
    
    afterEach(() => {
        nock.cleanAll();
    });

    it('should correctly calculate failure rate percentage', async () => {
        // Mocking the registry call inside the service
        nock('http://deployment-registry:5176')
            .get('/api/deployments')
            .reply(200, [
                { status: 'Failed' },
                { status: 'Success' },
                { status: 'Success' },
                { status: 'Success' }
            ]);

        const result = await insightsService.getFailureRate();
        // 1 failure out of 4 = 25%
        assert.strictEqual(result.failureRate, '25.00%');
        assert.strictEqual(result.totalDeployments, 4);
    });

    it('should correctly calculate average lead time in minutes', async () => {
        const start = new Date('2023-01-01T10:00:00Z');
        const end = new Date('2023-01-01T10:10:00Z'); // 10 minutes later

        nock('http://deployment-registry:5176')
            .get('/api/deployments')
            .reply(200, [
                { createdAt: start, finishedAt: end }, 
                { createdAt: start, finishedAt: new Date('2023-01-01T10:20:00Z') } // 20 minutes later
            ]);

        const result = await insightsService.getLeadTime();
        // Average of 10 and 20 is 15
        assert.strictEqual(result.averageLeadTimeMinutes, 15);
        assert.strictEqual(result.count, 2);
    });
});
