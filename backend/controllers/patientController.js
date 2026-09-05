const db = require('../../database/database');

// Create a new patient
exports.createPatient = (req, res) => {
    try {
        const { name, age, gender, phone, medical_history, conditions, allergies, medications, symptoms } = req.body;
        
        // Validate required fields
        if (!name || !age || !gender) {
            return res.status(400).json({ error: 'Name, age, and gender are required' });
        }
        
        // Validate age
        if (age < 0 || age > 150) {
            return res.status(400).json({ error: 'Invalid age' });
        }
        
        const sql = `INSERT INTO patients (name, age, gender, phone, medical_history, conditions, allergies, medications, symptoms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [name, age, gender, phone, medical_history, conditions, allergies, medications, symptoms];
        
        db.run(sql, params, function(err) {
            if (err) {
                console.error('Error creating patient:', err.message);
                return res.status(500).json({ error: 'Failed to create patient' });
            }
            
            res.status(201).json({
                message: 'Patient created successfully',
                patientId: this.lastID
            });
        });
    } catch (error) {
        console.error('Error in createPatient:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all patients
exports.getAllPatients = (req, res) => {
    try {
        const sql = `SELECT * FROM patients ORDER BY created_at DESC`;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching patients:', err.message);
                return res.status(500).json({ error: 'Failed to fetch patients' });
            }
            
            res.json(rows);
        });
    } catch (error) {
        console.error('Error in getAllPatients:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a specific patient by ID
exports.getPatientById = (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `SELECT * FROM patients WHERE id = ?`;
        
        db.get(sql, [id], (err, row) => {
            if (err) {
                console.error('Error fetching patient:', err.message);
                return res.status(500).json({ error: 'Failed to fetch patient' });
            }
            
            if (!row) {
                return res.status(404).json({ error: 'Patient not found' });
            }
            
            res.json(row);
        });
    } catch (error) {
        console.error('Error in getPatientById:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get patient count for dashboard
exports.getPatientCount = (req, res) => {
    try {
        const sql = `SELECT COUNT(*) as count FROM patients`;
        
        db.get(sql, [], (err, row) => {
            if (err) {
                console.error('Error fetching patient count:', err.message);
                return res.status(500).json({ error: 'Failed to fetch patient count' });
            }
            
            res.json({ count: row.count });
        });
    } catch (error) {
        console.error('Error in getPatientCount:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};