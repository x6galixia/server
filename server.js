const express = require('express');
const helmet = require('helmet');                   // Secure HTTP headers
const cors = require('cors');                      // Cross-Origin Resource Sharing
const rateLimit = require('express-rate-limit');   // Rate limiting
const bodyParser = require('body-parser');         // Handling JSON, URL-encoded data
const compression = require('compression');       // Compress response bodies
const morgan = require('morgan');                  // HTTP request logging
const winston = require('winston');                // Logging library
const path = require('path');                      // Path handling

// For database connection
const db = require('./src/config/db');            // Database configuration

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables
require('dotenv').config();

// Logger setup
const fs = require('fs');
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });  // Create logs directory if not exists
}
const logger = winston.createLogger({
    transports: [
        new winston.transports.File({ filename: `${logDir}/error.log`, level: 'error' }),
        new winston.transports.File({ filename: `${logDir}/combined.log` }),
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
});

// Stream for Morgan
logger.stream = {
    write: function(message, encoding) {
        logger.info(message.trim());
    }
};

// Error handling middleware
app.use((err, req, res, next) => {
    if (err) {
        logger.error(err.stack);                       // Log errors
        return res.status(500).json({ error: err.message });
    }
    next();
});

// Security & Middleware
app.use(helmet());                                    // Secure HTTP headers
app.use(cors());                                      // Enable CORS
app.use(compression());                              // Enable response compression
app.use(bodyParser.json());                           // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true }));   // Parse URL-encoded request bodies
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100                   // Limit each IP to 100 requests
});
app.use('/api/', limiter);                            // Apply rate limiting to /api endpoints

// Static files
app.use(express.static('public'));  // Public folder for static assets
app.use("/uploads", express.static('uploads'));     // Directory for file uploads
app.use("/node_modules", express.static(path.join(__dirname, "node_modules"))); // Node modules for third-party libraries

// Database Connection
db.connect().then(() => {
    console.log('Database connected successfully.');
}).catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
});

// View engine setup
app.set("view engine", "ejs");  // Set EJS as the view engine
app.set("views", path.join(__dirname, "views"));  // Set views directory

// Example Route for root path
app.get('/', (req, res) => {
    res.render('pages/home');  // Assuming 'home.ejs' is your homepage
});

// Routes
const userRoutes = require('./src/routes/userRoute/userRoutes');
app.use('/api/users', userRoutes);

// 404 Handler for Undefined Routes
app.use((req, res, next) => {
    res.status(404).json({
        error: 'The requested URL was not found on this server.'
    });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);  // Log error details
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Listen on PORT
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
