const assert = require('assert');
const {
    calculateFailureRate,
    calculateLeadTime
} = require('../src/services/insights.service');

describe('Insights Aggregation Logic (Unit Tests)', () => {

    it('should correctly calculate failure rate percentage', () => {
        const mockData = [
            { status: 'Failed' },
            { status: 'Success' },
            { status: 'Success' },
            { status: 'Success' }
        ];

        const result = calculateFailureRate(mockData);

        assert.strictEqual(result.failureRate, '25.00%');
        assert.strictEqual(result.totalDeployments, 4);
        assert.strictEqual(result.failedDeployments, 1);
    });

    it('should correctly calculate average lead time in minutes', () => {
        const mockData = [
            {
                startedAt: '2023-01-01T10:00:00Z',
                finishedAt: '2023-01-01T10:10:00Z'; // 10 mins
                status: 'Succeeded'
            },
            {
                startedAt: '2023-01-01T10:00:00Z',
                finishedAt: '2023-01-01T10:20:00Z', // 20 mins
                status: 'Succeeded'
            }
        ];

        const result = calculateLeadTime(mockData);

        assert.strictEqual(result.averageLeadTimeMinutes, 15);
        assert.strictEqual(result.count, 2);
    });

});
