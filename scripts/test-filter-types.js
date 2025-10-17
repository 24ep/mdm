#!/usr/bin/env node

/**
 * Test the new filter types by checking the entity page
 */

async function testFilterTypes() {
  const { default: fetch } = await import('node-fetch');
  try {
    console.log('🔍 Testing new filter types...');
    
    const baseUrl = 'http://localhost:3000';
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    
    // Test the entity page
    console.log('\n📊 Testing entity page...');
    const entityUrl = `${baseUrl}/data/entities?model=${modelId}`;
    console.log(`🔗 URL: ${entityUrl}`);
    
    const response = await fetch(entityUrl);
    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const html = await response.text();
      
      // Check for new filter components
      const hasNumberRange = html.includes('Number Range');
      const hasDateRange = html.includes('Date Range');
      const hasMultiSelect = html.includes('Multi-Select Values');
      const hasBooleanFilter = html.includes('Boolean Filter');
      
      console.log('\n✅ Filter Components Check:');
      console.log(`   Number Range Filter: ${hasNumberRange ? '✅' : '❌'}`);
      console.log(`   Date Range Filter: ${hasDateRange ? '✅' : '❌'}`);
      console.log(`   Multi-Select Filter: ${hasMultiSelect ? '✅' : '❌'}`);
      console.log(`   Boolean Filter: ${hasBooleanFilter ? '✅' : '❌'}`);
      
      if (hasNumberRange && hasDateRange && hasMultiSelect && hasBooleanFilter) {
        console.log('\n🎉 All new filter types are working!');
      } else {
        console.log('\n⚠️  Some filter types may not be working properly');
      }
    } else {
      console.log(`❌ Error: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing filter types:', error);
  }
}

// Run the test
if (require.main === module) {
  testFilterTypes()
    .then(() => {
      console.log('\n🎉 Filter types test completed!');
    })
    .catch((error) => {
      console.error('❌ Filter types test failed:', error);
      process.exit(1);
    });
}

module.exports = { testFilterTypes };
