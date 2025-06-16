const users = new Map();

exports.handler = async (event, context) => {
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
    const { action, adminKey } = JSON.parse(event.body);
    
    // Simple admin authentication (use environment variable in production)
    if (adminKey !== 'your-secret-admin-key-123') {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    switch (action) {
      case 'getAllUsers':
        const allUsers = Array.from(users.values()).map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          accountCount: user.accounts ? user.accounts.length : 0,
          accounts: user.accounts || []
        }));

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            success: true,
            users: allUsers,
            totalUsers: allUsers.length,
            totalAccounts: allUsers.reduce((sum, user) => sum + user.accountCount, 0)
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
