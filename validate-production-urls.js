#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Production URL Configuration\n');

// Files to check
const filesToCheck = [
    'Frontend/Scripts/baseURL.js',
    'Backend/Frontend/Scripts/baseURL.js',
    'Backend/index.js',
    'test-appointment-functionality.js',
    'Frontend/clear-and-refresh.html',
    'Frontend/debug-doctor-storage.html',
    'Frontend/test-doctor-dashboard-fix.html'
];

const productionBackendURL = 'https://itabaza.onrender.com';
const productionFrontendURL = 'https://itabaza-2qjt.vercel.app';

let allValid = true;

filesToCheck.forEach(filePath => {
    console.log(`📄 Checking: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`   ❌ File not found`);
        allValid = false;
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for localhost references
    const localhostMatches = content.match(/localhost|127\.0\.0\.1/g);
    if (localhostMatches) {
        const uniqueMatches = [...new Set(localhostMatches)];
        console.log(`   ⚠️  Found localhost references: ${uniqueMatches.join(', ')}`);
        
        // Check if it's in comments or development fallbacks
        const lines = content.split('\n');
        let hasProblematicLocalhostUsage = false;
        
        lines.forEach((line, index) => {
            if (line.includes('localhost') || line.includes('127.0.0.1')) {
                if (!line.includes('//') && !line.includes('Keep localhost for development')) {
                    console.log(`   📍 Line ${index + 1}: ${line.trim()}`);
                    hasProblematicLocalhostUsage = true;
                }
            }
        });
        
        if (!hasProblematicLocalhostUsage) {
            console.log(`   ✅ Localhost usage appears to be in comments or development fallbacks`);
        }
    }
    
    // Check for production URLs
    const hasProductionBackend = content.includes(productionBackendURL);
    const hasProductionFrontend = content.includes(productionFrontendURL);
    
    if (filePath.includes('baseURL.js')) {
        if (hasProductionBackend) {
            console.log(`   ✅ Production backend URL found`);
        } else {
            console.log(`   ❌ Production backend URL missing`);
            allValid = false;
        }
    }
    
    if (filePath.includes('index.js')) {
        if (hasProductionFrontend) {
            console.log(`   ✅ Production frontend URL found in CORS`);
        } else {
            console.log(`   ❌ Production frontend URL missing from CORS`);
            allValid = false;
        }
    }
    
    console.log('');
});

// Summary
console.log('📋 Configuration Summary:');
console.log(`Backend URL: ${productionBackendURL}`);
console.log(`Frontend URL: ${productionFrontendURL}`);
console.log('');

if (allValid) {
    console.log('🎉 All configuration files are properly set for production!');
    console.log('');
    console.log('✅ Ready for deployment:');
    console.log('   - Backend: Deploy to Render');
    console.log('   - Frontend: Deploy to Vercel');
    console.log('   - Make sure environment variables are set in both platforms');
} else {
    console.log('⚠️  Some configuration issues found. Please review the files above.');
}

console.log('\n🚀 Deployment URLs:');
console.log(`   Backend: ${productionBackendURL}`);
console.log(`   Frontend: ${productionFrontendURL}`);
console.log(`   Health Check: ${productionBackendURL}/api/health`);
