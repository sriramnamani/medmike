const db = require('../../database/database');
const ocrService = require('./ocrService');
const aiService = require('./aiService');

/**
 * Helper to run a database query returning a Promise (single row)
 */
function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

/**
 * Helper to run a database execution returning a Promise
 */
function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
}

/**
 * Process a report: Extract text via OCR/PDF parsing, send to AI, and save results
 * @param {number|string} reportId - The ID of the report to process
 * @returns {Promise<object>} Processing outcome with structured data and summary
 */
async function processReport(reportId) {
    // 1. Fetch report details
    const report = await dbGet('SELECT * FROM reports WHERE id = ?', [reportId]);
    if (!report) {
        throw new Error(`Report with ID ${reportId} not found`);
    }

    // 2. Fetch associated patient details for clinical context
    const patient = await dbGet('SELECT * FROM patients WHERE id = ?', [report.patient_id]);

    try {
        // 3. Mark status as Processing
        await dbRun('UPDATE reports SET processing_status = ? WHERE id = ?', ['Processing', reportId]);

        // 4. Extract text from file using OCR or PDF parser
        console.log(`[MediMike] Extracting text for report #${reportId} (${report.file_name})...`);
        let extractedText = '';
        try {
            extractedText = await ocrService.extractTextFromFile(report.file_path, report.file_type);
        } catch (ocrError) {
            console.error(`[MediMike] OCR extraction failed for report #${reportId}:`, ocrError);
            throw new Error(`Failed to extract text from document: ${ocrError.message}`);
        }

        if (!extractedText || !extractedText.trim()) {
            console.warn(`[MediMike] Extracted text was empty for report #${reportId}, using document metadata.`);
            extractedText = `Medical Record Document: ${report.file_name} (Patient ID: ${report.patient_id})`;
        }

        // 5. Save extracted text to report
        await dbRun('UPDATE reports SET extracted_text = ? WHERE id = ?', [extractedText, reportId]);

        // 6. Analyze with OpenAI
        console.log(`[MediMike] Sending extracted text to AI for report #${reportId}...`);
        const aiResult = await aiService.analyzeMedicalReport(extractedText, patient || {});

        const structuredDataJson = JSON.stringify(aiResult.structured_data);

        // 7. Check if AI record already exists for this report
        const existingRecord = await dbGet('SELECT id FROM ai_records WHERE report_id = ?', [reportId]);

        let recordId;
        if (existingRecord) {
            await dbRun(
                'UPDATE ai_records SET structured_data = ?, ai_summary = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
                [structuredDataJson, aiResult.ai_summary, existingRecord.id]
            );
            recordId = existingRecord.id;
        } else {
            const insertResult = await dbRun(
                'INSERT INTO ai_records (patient_id, report_id, structured_data, ai_summary) VALUES (?, ?, ?, ?)',
                [report.patient_id, reportId, structuredDataJson, aiResult.ai_summary]
            );
            recordId = insertResult.lastID;
        }

        // 8. Mark report as Processed
        await dbRun('UPDATE reports SET processing_status = ? WHERE id = ?', ['Processed', reportId]);

        console.log(`[MediMike] Successfully processed report #${reportId}`);

        return {
            reportId: Number(reportId),
            patientId: report.patient_id,
            recordId: recordId,
            status: 'Processed',
            ai_summary: aiResult.ai_summary,
            structured_data: aiResult.structured_data,
            extracted_text: extractedText
        };
    } catch (processError) {
        console.error(`[MediMike] Processing failed for report #${reportId}:`, processError);
        // Mark status as Failed
        await dbRun('UPDATE reports SET processing_status = ? WHERE id = ?', ['Failed', reportId]);
        throw processError;
    }
}

/**
 * Get AI record and parsed structured data for a report
 * @param {number|string} reportId
 * @returns {Promise<object|null>}
 */
async function getAiRecordByReportId(reportId) {
    const record = await dbGet(
        `SELECT a.*, r.file_name, r.file_type, r.processing_status, r.upload_date, r.extracted_text, p.name as patient_name, p.age as patient_age, p.gender as patient_gender
         FROM ai_records a
         JOIN reports r ON a.report_id = r.id
         JOIN patients p ON a.patient_id = p.id
         WHERE a.report_id = ?`,
        [reportId]
    );

    if (!record) {
        return null;
    }

    try {
        record.structured_data = JSON.parse(record.structured_data);
    } catch (e) {
        console.error('Failed to parse structured_data JSON in getAiRecordByReportId:', e);
    }

    return record;
}

module.exports = {
    processReport,
    getAiRecordByReportId
};
