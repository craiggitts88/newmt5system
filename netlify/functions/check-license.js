// Simple license checker
const licenses = new Map(); // In production, use a real database

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  try {
    const { mt5Account } = JSON.parse(event.body);
    
    // For demo - these accounts are "licensed"
    const demoLicenses = ['12345', '67890', '11111'];
    const isLicensed = demoLicenses.includes(mt5Account);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        licensed: isLicensed,
        account: mt5Account,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Invalid request' })
    };
  }
};
