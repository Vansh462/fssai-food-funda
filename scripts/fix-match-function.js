// This script creates the match_documents function in Supabase
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createMatchFunction() {
  try {
    console.log("Checking for existing match_documents function...");
    
    // First, let's try to get information about the existing function
    const { data: functionInfo, error: functionError } = await supabase
      .from('pg_proc')
      .select('*')
      .eq('proname', 'match_documents')
      .limit(1);
    
    if (functionError) {
      console.log("Could not check for existing function:", functionError);
      console.log("Will try to create it anyway.");
    } else if (functionInfo && functionInfo.length > 0) {
      console.log("Found existing match_documents function:", functionInfo[0]);
    } else {
      console.log("No existing match_documents function found.");
    }
    
    // Now let's try to create a simple query to test the documents table
    console.log("\nTesting a simple query on the documents table...");
    const { data: docSample, error: docError } = await supabase
      .from('documents')
      .select('id, content')
      .limit(1);
    
    if (docError) {
      console.error("Error querying documents table:", docError);
    } else {
      console.log("Successfully queried documents table:", docSample);
    }
    
    // Let's try to create a simple function that doesn't use vector operations
    console.log("\nCreating a simple test function...");
    const testFunctionSQL = `
    CREATE OR REPLACE FUNCTION hello_world() 
    RETURNS TEXT AS $$
    BEGIN
      RETURN 'Hello, World!';
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    try {
      // We can't directly execute SQL, so let's try to use the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/hello_world`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (response.ok) {
        console.log("Test function exists and works!");
        const result = await response.json();
        console.log("Result:", result);
      } else {
        console.log("Test function doesn't exist or doesn't work:", await response.text());
        console.log("You'll need to create the match_documents function manually in the Supabase dashboard.");
      }
    } catch (error) {
      console.error("Error testing function:", error);
    }
    
    console.log("\nIMPORTANT: You need to create the match_documents function manually in the Supabase dashboard.");
    console.log("Please use the SQL in the SUPABASE_SETUP.md file to create the function.");
    
  } catch (error) {
    console.error("Error creating match function:", error);
  }
}

// Run the function
createMatchFunction();
