// Import required modules
const express = require('express'); // Express framework for building the server
const helmet = require('helmet'); // Secure HTTP headers
const cors = require('cors'); // Enable Cross-Origin Resource Sharing (CORS)
const rateLimit = require('express-rate-limit'); // Rate limiting for API requests
const bodyParser = require('body-parser'); // Parse incoming request bodies
const compression = require('compression'); // Compress response bodies
const morgan = require('morgan'); // HTTP request logging
const winston = require('winston'); // Logging library
const path = require('path'); // Utilities for working with file and directory paths
const { v4: uuidv4 } = require('uuid'); // Generate unique IDs
const DailyRotateFile = require('winston-daily-rotate-file'); // Rotate log files daily
const db = require('./src/config/db'); // Database configuration and connection
const fs = require('fs'); // File system module for working with files
const session = require('express-session'); // Session management
const passport = require('./src/config/passportConfig'); // Passport configuration
const validateEnvVars = require('./src/utils/envValidator'); // Validate required environment variables
const {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    UnprocessableEntityError,
    TooManyRequestsError,
    InternalServerError,
    ServiceUnavailableError,
} = require('./src/utils/errors'); // Custom error classes

// Load environment variables from .env file
require('dotenv').config();

// Validate required environment variables
// Throws an error if any required environment variables are missing
validateEnvVars();

// Set the default port for the server
// Use the PORT environment variable if available, otherwise default to 3000
const PORT = process.env.PORT || 3000;

// Logger setup
// Create a logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Configure Winston logger
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(), // Add timestamps to logs
        winston.format.json() // Format logs as JSON
    ),
    transports: [
        // Log to a rotating file (daily rotation)
        new DailyRotateFile({
            filename: `${logDir}/application-%DATE%.log`, // Log file name with date
            datePattern: 'YYYY-MM-DD', // Date format for log rotation
            zippedArchive: true, // Compress old log files
            maxSize: '20m', // Maximum size of a log file before rotation
            maxFiles: '14d', // Keep logs for 14 days
        }),
        // Log errors to a separate file
        new winston.transports.File({ filename: `${logDir}/error.log`, level: 'error' }),
        // Log to the console in development mode
        ...(process.env.NODE_ENV === 'development'
            ? [new winston.transports.Console({ format: winston.format.simple() })]
            : []),
    ],
});

// Define a stream for Morgan to use Winston for logging HTTP requests
logger.stream = {
    write: function (message) {
        logger.info(message.trim()); // Log HTTP requests using Winston
    },
};

// Initialize the Express application
const app = express();

// Middleware to add a unique request ID to each request
// This helps track requests across logs
app.use((req, res, next) => {
    req.id = uuidv4(); // Generate a unique request ID
    logger.info({ message: `Request started`, requestId: req.id, url: req.url }); // Log the request
    next();
});

// Security middleware
app.use(helmet()); // Set secure HTTP headers
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS.split(',') : '*', // Allow specific origins in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));
app.use(compression()); // Compress response bodies
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(morgan('combined', { stream: logger.stream })); // Log HTTP requests using Morgan

// Rate limiting middleware
// Limits the number of requests from a single IP address
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 500 : 200, // Max requests per window
    message: 'Too many requests from this IP, please try again later.', // Error message
});
app.use('/api/', apiLimiter); // Apply rate limiting to all API routes

// Serve static files
app.use(express.static(path.join(__dirname, 'dist'))); // Serve files from the 'dist' directory
app.use('/uploads', express.static('uploads')); // Serve files from the 'uploads' directory

// Set the view engine to EJS
app.set('view engine', 'ejs'); // Use EJS as the template engine
app.set('views', path.join(__dirname, 'views')); // Set the directory for views

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Use a strong secret key
    resave: false, // Don't save the session if it wasn't modified
    saveUninitialized: false, // Don't create a session until something is stored
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        maxAge: 24 * 60 * 60 * 1000 // Session expires in 24 hours
    }
}));

// Initialize Passport and restore authentication state from the session
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res, next) => {
    try {
        console.log('Rendering home page...');
        res.redirect('/server-room'); // Render the home page
    } catch (err) {
        console.error('Error rendering home page:', err);
        next(err); // Pass the error to the centralized error handler
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() }); // Return server status
});

// Test error endpoint (only available in development)
if (process.env.NODE_ENV === 'development') {
    app.get('/api/test-error', (req, res, next) => {
        const { type } = req.query;

        // Simulate different types of errors based on the query parameter
        switch (type) {
            case '400':
                throw new BadRequestError('This is a bad request.');
            case '401':
                throw new UnauthorizedError('You are not authorized.');
            case '403':
                throw new ForbiddenError('You do not have permission.');
            case '404':
                throw new NotFoundError('Resource not found.');
            case '409':
                throw new ConflictError('Conflict detected.');
            case '422':
                throw new UnprocessableEntityError('Unprocessable entity.');
            case '429':
                throw new TooManyRequestsError('Too many requests.');
            case '500':
                throw new InternalServerError('Internal server error.');
            case '503':
                throw new ServiceUnavailableError('Service unavailable.');
            default:
                res.status(200).json({ message: 'No error triggered.' });
        }
    });
}

// User routes
const userRoutes = require('./src/routes/userRoutes');
app.use('/api/users', userRoutes); // Mount user routes under /api/users

const signupRoute = require('./src/routes/signupRoute');
app.use('/api', signupRoute);

const userLoginRoutes = require('./src/routes/loginRoute');
app.use('/api/user', userLoginRoutes);

const homeRoute = require('./src/routes/homeRoute');
app.use('/', homeRoute);

// 404 Handler
// Handle requests to undefined routes
app.use((req, res, next) => {
    next(new NotFoundError('The requested URL was not found on this server.'));
});

// Centralized error handler
// Handle all errors thrown in the application
app.use((err, req, res, next) => {
    logger.error({
        message: err.message, // Error message
        stack: err.stack, // Error stack trace
        requestId: req.id, // Request ID for tracking
        userId: req.user?.id, // User ID (if available)
    });

    const statusCode = err.statusCode || 500; // Default to 500 if no status code is provided
    const errorMessage = err.message || 'Internal Server Error'; // Default error message

    res.status(statusCode).json({
        error: errorMessage, // Error message
        timestamp: new Date().toISOString(), // Timestamp of the error
        requestId: req.id, // Request ID for tracking
    });
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
// Handle SIGINT (Ctrl+C) and SIGTERM (termination signal)
const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await db.end(); // Close the database connection
    server.close(() => {
        console.log('Server closed.');
        process.exit(0); // Exit the process
    });
};

process.on('SIGINT', shutdown); // Handle SIGINT
process.on('SIGTERM', shutdown); // Handle SIGTERM

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1); // Exit the process in development mode
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1); // Exit the process in development mode
    }
});