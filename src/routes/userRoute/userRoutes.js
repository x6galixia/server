const express = require('express');
const multer = require('multer'); // For handling file uploads
const userController = require('../..//controllers/userController'); // Import your user controller

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' }); 

const router = express.Router();

// Example route for file upload
router.post('/upload', upload.single('file'), userController.uploadFile);

module.exports = router;
