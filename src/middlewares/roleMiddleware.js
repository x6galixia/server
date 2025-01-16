function ensureAdmin(req, res, next) {
    // Check if the user is authenticated and has the 'admin' role
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next(); // Allow access
    }
    // Deny access if not an admin
    res.status(403).json({ message: 'Forbidden: Admin access required' });
}

function ensureUser(req, res, next) {
    // Check if the user is authenticated and has the 'user' role
    if (req.isAuthenticated() && req.user.role === 'user') {
        return next(); // Allow access
    }
    // Deny access if not a user
    res.status(403).json({ message: 'Forbidden: User access required' });
}

// Middleware to allow access to either 'admin' or 'user'
function ensureAdminOrUser(req, res, next) {
    if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'user')) {
        return next(); // Allow access
    }
    // Deny access if not authenticated or not the correct role
    res.status(403).json({ message: 'Forbidden: Access denied' });
}

module.exports = {
    ensureAdmin,
    ensureUser,
    ensureAdminOrUser
};