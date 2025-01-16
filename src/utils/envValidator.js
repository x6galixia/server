// Array of required environment variable names that the application depends on.
// These variables are essential for the application to function correctly (e.g., database credentials, server port).
const requiredEnvVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'PORT'];

// Function to validate that all required environment variables are defined.
// This function ensures that the application does not start if any critical environment variables are missing,
// preventing runtime errors due to undefined or incomplete configuration.
const validateEnvVars = () => {
    // Iterate over each required environment variable in the `requiredEnvVars` array.
    for (const envVar of requiredEnvVars) {
        // Check if the environment variable is not defined or is an empty string.
        if (!process.env[envVar]) {
            // If a required environment variable is missing, throw an error with a descriptive message.
            // This stops the application from starting and alerts the developer or administrator to the issue.
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }
};

// Export the `validateEnvVars` function so it can be used in other parts of the application,
// such as during the application startup process to ensure all required configurations are present.
module.exports = validateEnvVars;