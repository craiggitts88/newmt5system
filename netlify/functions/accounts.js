// Import the users and sessions from auth (in production, use shared database)
const users = new Map();
const sessions = new Map();

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
    const { action, token, accountNumber } = JSON.parse(event.body);

    // Validate session
    const session = sessions.get(token);
    if (!session) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid session' 
        })
      };
    }

    const user = users.get(session.email);
    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          success: false, 
          message: 'User not found' 
        })
      };
    }

    switch (action) {
      case 'list':
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            success: true,
            accounts: user.accounts || []
          })
        };

      case 'add':
        if (!user.accounts) user.accounts = [];
        
        // Check limit
        if (user.accounts.length >= 2) {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              success: false, 
              message: 'Maximum 2 accounts allowed' 
            })
          };
        }

        // Check if account already exists
        if (user.accounts.some(acc => acc.accountNumber === accountNumber)) {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              success: false, 
              message: 'Account already exists' 
            })
          };
        }

        // Add account
        user.accounts.push({
          accountNumber,
          dateAdded: new Date().toISOString(),
          status: 'active'
        });

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            success: true,
            message: 'Account added successfully'
          })
        };

      case 'remove':
        if (!user.accounts) user.accounts = [];
        
        const initialLength = user.accounts.length;
        user.accounts = user.accounts.filter(acc => acc.accountNumber !== accountNumber);
        
        if (user.accounts.length === initialLength) {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              success: false, 
              message: 'Account not found' 
            })
          };
        }

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            success: true,
            message: 'Account removed successfully'
          })
        };

      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
