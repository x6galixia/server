Express Server Configuration Documentation
Overview
This documentation provides a detailed explanation of the configuration of an Express server setup for a production environment. The configuration includes security features, middleware, logging, rate limiting, static file serving, and database connection.

Directory Structure

my-express-app/
├── server.js           # Main entry point
├── package.json        # Node.js project metadata and dependencies
├── .env                # Environment variables
├── public/             # Static files (CSS, JS, images)
│   ├── css/
│   ├── js/
│   └── images/
├── views/              # EJS templates
│   ├── partials/       # Partial templates (e.g., headers, footers)
│   ├── pages/          # Full-page views
│   │   ├── home.ejs
│   │   └── about.ejs
│   └── error.ejs       # Error view
├── src/                # Application source code
│   ├── routes/         # Express route handlers
│   │   ├── index.js    # Main route file
│   │   └── userRoutes.js
│   ├── controllers/    # Business logic for routes
│   │   ├── userController.js
│   ├── models/         # Database models
│   │   └── userModel.js
│   ├── middlewares/    # Middleware functions
│   │   └── authMiddleware.js
│   └── config/         # Configuration files
│       ├── db.js       # Database configuration
│       └── passport.js # Passport.js configuration
└── logs/               # Log files for monitoring/debugging



Server Configuration
server.js
This is the main entry point for the Express server.

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

// Listen on PORT
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



Configuration Breakdown
1. Environment Variables
Loaded from .env file using dotenv.
Example:
dotenv
Copy code
PORT=3000
DB_CONNECTION_STRING=mongodb://localhost:27017/mydatabase


2. Logging with Winston
Winston is used for logging with:
error.log for error logs.
combined.log for general logs.
The Morgan HTTP request logger uses this custom Winston stream:
javascript
Copy code
logger.stream = {
    write: function(message, encoding) {
        logger.info(message.trim());
    }
};


3. Middleware Setup
helmet() ensures secure HTTP headers.
cors() enables Cross-Origin Resource Sharing.
compression() compresses response bodies.
body-parser parses JSON and URL-encoded requests.
morgan logs HTTP requests using Winston.


4. Rate Limiting
express-rate-limit is configured to limit each IP to 100 requests every 15 minutes.


5. Static File Serving
express.static is used for serving:
Static files from the public directory.
File uploads from the uploads directory.
Node modules from node_modules.


6. Database Connection
Database connection is established using a configuration in src/config/db.js.


7. Routes
Routes are defined in src/routes/userRoute/userRoutes.
Production Considerations
Logging: Configure log rotation and retention policies for production deployments.
Security: Regularly audit security settings such as headers and rate limits.
Database: Ensure database backups and monitoring.
Deployment: Use Docker or Kubernetes for containerization, and set environment variables for production settings.
