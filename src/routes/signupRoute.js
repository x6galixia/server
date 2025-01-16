const express = require('express');
const bcrypt = require('bcrypt');
const { BadRequestError, ConflictError } = require('../../src/utils/errors');
const serverPool = require('../../src/config/db');

const router = express.Router();

const { body, validationResult } = require('express-validator');

router.get("/signup-page", (req, res, next) => {
    console.log("Viewing Login Page");

    try {
        res.render("pages/signup");
    } catch (err) {
        console.error("Error Rendering Login Page", err);
        next(err);
    }
});

// POST /signup - Handle user registration
router.post(
    '/signup',
    [
        // Validate and sanitize input
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').trim().isEmail().withMessage('Invalid email address'),
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('role').isIn(['admin', 'user']).withMessage('Role must be either "admin" or "user"')
    ],
    async (req, res, next) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, username, password, role } = req.body;

        try {
            // Check if the email or username already exists
            const emailCheck = await serverPool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (emailCheck.rows.length > 0) {
                throw new ConflictError('Email already exists');
            }

            const usernameCheck = await serverPool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (usernameCheck.rows.length > 0) {
                throw new ConflictError('Username already exists');
            }

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert the new user into the database
            const newUser = await serverPool.query(
                'INSERT INTO users (name, email, username, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [name, email, username, hashedPassword, role]
            );

            // Return the new user (excluding the password)
            const user = newUser.rows[0];
            delete user.password;

            res.status(201).json({ message: 'User registered successfully', user });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;