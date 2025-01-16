const express = require('express');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { ensureAdmin, ensureUser, ensureAdminOrUser } = require('../middlewares/roleMiddleware'); 

const router = express.Router();

router.get('/server-room', ensureAuthenticated, ensureUser, (req, res) => {
    res.render('pages/home')
});

module.exports = router;
