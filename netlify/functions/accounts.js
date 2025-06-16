const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://your-connection-string';
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('mt5_license');
    cachedDb = db;
    return db;
}

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { action, userId, accountNumber } = JSON.parse(event.body);
        
        // Validate required parameters
        if (!action || !userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Missing required parameters' 
                })
            };
        }

        const db = await connectToDatabase();
        const accountsCollection = db.collection('accounts');
        const usersCollection = db.collection('users');

        // Verify user exists (basic session validation)
        const user = await usersCollection.findOne({ id: userId });
        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'User not found' 
                })
            };
        }

        switch (action) {
            case 'getAccounts':
                const accounts = await accountsCollection.find({ userId }).toArray();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true, 
                        accounts: accounts || [] 
                    })
                };

            case 'addAccount':
                if (!accountNumber) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ 
                            success: false, 
                            message: 'Account number is required' 
                        })
                    };
                }

                // Check if user already has this account
                const existingAccount = await accountsCollection.findOne({ 
                    userId, 
                    accountNumber 
                });
                
                if (existingAccount) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ 
                            success: false, 
                            message: 'Account already exists' 
                        })
                    };
                }

                // Check account limit (max 2 per user)
                const userAccountCount = await accountsCollection.countDocuments({ userId });
                if (userAccountCount >= 2) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ 
                            success: false, 
                            message: 'Maximum 2 accounts allowed per user' 
                        })
                    };
                }

                // Add new account
                const newAccount = {
                    userId,
                    accountNumber,
                    status: 'active',
                    addedAt: new Date().toISOString(),
                    lastChecked: null
                };

                await accountsCollection.insertOne(newAccount);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true, 
                        message: 'Account added successfully' 
                    })
                };

            case 'removeAccount':
                if (!accountNumber) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ 
                            success: false, 
                            message: 'Account number is required' 
                        })
                    };
                }

                const deleteResult = await accountsCollection.deleteOne({ 
                    userId, 
                    accountNumber 
                });

                if (deleteResult.deletedCount === 0) {
                    return {
                        statusCode: 404,
                        headers,
                        body: JSON.stringify({ 
                            success: false, 
                            message: 'Account not found' 
                        })
                    };
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true, 
                        message: 'Account removed successfully' 
                    })
                };

            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Invalid action' 
                    })
                };
        }

    } catch (error) {
        console.error('Accounts function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Internal server error',
                error: error.message 
            })
        };
    }
};
