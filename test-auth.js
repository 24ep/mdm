// Simple test script to test NextAuth.js authentication
import fetch from 'node-fetch';

async function testSignup() {
  try {
    console.log('Testing user signup...');
    
    const response = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User',
        callbackUrl: 'http://localhost:3000/dashboard',
        json: 'true'
      })
    });

    const result = await response.text();
    console.log('Signup response status:', response.status);
    console.log('Signup response:', result);
    
  } catch (error) {
    console.error('Signup test error:', error.message);
  }
}

async function testSignin() {
  try {
    console.log('\nTesting user signin...');
    
    const response = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'test@example.com',
        password: 'testpassword123',
        callbackUrl: 'http://localhost:3000/dashboard',
        json: 'true'
      })
    });

    const result = await response.text();
    console.log('Signin response status:', response.status);
    console.log('Signin response:', result);
    
  } catch (error) {
    console.error('Signin test error:', error.message);
  }
}

// Run tests
testSignup().then(() => testSignin());
