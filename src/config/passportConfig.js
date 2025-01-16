const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const serverPool = require('../config/db');

// Configure the local strategy for use by Passport
passport.use(new LocalStrategy(
    {
        usernameField: 'email', // Use email as the username field
        passwordField: 'password' // Use password as the password field
    },
    async (email, password, done) => {
        try {
            // Query the database to find the user by email
            const userQuery = await serverPool.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = userQuery.rows[0];

            // If no user is found, return an error
            if (!user) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            // Compare the provided password with the hashed password in the database
            const isValidPassword = await bcrypt.compare(password, user.password);

            // If the password is valid, return the user object
            if (isValidPassword) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect email or password.' });
            }
        } catch (err) {
            return done(err);
        }
    }
));

// Serialize user object to store in the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user object from the session
passport.deserializeUser(async (id, done) => {
    try {
        const userQuery = await serverPool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = userQuery.rows[0];
        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = passport;