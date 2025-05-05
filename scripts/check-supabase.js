// This script checks if the Supabase database has the documents table and data
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocumentsTable() {
  try {
    console.log("Checking documents table...");
    
    // Check if the table exists and has data
    const { data, error, count } = await supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error("Error querying documents table:", error);
      return;
    }
    
    console.log(`Found ${count} documents in the table`);
    
    if (data && data.length > 0) {
      console.log("Sample document:");
      console.log("ID:", data[0].id);
      console.log("Content (excerpt):", data[0].content.substring(0, 100) + "...");
      console.log("Metadata:", data[0].metadata);
      console.log("Embedding exists:", !!data[0].embedding);
      
      if (data[0].embedding) {
        console.log("Embedding dimensions:", data[0].embedding.length);
        console.log("First few values of embedding:", data[0].embedding.slice(0, 5));
      }
    } else {
      console.log("No documents found in the table");
    }
    
    // Check if the match_documents function exists
    console.log("\nChecking for match_documents function...");
    try {
      // Try to call the function with a dummy embedding
      const dummyEmbedding = Array(768).fill(0.1);
      const { data: matchData, error: matchError } = await supabase.rpc('match_documents', {
        query_embedding: dummyEmbedding,
        match_count: 1
      });
      
      if (matchError) {
        console.error("Error calling match_documents function:", matchError);
      } else {
        console.log("match_documents function exists and returned:", matchData);
      }
    } catch (functionError) {
      console.error("Error checking match_documents function:", functionError);
    }
    
  } catch (error) {
    console.error("Error checking Supabase:", error);
  }
}

// Run the check
checkDocumentsTable();
