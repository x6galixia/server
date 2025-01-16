// Middleware to ensure that the authenticated user has the 'admin' role.
// This function checks if the user is authenticated and if their role is 'admin'.
// If both conditions are met, the request is allowed to proceed.
// Otherwise, access is denied with a 403 Forbidden status and a JSON message.
function ensureAdmin(req, res, next) {
    // Check if the user is authenticated and has the 'admin' role.
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next(); // Allow access to the next middleware or route handler.
    }
    // If the user is not authenticated or not an admin, deny access.
    res.status(403).json({ message: 'Forbidden: Admin access required' });
}

// Middleware to ensure that the authenticated user has the 'user' role.
// This function checks if the user is authenticated and if their role is 'user'.
// If both conditions are met, the request is allowed to proceed.
// Otherwise, access is denied with a 403 Forbidden status and a JSON message.
function ensureUser(req, res, next) {
    // Check if the user is authenticated and has the 'user' role.
    if (req.isAuthenticated() && req.user.role === 'user') {
        return next(); // Allow access to the next middleware or route handler.
    }
    // If the user is not authenticated or not a user, deny access.
    res.status(403).json({ message: 'Forbidden: User access required' });
}

// Middleware to allow access to users with either the 'admin' or 'user' role.
// This function checks if the user is authenticated and if their role is either 'admin' or 'user'.
// If the conditions are met, the request is allowed to proceed.
// Otherwise, access is denied with a 403 Forbidden status and a JSON message.
function ensureAdminOrUser(req, res, next) {
    // Check if the user is authenticated and has either the 'admin' or 'user' role.
    if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'user')) {
        return next(); // Allow access to the next middleware or route handler.
    }
    // If the user is not authenticated or does not have the required role, deny access.
    res.status(403).json({ message: 'Forbidden: Access denied' });
}

// Export the middleware functions so they can be used in other parts of the application.
// These functions are useful for protecting routes based on user roles.
module.exports = {
    ensureAdmin,
    ensureUser,
    ensureAdminOrUser
};