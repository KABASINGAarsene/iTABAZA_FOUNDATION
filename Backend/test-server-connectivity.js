#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testing server connectivity...\n');

// Test different localhost variations
const testUrls = [
    'http://127.0.0.1:8080/api/health',
    'http://localhost:8080/api/health',
    'http://0.0.0.0:8080/api/health'
];

async function testConnection(url) {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`✅ ${url} - Status: ${res.statusCode}`);
                resolve({ url, success: true, status: res.statusCode, data });
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ ${url} - Error: ${err.message}`);
            resolve({ url, success: false, error: err.message });
        });
        
        req.setTimeout(5000, () => {
            console.log(`⏰ ${url} - Timeout`);
            req.destroy();
            resolve({ url, success: false, error: 'Timeout' });
        });
    });
}

async function testAllConnections() {
    console.log('Testing server endpoints...\n');
    
    for (const url of testUrls) {
        await testConnection(url);
    }
    
    console.log('\n🔍 Checking if server process is running...');
    require('child_process').exec('ps aux | grep "node.*index.js"', (error, stdout) => {
        if (stdout && stdout.includes('index.js')) {
            console.log('✅ Server process found running');
        } else {
            console.log('❌ Server process not found - please start the server');
        }
    });
    
    console.log('\n🔍 Checking port 8080...');
    require('child_process').exec('lsof -i :8080', (error, stdout) => {
        if (stdout) {
            console.log('✅ Port 8080 is in use:');
            console.log(stdout);
        } else {
            console.log('❌ Port 8080 is not in use - server may not be running');
        }
    });
}

testAllConnections();
