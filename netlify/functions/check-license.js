// Import users data (in production, use shared database)
const users = new Map();

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
    
    // Check all users for this account number
    let isLicensed = false;
    let userEmail = null;
    
    for (const [email, user] of users.entries()) {
      if (user.accounts && user.accounts.some(acc => 
        acc.accountNumber === mt5Account && acc.status === 'active'
      )) {
        isLicensed = true;
        userEmail = email;
        break;
      }
    }
    
    // Log the check (in production, save to database)
    console.log(`License check: ${mt5Account} - ${isLicensed ? 'VALID' : 'INVALID'} - ${new Date().toISOString()}`);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        licensed: isLicensed,
        account: mt5Account,
        timestamp: new Date().toISOString(),
        ...(isLicensed && { user: userEmail })
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
