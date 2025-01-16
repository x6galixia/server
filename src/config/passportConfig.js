// Import required modules
const passport = require('passport'); // Passport.js for authentication
const LocalStrategy = require('passport-local').Strategy; // Local strategy for username/password authentication
const bcrypt = require('bcrypt'); // Library for hashing and comparing passwords
const serverPool = require('../config/db'); // Database connection pool

// Configure the local strategy for use by Passport
// The local strategy authenticates users using a username and password
passport.use(new LocalStrategy(
    {
        usernameField: 'email', // Use 'email' as the username field (instead of the default 'username')
        passwordField: 'password' // Use 'password' as the password field
    },
    async (email, password, done) => {
        try {
            // Query the database to find the user by their email
            const userQuery = await serverPool.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = userQuery.rows[0]; // Extract the user object from the query result

            // If no user is found with the provided email, return an error
            if (!user) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            // Compare the provided password with the hashed password stored in the database
            const isValidPassword = await bcrypt.compare(password, user.password);

            // If the password is valid, return the user object
            if (isValidPassword) {
                return done(null, user);
            } else {
                // If the password is invalid, return an error
                return done(null, false, { message: 'Incorrect email or password.' });
            }
        } catch (err) {
            // If an error occurs during the process, pass it to the `done` callback
            return done(err);
        }
    }
));

// Serialize the user object to store in the session
// This function determines what data from the user object should be stored in the session
passport.serializeUser((user, done) => {
    done(null, user.id); // Store only the user's ID in the session
});

// Deserialize the user object from the session
// This function retrieves the user object from the database using the ID stored in the session
passport.deserializeUser(async (id, done) => {
    try {
        // Query the database to find the user by their ID
        const userQuery = await serverPool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = userQuery.rows[0]; // Extract the user object from the query result

        // Return the user object
        done(null, user);
    } catch (err) {
        // If an error occurs, pass it to the `done` callback
        done(err);
    }
});

// Export the configured Passport instance for use in other parts of the application
module.exports = passport;