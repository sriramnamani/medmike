const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

// Create a new patient
router.post('/', patientController.createPatient);

// Get all patients
router.get('/', patientController.getAllPatients);

// Get patient count
router.get('/count/total', patientController.getPatientCount);

// Get a specific patient by ID
router.get('/:id', patientController.getPatientById);

module.exports = router;