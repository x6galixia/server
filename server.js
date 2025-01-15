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
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
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

logger.stream = {
    write: (message) => logger.info(message.trim()),
};

// Initialize Express app
const app = express();

// Middleware
app.use((req, res, next) => {
    req.id = uuidv4(); // Attach a unique request ID
    next();
});

app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://your-trusted-domain.com'] : '*',
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
    max: 200,
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
app.get('/', (req, res) => {
    res.render('pages/home');
});

const userRoutes = require('./src/routes/userRoute/userRoutes');
app.use('/api/users', userRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'The requested URL was not found on this server.' });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        requestId: req.id,
        userId: req.user?.id,
    });

    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
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