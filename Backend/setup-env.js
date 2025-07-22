const fs = require('fs');
const path = require('path');

console.log(' iTABAZA Hospital Management System - Environment Setup');
console.log('========================================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log(' No .env file found!');
  console.log('\n Please create a .env file in the Backend directory with the following variables:\n');
  
  const envTemplate = `# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here

# Email Configuration (for nodemailer)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Server Configuration
PORT=8080
NODE_ENV=development`;

  console.log(envTemplate);
  console.log('\n How to get Supabase credentials:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Settings > API');
  console.log('4. Copy the Project URL and API keys');
  console.log('\n How to get Gmail app password:');
  console.log('1. Go to your Google Account settings');
  console.log('2. Security > 2-Step Verification > App passwords');
  console.log('3. Generate a new app password for "Mail"');
  
  process.exit(1);
} else {
  console.log(' .env file found!');
  
  // Load and check environment variables
  require('dotenv').config();
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName] || process.env[varName].includes('your_')) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log('\n Missing or incomplete environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n Please update your .env file with the correct values.');
    process.exit(1);
  }
  
  console.log(' All required environment variables are set!');
  console.log('\n Testing database connection...');
  
  // Test the connection
  const { testConnection } = require('./test-connection.js');
  testConnection();
} 