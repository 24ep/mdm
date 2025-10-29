#!/usr/bin/env node

/**
 * Test script for the space invitation system
 * This script tests the API endpoints and functionality
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testUserSearch() {
  console.log('🔍 Testing user search...');
  
  try {
    const response = await fetch(`${API_URL}/users/search?q=test&spaceId=test-space`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ User search API working');
      console.log(`Found ${data.users?.length || 0} users`);
    } else {
      console.log('❌ User search failed:', data.error);
    }
  } catch (error) {
    console.log('❌ User search error:', error.message);
  }
}

async function testInvitationAPI() {
  console.log('📧 Testing invitation API...');
  
  try {
    const response = await fetch(`${API_URL}/spaces/test-space/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        role: 'member'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Invitation API working');
      console.log('Response:', data.message);
    } else {
      console.log('❌ Invitation API failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Invitation API error:', error.message);
  }
}

async function testInvitationDetails() {
  console.log('🔗 Testing invitation details API...');
  
  try {
    const response = await fetch(`${API_URL}/invitations/test-token`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Invitation details API working');
    } else {
      console.log('❌ Invitation details API failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Invitation details API error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting invitation system tests...\n');
  
  await testUserSearch();
  console.log('');
  
  await testInvitationAPI();
  console.log('');
  
  await testInvitationDetails();
  console.log('');
  
  console.log('✨ Tests completed!');
  console.log('\nNote: Some tests may fail if the database is not set up or if you\'re not authenticated.');
  console.log('This is normal for a test environment.');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testUserSearch,
  testInvitationAPI,
  testInvitationDetails,
  runTests
};
