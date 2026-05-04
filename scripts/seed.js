#!/usr/bin/env node
/**
 * Seed the Deployment Registry with sample data.
 * Used by `make seed` for local docker-compose development.
 *
 * Usage:
 *   REGISTRY_URL=http://localhost:5176 node scripts/seed.js
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

const REGISTRY_URL = process.env.REGISTRY_URL || 'http://localhost:5176';
const SEED_FILE = path.join(__dirname, '../deployment-registry/seed-data.json');
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 20;

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let body = '';
            res.on('data', (c) => (body += c));
            res.on('end', () => resolve({ status: res.statusCode, body }));
        }).on('error', reject);
    });
}

function post(urlPath, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const { hostname, port } = new URL(REGISTRY_URL);
        const req = http.request(
            {
                hostname,
                port,
                path: urlPath,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            },
            (res) => {
                let body = '';
                res.on('data', (c) => (body += c));
                res.on('end', () => resolve(res.statusCode));
            }
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRegistry() {
    console.log(`Waiting for Registry at ${REGISTRY_URL}/api/health ...`);
    for (let i = 1; i <= MAX_RETRIES; i++) {
        try {
            const res = await get(`${REGISTRY_URL}/api/health`);
            if (res.status === 200) {
                console.log('Registry is up.');
                return;
            }
        } catch {
            // not ready yet
        }
        console.log(`  Attempt ${i}/${MAX_RETRIES} — retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await sleep(RETRY_DELAY_MS);
    }
    throw new Error('Registry did not become ready in time.');
}

async function run() {
    await waitForRegistry();

    const check = await get(`${REGISTRY_URL}/api/deployments`);
    const existing = JSON.parse(check.body);
    if (existing.length > 0) {
        console.log(`Already seeded (${existing.length} records). Skipping.`);
        return;
    }

    const records = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    console.log(`Seeding ${records.length} records...`);

    let ok = 0;
    let fail = 0;
    for (const record of records) {
        const status = await post('/api/deployments', record);
        if (status >= 200 && status < 300) {
            ok++;
        } else {
            console.error(`  WARN: ${record.serviceName} v${record.version} → HTTP ${status}`);
            fail++;
        }
    }

    console.log(`Done. ${ok} inserted, ${fail} failed.`);
    if (fail > 0) process.exit(1);
}

run().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
