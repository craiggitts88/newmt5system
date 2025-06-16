const crypto = require('crypto');

// In production, use a real database like Supabase or Firebase
// For demo, we'll use in-memory storage (resets on each deploy)
const users = new Map();
const sessions = new Map();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

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
    const { action, name, email, password, token } = JSON.parse(event.body);

    switch (action) {
      case 'register':
        // Check if user already exists
        if (users.has(email)) {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              success: false, 
              message: 'User already exists' 
            })
          };
        }

        // Create new user
        const hashedPassword = hashPassword(password);
        const newUser = {
          id: crypto.randomUUID(),
          name,
          email,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          accounts: []
        };
        
        users.set(email, newUser);
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            success: true, 
            message: 'User created successfully' 
          })
        };

      case 'login':
        const user = users.get(email);
        if (!user || user.password !== hashPassword(password)) {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              success: false, 
              message: 'Invalid credentials' 
            })
          };
        }

        // Create session
        const sessionToken = generateToken();
        sessions.set(sessionToken, {
          userId: user.id,
          email: user.email,
          createdAt: new Date().toISOString()
        });

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            success: true,
            token: sessionToken,
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            }
          })
        };

      case 'validate':
        const session = sessions.get(token);
        if (!session) {
          return {
            statusCode: 200,
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

        const sessionUser = users.get(session.email);
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            success: true,
            user: {
              id: sessionUser.id,
              name: sessionUser.name,
              email: sessionUser.email
            }
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
