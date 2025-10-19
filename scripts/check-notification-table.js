const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkNotificationTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if notifications table exists
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');

    if (error) {
      console.error('❌ Error checking table:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ notifications table exists');
      
      // Check table structure
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'notifications')
        .order('ordinal_position');

      if (columnError) {
        console.error('❌ Error checking columns:', columnError);
        return;
      }

      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });

    } else {
      console.log('❌ notifications table does not exist');
      
      // Check what tables do exist
      const { data: allTables, error: allTablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');

      if (allTablesError) {
        console.error('❌ Error checking all tables:', allTablesError);
        return;
      }

      console.log('📋 Existing tables:');
      allTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkNotificationTable();
