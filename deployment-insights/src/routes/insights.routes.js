const express = require('express');
const router = express.Router();
const controller = require('../controllers/insights.controller');

// Latest Deployed Version
router.get('/latest', controller.getLatest);

// Deployment Frequency
router.get('/frequency', controller.getFrequency);

// Failure Rate
router.get('/failure-rate', controller.getFailureRate);

// Lead Time
router.get('/lead-time', controller.getLeadTime);

module.exports = router;
