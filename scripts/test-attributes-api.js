#!/usr/bin/env node

/**
 * Test the attributes API to see if it's working correctly
 */

async function testAttributesAPI() {
  const { default: fetch } = await import('node-fetch');
  try {
    console.log('🔍 Testing attributes API...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    const baseUrl = 'http://localhost:3000';
    
    // Test the attributes API
    console.log('\n📊 Testing attributes API endpoint...');
    const attrUrl = `${baseUrl}/api/data-models/${modelId}/attributes`;
    console.log(`🔗 URL: ${attrUrl}`);
    
    const attrResponse = await fetch(attrUrl);
    console.log(`📡 Status: ${attrResponse.status} ${attrResponse.statusText}`);
    
    if (attrResponse.ok) {
      const attrData = await attrResponse.json();
      console.log(`✅ Attributes count: ${attrData.attributes?.length || 0}`);
      console.log(`✅ Total count: ${attrData.count || 0}`);
      
      if (attrData.attributes && attrData.attributes.length > 0) {
        console.log('\n📝 First 10 attributes:');
        attrData.attributes.slice(0, 10).forEach((attr, index) => {
          console.log(`   ${index + 1}. ${attr.name} (${attr.display_name}) - ${attr.data_type || attr.type}`);
        });
      }
    } else {
      const errorText = await attrResponse.text();
      console.log(`❌ Error response: ${errorText.substring(0, 500)}`);
    }
    
    // Test the data records API
    console.log('\n📊 Testing data records API endpoint...');
    const recordsUrl = `${baseUrl}/api/data-records?data_model_id=${modelId}&page=1&limit=1`;
    console.log(`🔗 URL: ${recordsUrl}`);
    
    const recordsResponse = await fetch(recordsUrl);
    console.log(`📡 Status: ${recordsResponse.status} ${recordsResponse.statusText}`);
    
    if (recordsResponse.ok) {
      const recordsData = await recordsResponse.json();
      console.log(`✅ Records count: ${recordsData.records?.length || 0}`);
      console.log(`✅ Total records: ${recordsData.pagination?.total || 0}`);
      
      if (recordsData.records && recordsData.records.length > 0) {
        const record = recordsData.records[0];
        console.log('\n📝 Sample record:');
        console.log(`   ID: ${record.id}`);
        console.log(`   Values count: ${Object.keys(record.values || {}).length}`);
        console.log(`   Values keys: ${Object.keys(record.values || {}).slice(0, 10).join(', ')}`);
        
        if (record.values && Object.keys(record.values).length > 0) {
          console.log('\n📝 Sample values:');
          Object.entries(record.values).slice(0, 5).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
          });
        }
      }
    } else {
      const errorText = await recordsResponse.text();
      console.log(`❌ Error response: ${errorText.substring(0, 500)}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error);
  }
}

// Run the test
if (require.main === module) {
  testAttributesAPI()
    .then(() => {
      console.log('\n🎉 Attributes API test completed!');
    })
    .catch((error) => {
      console.error('❌ Attributes API test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAttributesAPI };
