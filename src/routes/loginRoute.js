const express = require('express');
const passport = require('passport');
const { BadRequestError } = require('../../src/utils/errors');
const { ensureNotAuthenticated } = require('../middlewares/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Render the login page
router.get("/login-page", ensureNotAuthenticated, (req, res, next) => {
    console.log("Viewing Login Page");

    try {
        res.render("pages/userLogin");
    } catch (err) {
        console.error("Error Rendering Login Page", err);
        next(err);
    }
});

// Handle login form submission
router.post("/login", (req, res, next) => {
    console.log("Login attempt");

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return next(new BadRequestError("Email and password are required"));
    }

    // Authenticate using Passport
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: info.message });
        }

        // Log the user in
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/')
        });
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.json({ message: 'Logout successful' });
    });
});

module.exports = router;