const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'patient_records.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
function initializeDatabase() {
    // Patients table
    db.run(`
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            phone TEXT,
            medical_history TEXT,
            conditions TEXT,
            allergies TEXT,
            medications TEXT,
            symptoms TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating patients table:', err.message);
        }
    });

    // Reports table
    db.run(`
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            extracted_text TEXT,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processing_status TEXT DEFAULT 'Uploaded',
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('Error creating reports table:', err.message);
        }
    });

    // AI Records table
    db.run(`
        CREATE TABLE IF NOT EXISTS ai_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            report_id INTEGER NOT NULL,
            structured_data TEXT,
            ai_summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('Error creating ai_records table:', err.message);
        } else {
            console.log('Database initialized successfully');
        }
    });
}

// Initialize database on module load
initializeDatabase();

module.exports = db;
