const { Pool } = require('pg');  // PostgreSQL client
require('dotenv').config();      // Load environment variables

// Database connection configuration
const pool = new Pool({
    user: process.env.DB_USER,                 // Database username
    host: process.env.DB_HOST,                 // Database host
    database: process.env.DB_NAME,             // Database name
    password: process.env.DB_PASSWORD,         // Database password
    port: process.env.DB_PORT || 5432,         // Database port (default is 5432)
    max: 20,                                  // Max number of clients in pool
    idleTimeoutMillis: 30000,                 // Idle time before a client is disconnected
    connectionTimeoutMillis: 2000             // Timeout before throwing an error if no connection is made
});

// Export the pool for query execution
module.exports = pool;

// Error handling
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);  // Exit process if an error occurs
});

