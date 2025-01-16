// Base error class that extends the native Error class.
// This class is used to create custom error objects with additional properties like statusCode and isOperational.
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent Error class constructor with the provided message.
        this.statusCode = statusCode; // Set the HTTP status code for the error.
        this.isOperational = true; // Mark the error as operational (expected errors like user input errors).
        Error.captureStackTrace(this, this.constructor); // Capture the stack trace for debugging purposes.
    }
}

// 400 Bad Request
// This error is used when the server cannot process the request due to client error (e.g., invalid input).
class BadRequestError extends AppError {
    constructor(message = 'Bad Request') {
        super(message, 400); // Call the parent AppError constructor with the message and status code 400.
    }
}

// 401 Unauthorized
// This error is used when the request requires authentication and the client has not provided valid credentials.
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401); // Call the parent AppError constructor with the message and status code 401.
    }
}

// 403 Forbidden
// This error is used when the client does not have permission to access the requested resource.
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403); // Call the parent AppError constructor with the message and status code 403.
    }
}

// 404 Not Found
// This error is used when the requested resource could not be found on the server.
class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
        super(message, 404); // Call the parent AppError constructor with the message and status code 404.
    }
}

// 409 Conflict
// This error is used when the request conflicts with the current state of the server (e.g., duplicate entry).
class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409); // Call the parent AppError constructor with the message and status code 409.
    }
}

// 422 Unprocessable Entity
// This error is used when the server understands the request but cannot process it due to semantic errors (e.g., validation errors).
class UnprocessableEntityError extends AppError {
    constructor(message = 'Unprocessable Entity') {
        super(message, 422); // Call the parent AppError constructor with the message and status code 422.
    }
}

// 429 Too Many Requests
// This error is used when the client has sent too many requests in a given amount of time (rate limiting).
class TooManyRequestsError extends AppError {
    constructor(message = 'Too Many Requests') {
        super(message, 429); // Call the parent AppError constructor with the message and status code 429.
    }
}

// 500 Internal Server Error
// This error is used when the server encounters an unexpected condition that prevents it from fulfilling the request.
class InternalServerError extends AppError {
    constructor(message = 'Internal Server Error') {
        super(message, 500); // Call the parent AppError constructor with the message and status code 500.
    }
}

// 503 Service Unavailable
// This error is used when the server is temporarily unable to handle the request due to maintenance or overload.
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service Unavailable') {
        super(message, 503); // Call the parent AppError constructor with the message and status code 503.
    }
}

// Export all the error classes for use in other parts of the application.
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