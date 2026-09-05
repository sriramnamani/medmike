const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload a report
router.post('/upload', upload.single('file'), reportController.uploadReport);

// Get all reports
router.get('/', reportController.getAllReports);

// Get report count
router.get('/count/total', reportController.getReportCount);

// Get processed report count
router.get('/count/processed', reportController.getProcessedReportCount);

// Get recent reports
router.get('/recent/list', reportController.getRecentReports);

// Get reports for a specific patient
router.get('/patient/:id', reportController.getPatientReports);

// Get a specific report by ID
router.get('/:id', reportController.getReportById);

// Process report with AI
router.post('/:id/process', reportController.processReport);

// Get AI record for a specific report
router.get('/:id/ai-record', reportController.getReportAiRecord);

module.exports = router;