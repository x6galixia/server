// Import required modules
const { Pool } = require('pg'); // PostgreSQL client for Node.js
const { InternalServerError } = require('../../src/utils/errors'); // Custom error class for internal server errors
const fs = require('fs'); // File system module for reading SSL certificates
const validateEnvVars = require('../../src/utils/envValidator'); // Utility to validate required environment variables
require('dotenv').config(); // Load environment variables from .env file

// Validate required environment variables
// This ensures that all necessary environment variables are present before starting the application
validateEnvVars();

// Database connection configuration
// Create a new connection pool using environment variables
const pool = new Pool({
    user: process.env.DB_USER, // Database user
    host: process.env.DB_HOST, // Database host
    database: process.env.DB_NAME, // Database name
    password: process.env.DB_PASSWORD, // Database password
    port: process.env.DB_PORT || 5432, // Database port (default: 5432)
    max: 20, // Maximum number of clients in the pool (adjust based on workload and server capacity)
    idleTimeoutMillis: 60000, // Increase idle timeout to 60 seconds
    connectionTimeoutMillis: 5000, // Increase connection timeout to 5 seconds
    ssl: process.env.NODE_ENV === 'production'
        ? {
              ca: fs.readFileSync(process.env.DB_SSL_CERT_PATH).toString(), // Read SSL certificate for secure connections
              rejectUnauthorized: true, // Reject unauthorized connections
          }
        : false, // Disable SSL in non-production environments
});

// Error handling for the connection pool
// This event listener logs errors that occur on idle clients and exits the process
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1); // Exit the process with an error code
});

// Test the database connection with retry logic
// This function attempts to connect to the database and retries if the connection fails
const connectWithRetry = async () => {
    try {
        // Execute a simple query to test the connection
        await pool.query('SELECT 1');
        console.log('Database connection successful');
    } catch (err) {
        // If the connection fails, log the error and retry after 5 seconds
        console.error('Database connection failed, retrying in 5 seconds...', err);
        setTimeout(connectWithRetry, 5000);
    }
};

// Call the function to test the database connection
connectWithRetry();

// Export the connection pool for use in other parts of the application
// This allows other modules to execute queries using the same pool
module.exports = pool;