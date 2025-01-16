// Import the Passport.js library, which is used for authentication in the application.
// Passport provides a simple and flexible way to handle authentication strategies (e.g., local, OAuth).
const passport = require('passport');

// Middleware function to ensure that a user is authenticated before accessing a protected route.
// This function checks if the user is authenticated using the `req.isAuthenticated()` method provided by Passport.
// If the user is authenticated, the middleware allows the request to proceed to the next handler.
// If the user is not authenticated, it responds with a 401 Unauthorized status and a JSON message.
function ensureAuthenticated(req, res, next) {
    // Check if the user is authenticated using Passport's `isAuthenticated` method.
    if (req.isAuthenticated()) {
        // If the user is authenticated, call the `next()` function to proceed to the next middleware or route handler.
        return next();
    }
    // If the user is not authenticated, respond with a 401 Unauthorized status and a JSON message.
    res.status(401).json({ message: 'Unauthorized' });
}

// Middleware function to ensure that a user is NOT authenticated before accessing a route (e.g., login page).
// This function checks if the user is authenticated using the `req.isAuthenticated()` method provided by Passport.
// If the user is authenticated, the middleware redirects them to a specified route (e.g., home page).
// If the user is not authenticated, the middleware allows the request to proceed to the next handler.
function ensureNotAuthenticated(req, res, next) {
    // Check if the user is authenticated using Passport's `isAuthenticated` method.
    if (req.isAuthenticated()) {
        // If the user is authenticated, redirect them to the home page (or another route).
        return res.redirect('/'); // Change the redirect path as needed
    }
    // If the user is not authenticated, call the `next()` function to proceed to the next middleware or route handler.
    next();
}

// Export the middleware functions so they can be used in other parts of the application,
// such as protecting routes that require authentication or redirecting authenticated users away from login pages.
module.exports = {
    ensureAuthenticated,
    ensureNotAuthenticated,
};