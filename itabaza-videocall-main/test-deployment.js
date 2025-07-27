#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Test configuration
const TEST_URL = process.argv[2] || 'http://localhost:3001';
const ENDPOINTS = [
    '/',
    '/health',
    '/api/config'
];

console.log('🧪 Testing Video Chat App Deployment...\n');

async function testEndpoint(url, endpoint) {
    return new Promise((resolve) => {
        const fullUrl = `${url}${endpoint}`;
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(fullUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    endpoint,
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', (err) => {
            resolve({
                endpoint,
                error: err.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                endpoint,
                error: 'Timeout'
            });
        });
    });
}

async function runTests() {
    console.log(`📍 Testing: ${TEST_URL}\n`);
    
    for (const endpoint of ENDPOINTS) {
        console.log(`Testing ${endpoint}...`);
        const result = await testEndpoint(TEST_URL, endpoint);
        
        if (result.error) {
            console.log(`❌ ${endpoint}: ${result.error}`);
        } else if (result.status === 200) {
            console.log(`✅ ${endpoint}: OK (${result.status})`);
            
            if (endpoint === '/health') {
                try {
                    const health = JSON.parse(result.data);
                    console.log(`   📊 Uptime: ${Math.round(health.uptime)}s`);
                    console.log(`   🏠 Rooms: ${health.rooms}`);
                    console.log(`   👥 Connections: ${health.connections}`);
                } catch (e) {
                    console.log(`   ⚠️  Could not parse health data`);
                }
            }
        } else {
            console.log(`⚠️  ${endpoint}: ${result.status}`);
        }
        console.log('');
    }
    
    console.log('🎯 Deployment Test Summary:');
    console.log('✅ If all endpoints return 200, your server is running correctly');
    console.log('✅ Check browser console for WebRTC connection logs');
    console.log('✅ Test with multiple browser tabs for video calls');
    console.log('\n📖 See DEPLOYMENT.md for detailed troubleshooting guide');
}

runTests().catch(console.error); 