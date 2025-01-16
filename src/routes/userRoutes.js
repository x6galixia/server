const express = require('express');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { ensureAdmin, ensureUser, ensureAdminOrUser } = require('../middlewares/roleMiddleware'); // Import the role-based middleware

const router = express.Router();

// Route accessible only by admins
router.get('/admin-dashboard', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.json({ message: 'Welcome to the Admin Dashboard', user: req.user });
});

// Route accessible only by users
router.get('/user-profile', ensureAuthenticated, ensureUser, (req, res) => {
    res.json({ message: 'Welcome to your Profile', user: req.user });
});

// Route accessible by both admins and users
router.get('/dashboard', ensureAuthenticated, ensureAdminOrUser, (req, res) => {
    res.json({ message: 'Welcome to the Dashboard', user: req.user });
});

module.exports = router;