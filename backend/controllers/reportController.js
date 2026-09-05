const db = require('../../database/database');
const path = require('path');
const fs = require('fs');
const reportService = require('../services/reportService');

// Upload a report
exports.uploadReport = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { patientId } = req.body;
        
        // Validate patient ID
        if (!patientId) {
            // Delete the uploaded file if patient ID is missing
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Patient ID is required' });
        }
        
        // Check if patient exists
        db.get('SELECT id FROM patients WHERE id = ?', [patientId], (err, patient) => {
            if (err) {
                console.error('Error checking patient:', err.message);
                fs.unlinkSync(req.file.path);
                return res.status(500).json({ error: 'Failed to validate patient' });
            }
            
            if (!patient) {
                fs.unlinkSync(req.file.path);
                return res.status(404).json({ error: 'Patient not found' });
            }
            
            // Insert report into database
            const sql = `INSERT INTO reports (patient_id, file_name, file_path, file_type, processing_status) VALUES (?, ?, ?, ?, ?)`;
            const params = [
                patientId,
                req.file.originalname,
                req.file.path,
                req.file.mimetype,
                'Uploaded'
            ];
            
            db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error creating report:', err.message);
                    fs.unlinkSync(req.file.path);
                    return res.status(500).json({ error: 'Failed to create report' });
                }
                
                res.status(201).json({
                    message: 'Report uploaded successfully',
                    reportId: this.lastID
                });
            });
        });
    } catch (error) {
        console.error('Error in uploadReport:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all reports
exports.getAllReports = (req, res) => {
    try {
        const sql = `
            SELECT r.*, p.name as patient_name, a.id as ai_record_id 
            FROM reports r 
            JOIN patients p ON r.patient_id = p.id 
            LEFT JOIN ai_records a ON r.id = a.report_id 
            ORDER BY r.upload_date DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching reports:', err.message);
                return res.status(500).json({ error: 'Failed to fetch reports' });
            }
            
            res.json(rows);
        });
    } catch (error) {
        console.error('Error in getAllReports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get reports for a specific patient
exports.getPatientReports = (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `SELECT * FROM reports WHERE patient_id = ? ORDER BY upload_date DESC`;
        
        db.all(sql, [id], (err, rows) => {
            if (err) {
                console.error('Error fetching patient reports:', err.message);
                return res.status(500).json({ error: 'Failed to fetch patient reports' });
            }
            
            res.json(rows);
        });
    } catch (error) {
        console.error('Error in getPatientReports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a specific report by ID
exports.getReportById = (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `SELECT r.*, p.name as patient_name FROM reports r JOIN patients p ON r.patient_id = p.id WHERE r.id = ?`;
        
        db.get(sql, [id], (err, row) => {
            if (err) {
                console.error('Error fetching report:', err.message);
                return res.status(500).json({ error: 'Failed to fetch report' });
            }
            
            if (!row) {
                return res.status(404).json({ error: 'Report not found' });
            }
            
            res.json(row);
        });
    } catch (error) {
        console.error('Error in getReportById:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get report count for dashboard
exports.getReportCount = (req, res) => {
    try {
        const sql = `SELECT COUNT(*) as count FROM reports`;
        
        db.get(sql, [], (err, row) => {
            if (err) {
                console.error('Error fetching report count:', err.message);
                return res.status(500).json({ error: 'Failed to fetch report count' });
            }
            
            res.json({ count: row.count });
        });
    } catch (error) {
        console.error('Error in getReportCount:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get processed report count for dashboard
exports.getProcessedReportCount = (req, res) => {
    try {
        const sql = `SELECT COUNT(*) as count FROM reports WHERE processing_status = 'Processed'`;
        
        db.get(sql, [], (err, row) => {
            if (err) {
                console.error('Error fetching processed report count:', err.message);
                return res.status(500).json({ error: 'Failed to fetch processed report count' });
            }
            
            res.json({ count: row.count });
        });
    } catch (error) {
        console.error('Error in getProcessedReportCount:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get recent reports for dashboard
exports.getRecentReports = (req, res) => {
    try {
        const sql = `
            SELECT r.*, p.name as patient_name, a.id as ai_record_id 
            FROM reports r 
            JOIN patients p ON r.patient_id = p.id 
            LEFT JOIN ai_records a ON r.id = a.report_id 
            ORDER BY r.upload_date DESC 
            LIMIT 5
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching recent reports:', err.message);
                return res.status(500).json({ error: 'Failed to fetch recent reports' });
            }
            
            res.json(rows);
        });
    } catch (error) {
        console.error('Error in getRecentReports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Process report with AI
exports.processReport = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await reportService.processReport(id);
        res.json({
            message: 'Report processed successfully with AI',
            ...result
        });
    } catch (error) {
        console.error(`Error processing report #${req.params.id}:`, error);
        res.status(500).json({ error: error.message || 'Failed to process report with AI' });
    }
};

// Get AI record for a specific report
exports.getReportAiRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await reportService.getAiRecordByReportId(id);
        if (!record) {
            return res.status(404).json({ error: 'AI analysis not found for this report. Please process the report first.' });
        }
        res.json(record);
    } catch (error) {
        console.error(`Error fetching AI record for report #${req.params.id}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};