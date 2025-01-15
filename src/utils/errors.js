class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Mark errors that are expected (e.g., user input errors)
        Error.captureStackTrace(this, this.constructor);
    }
}

// 400 Bad Request
class BadRequestError extends AppError {
    constructor(message = 'Bad Request') {
        super(message, 400);
    }
}

// 401 Unauthorized
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

// 403 Forbidden
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

// 404 Not Found
class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}

// 409 Conflict
class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}

// 422 Unprocessable Entity
class UnprocessableEntityError extends AppError {
    constructor(message = 'Unprocessable Entity') {
        super(message, 422);
    }
}

// 429 Too Many Requests
class TooManyRequestsError extends AppError {
    constructor(message = 'Too Many Requests') {
        super(message, 429);
    }
}

// 500 Internal Server Error
class InternalServerError extends AppError {
    constructor(message = 'Internal Server Error') {
        super(message, 500);
    }
}

// 503 Service Unavailable
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service Unavailable') {
        super(message, 503);
    }
}

module.exports = {
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
};