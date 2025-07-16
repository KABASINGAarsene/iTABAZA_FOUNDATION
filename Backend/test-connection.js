require("dotenv").config();
const { supabase } = require("./config/db");

async function testConnection() {
  try {
    console.log("Testing Supabase connection...");
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error("❌ Database connection failed:", error.message);
      
      if (error.message.includes('relation "public.users" does not exist')) {
        console.log("\n🔧 Solution: You need to create the database tables.");
        console.log("1. Go to your Supabase dashboard");
        console.log("2. Navigate to SQL Editor");
        console.log("3. Copy and paste the contents of 'supabase-schema.sql'");
        console.log("4. Click 'Run' to execute the schema");
      }
      
      return false;
    }
    
    console.log("✅ Database connection successful!");
    console.log("✅ Users table exists and is accessible");
    
    // Test other tables
    const tables = ['departments', 'doctors', 'appointments', 'admins'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('count').limit(1);
        if (tableError) {
          console.log(`❌ Table '${table}' not found or not accessible`);
        } else {
          console.log(`✅ Table '${table}' exists and is accessible`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testConnection();
}

module.exports = { testConnection }; 