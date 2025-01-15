const { Pool } = require('pg');
const { InternalServerError } = require('../../src/utils/errors');
const fs = require('fs');
const validateEnvVars = require('../../src/utils/envValidator');
require('dotenv').config();

// Validate required environment variables
validateEnvVars();

// Database connection configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    max: 20, // Adjust based on your workload and server capacity
    idleTimeoutMillis: 60000, // Increase idle timeout
    connectionTimeoutMillis: 5000, // Increase connection timeout
    ssl: process.env.NODE_ENV === 'production'
        ? {
              ca: fs.readFileSync(process.env.DB_SSL_CERT_PATH).toString(),
              rejectUnauthorized: true,
          }
        : false,
});

// Error handling
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection with retry logic
const connectWithRetry = async () => {
    try {
        await pool.query('SELECT 1');
        console.log('Database connection successful');
    } catch (err) {
        console.error('Database connection failed, retrying in 5 seconds...', err);
        setTimeout(connectWithRetry, 5000);
    }
};

connectWithRetry();

// Export the pool for query execution
module.exports = pool;