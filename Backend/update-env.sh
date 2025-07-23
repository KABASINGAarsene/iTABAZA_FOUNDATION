#!/bin/bash

echo "Please follow these steps to fix the database connection:"
echo ""
echo "1. Go to your Supabase dashboard: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings > API"
echo "4. Copy the 'service_role' key (it starts with 'eyJ...')"
echo "5. Replace the line 'SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here' in Backend/.env"
echo "6. Restart your server"
echo ""
echo "Current .env file:"
echo "=================="
cat .env
echo ""
echo "After updating, test the connection with: node test-connection.js" 