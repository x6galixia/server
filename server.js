const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const DailyRotateFile = require('winston-daily-rotate-file');
const db = require('./src/config/db');
const fs = require('fs');
const validateEnvVars = require('./src/utils/envValidator');
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
} = require('./src/utils/errors');

// Load environment variables
require('dotenv').config();

// Validate required environment variables
validateEnvVars();

// Set default port
const PORT = process.env.PORT || 3000;

// Logger setup
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new DailyRotateFile({
            filename: `${logDir}/application-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }),
        new winston.transports.File({ filename: `${logDir}/error.log`, level: 'error' }),
        ...(process.env.NODE_ENV === 'development'
            ? [new winston.transports.Console({ format: winston.format.simple() })]
            : []),
    ],
});

// Define a stream for morgan to use
logger.stream = {
    write: function (message) {
        logger.info(message.trim());
    },
};

// Initialize Express app
const app = express();

// Middleware to add request ID to logs
app.use((req, res, next) => {
    req.id = uuidv4(); // Attach a unique request ID
    logger.info({ message: `Request started`, requestId: req.id, url: req.url });
    next();
});

// Security and other middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 500 : 200,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', apiLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static('uploads'));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res, next) => {
    try {
        console.log('Rendering home page...');
        res.render('pages/home');
    } catch (err) {
        console.error('Error rendering home page:', err);
        next(err);
    }
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'development') {
    app.get('/api/test-error', (req, res, next) => {
        const { type } = req.query;

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

const userRoutes = require('./src/routes/userRoute/userRoutes');
app.use('/api/users', userRoutes);

// 404 Handler
app.use((req, res, next) => {
    next(new NotFoundError('The requested URL was not found on this server.'));
});

// Centralized error handler
app.use((err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        requestId: req.id,
        userId: req.user?.id,
    });

    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: req.id,
    });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await db.end();
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});