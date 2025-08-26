const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing AI Hub Backend API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing /health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('');

    // Test contact endpoint
    console.log('2. Testing /api/contact endpoint...');
    const contactData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      businessName: 'Test Business',
      businessType: 'retail',
      inquiryType: 'demo',
      message: 'This is a test message'
    };

    const contactResponse = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    const contactResult = await contactResponse.json();
    console.log('✅ Contact submission:', contactResult);
    console.log('');

    // Test demo availability
    console.log('3. Testing /api/demo/availability endpoint...');
    const availabilityResponse = await fetch(`${BASE_URL}/api/demo/availability?date=2024-01-15`);
    const availabilityData = await availabilityResponse.json();
    console.log('✅ Demo availability:', availabilityData);
    console.log('');

    console.log('🎉 All API tests completed successfully!');
    console.log('🌐 Backend is running and responding to requests.');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('💡 Make sure the backend server is running on port 5000');
  }
}

testAPI();
