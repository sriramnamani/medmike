// Frontend JavaScript for MediMike
console.log('MediMike - Frontend loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('MediMike DOM fully loaded');
    
    // Navigation functionality
    initNavigation();
    
    // File upload preview
    initFileUpload();
    
    // Patient form
    initPatientForm();
    
    // Report form
    initReportForm();

    // AI Analysis Modal
    initModal();
    
    // Check backend connectivity
    checkBackendConnectivity();

    // Load initial data
    loadDashboardData();
    loadPatients();
    loadReports();
});

// Check backend connectivity and show banner if offline/unreachable
async function checkBackendConnectivity() {
    try {
        const res = await fetch('/api/patients');
        if (!res.ok) {
            showBackendWarning(res.status === 404 ? 'Backend API not found (404)' : `Backend server error (${res.status})`);
        }
    } catch (e) {
        showBackendWarning('Cannot reach backend server');
    }
}

function showBackendWarning(reason) {
    if (document.getElementById('backendWarningBanner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'backendWarningBanner';
    banner.style.cssText = `
        background: linear-gradient(90deg, #742a2a, #9b2c2c);
        color: #fff;
        padding: 12px 20px;
        text-align: center;
        font-size: 0.92rem;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        border-bottom: 2px solid #e53e3e;
        position: sticky;
        top: 0;
        z-index: 2000;
        line-height: 1.5;
    `;
    
    const isVercel = window.location.hostname.includes('vercel.app');
    let message = `<strong><i class="fas fa-exclamation-triangle"></i> Backend Disconnected (${reason}):</strong> `;
    if (isVercel) {
        message += `You are viewing the frontend on Vercel, but the Node.js/SQLite backend is not running on Vercel. To create patients, upload reports, and use AI features, start the server locally by running <code>npm start</code> in your terminal and open <a href="http://localhost:3000" style="color:#fbd38d;font-weight:bold;text-decoration:underline;">http://localhost:3000</a>.`;
    } else {
        message += `The backend server appears offline. Make sure you run <code>npm start</code> in your terminal and open <a href="http://localhost:3000" style="color:#fbd38d;font-weight:bold;text-decoration:underline;">http://localhost:3000</a>.`;
    }
    
    banner.innerHTML = message;
    document.body.insertBefore(banner, document.body.firstChild);
}

// Navigation functionality
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Page navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetPage = this.getAttribute('data-page');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show target page
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => page.classList.remove('active'));
            
            const targetPageElement = document.getElementById(targetPage);
            if (targetPageElement) {
                targetPageElement.classList.add('active');
            }
            
            // Close mobile menu
            navMenu.classList.remove('active');
        });
    });
}

// File upload preview
function initFileUpload() {
    const fileInput = document.getElementById('reportFile');
    const fileInfo = document.getElementById('fileInfo');
    const fileDetails = document.getElementById('fileDetails');
    const fileName = document.getElementById('fileName');
    const fileType = document.getElementById('fileType');
    const fileSize = document.getElementById('fileSize');
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                // Update file info
                fileInfo.innerHTML = `<p>${file.name}</p>`;
                
                // Show file details
                fileDetails.style.display = 'block';
                fileName.textContent = file.name;
                fileType.textContent = file.type || 'Unknown';
                fileSize.textContent = formatFileSize(file.size);
            } else {
                fileInfo.innerHTML = '<p>No file selected</p>';
                fileDetails.style.display = 'none';
            }
        });
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Patient form
async function initPatientForm() {
    const patientForm = document.getElementById('patientForm');
    
    if (patientForm) {
        patientForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(patientForm);
            const patientData = Object.fromEntries(formData.entries());
            
            console.log('Patient data:', patientData);
            
            // Validate required fields
            if (!patientData.name || !patientData.age || !patientData.gender) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Validate age
            if (patientData.age < 0 || patientData.age > 150) {
                alert('Please enter a valid age');
                return;
            }
            
            try {
                const response = await fetch('/api/patients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(patientData)
                });
                
                let result = null;
                try {
                    result = await response.json();
                } catch (jsonErr) {
                    result = null;
                }
                
                if (response.ok) {
                    alert('Patient created successfully!');
                    patientForm.reset();
                    loadPatients(); // Reload patients list
                    loadDashboardData(); // Update dashboard
                } else {
                    let errMsg = result && result.error ? result.error : null;
                    if (!errMsg) {
                        if (response.status === 404) {
                            errMsg = 'Backend API endpoint not found (404). If you are viewing on Vercel, the backend server is not running there. Run "npm start" locally and open http://localhost:3000';
                        } else {
                            errMsg = `Server error (${response.status})`;
                        }
                    }
                    alert('Error: ' + errMsg);
                }
            } catch (error) {
                console.error('Error creating patient:', error);
                alert('Failed to connect to backend server.\n\nMake sure the local server is running by executing "npm start" in your terminal, then open http://localhost:3000');
            }
        });
    }
}

// Report form
async function initReportForm() {
    const reportForm = document.getElementById('reportForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    
    if (reportForm) {
        reportForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const patientId = document.getElementById('patientSelect').value;
            const fileInput = document.getElementById('reportFile');
            
            console.log('Form submission started');
            console.log('Patient ID:', patientId);
            console.log('File input:', fileInput);
            console.log('Files:', fileInput.files);
            
            // Validate
            if (!patientId) {
                alert('Please select a patient');
                return;
            }
            
            if (!fileInput.files.length) {
                alert('Please select a file to upload');
                return;
            }
            
            const file = fileInput.files[0];
            
            console.log('File selected:', { name: file.name, type: file.type, size: file.size });
            
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                alert('Invalid file type. Please upload PDF, JPG, or PNG files only.');
                return;
            }
            
            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                alert('File size exceeds 10MB limit');
                return;
            }
            
            console.log('Validation passed, starting upload');
            
            // Show upload status
            uploadStatus.style.display = 'block';
            uploadBtn.disabled = true;
            
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('patientId', patientId);
                
                console.log('FormData prepared');
                
                const response = await fetch('/api/reports/upload', {
                    method: 'POST',
                    body: formData
                });
                
                console.log('Upload response status:', response.status);
                
                let result = null;
                try {
                    result = await response.json();
                } catch (e) {
                    result = null;
                }
                console.log('Upload response:', result);
                
                uploadStatus.style.display = 'none';
                uploadBtn.disabled = false;
                
                if (response.ok && result) {
                    showToast('Report uploaded successfully! MediMike AI is now analyzing...', 'success');
                    reportForm.reset();
                    document.getElementById('fileDetails').style.display = 'none';
                    document.getElementById('fileInfo').innerHTML = '<p>No file selected</p>';
                    await loadReports(); // Reload reports list
                    await loadDashboardData(); // Update dashboard

                    // Automatically trigger AI processing on the newly uploaded report
                    if (result.reportId) {
                        processReportWithAi(result.reportId);
                    }
                } else {
                    const errMsg = (result && result.error) ? result.error : (response.status === 404 ? 'Backend API not found (404). Ensure backend is running locally at http://localhost:3000' : `Upload failed (${response.status})`);
                    showToast('Upload error: ' + errMsg, 'error');
                }
            } catch (error) {
                console.error('Error uploading report:', error);
                uploadStatus.style.display = 'none';
                uploadBtn.disabled = false;
                showToast('Failed to upload report: ' + error.message, 'error');
            }
        });
    } else {
        console.log('Report form not found');
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load patient count
        const patientCountResponse = await fetch('/api/patients/count/total');
        const patientCountData = await patientCountResponse.json();
        document.getElementById('totalPatients').textContent = patientCountData.count;
        
        // Load report count
        const reportCountResponse = await fetch('/api/reports/count/total');
        const reportCountData = await reportCountResponse.json();
        document.getElementById('totalReports').textContent = reportCountData.count;
        
        // Load processed report count
        const processedCountResponse = await fetch('/api/reports/count/processed');
        const processedCountData = await processedCountResponse.json();
        document.getElementById('processedReports').textContent = processedCountData.count;
        
        // Load recent reports
        const recentReportsResponse = await fetch('/api/reports/recent/list');
        const recentReportsData = await recentReportsResponse.json();
        displayRecentReports(recentReportsData);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Helper to render status badge
function getStatusBadge(status) {
    switch (status) {
        case 'Processed':
            return '<span class="status-badge status-processed"><i class="fas fa-check-circle"></i> AI Analyzed</span>';
        case 'Processing':
            return '<span class="status-badge status-processing"><i class="fas fa-spinner fa-spin"></i> Processing</span>';
        case 'Failed':
            return '<span class="status-badge status-failed"><i class="fas fa-exclamation-circle"></i> Analysis Failed</span>';
        case 'Uploaded':
        default:
            return '<span class="status-badge status-uploaded"><i class="fas fa-clock"></i> Uploaded</span>';
    }
}

// Render an individual report card item
function renderReportItem(report) {
    const rawFileName = report.file_path ? report.file_path.split(/[\\/]/).pop() : '';
    const fileUrl = rawFileName ? `/uploads/${encodeURIComponent(rawFileName)}` : '#';
    const isProcessed = report.processing_status === 'Processed' || report.ai_record_id;
    const isProcessing = report.processing_status === 'Processing';

    let actionButtonsHtml = '';

    if (isProcessed) {
        actionButtonsHtml += `
            <button class="btn-sm btn-ai-view" onclick="viewAiAnalysis(${report.id})">
                <i class="fas fa-brain"></i> View Analysis
            </button>
            <button class="btn-sm btn-secondary" onclick="processReportWithAi(${report.id}, this)" title="Re-run AI Analysis">
                <i class="fas fa-redo"></i> Re-analyze
            </button>
        `;
    } else if (isProcessing) {
        actionButtonsHtml += `
            <button class="btn-sm btn-ai-process" disabled>
                <i class="fas fa-spinner fa-spin"></i> Analyzing...
            </button>
        `;
    } else {
        actionButtonsHtml += `
            <button class="btn-sm btn-ai-process" onclick="processReportWithAi(${report.id}, this)">
                <i class="fas fa-magic"></i> Process with AI
            </button>
        `;
    }

    if (rawFileName) {
        actionButtonsHtml += `
            <a class="btn-sm btn-secondary" href="${fileUrl}" target="_blank" title="Open original document">
                <i class="fas fa-external-link-alt"></i> View File
            </a>
        `;
    }

    return `
        <div class="report-item" id="report-item-${report.id}">
            <div class="report-info">
                <h4><i class="fas fa-file-medical"></i> ${escapeHtml(report.file_name)}</h4>
                <p><i class="fas fa-user"></i> Patient: <strong>${escapeHtml(report.patient_name || 'Unknown')}</strong></p>
                <p><i class="fas fa-calendar"></i> Uploaded: ${new Date(report.upload_date).toLocaleDateString()}</p>
                <p><i class="fas fa-info-circle"></i> Status: ${getStatusBadge(report.processing_status)}</p>
            </div>
            <div class="report-actions">
                ${actionButtonsHtml}
            </div>
        </div>
    `;
}

// Display recent reports
function displayRecentReports(reports) {
    const recentReportsContainer = document.getElementById('recentReports');
    
    if (!reports || reports.length === 0) {
        recentReportsContainer.innerHTML = '<div class="empty-state"><i class="fas fa-file-medical"></i><p>No recent reports available</p></div>';
        return;
    }
    
    recentReportsContainer.innerHTML = reports.map(renderReportItem).join('');
}

// Display reports
function displayReports(reports) {
    const reportsListContainer = document.getElementById('reportsList');
    
    if (!reports || reports.length === 0) {
        reportsListContainer.innerHTML = '<div class="empty-state"><i class="fas fa-file-upload"></i><p>No reports uploaded yet</p></div>';
        return;
    }
    
    reportsListContainer.innerHTML = reports.map(renderReportItem).join('');
}

// Load patients
async function loadPatients() {
    try {
        const response = await fetch('/api/patients');
        const patients = await response.json();
        displayPatients(patients);
        updatePatientSelect(patients);
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

// Display patients
function displayPatients(patients) {
    const patientsListContainer = document.getElementById('patientsList');
    
    if (!patients || patients.length === 0) {
        patientsListContainer.innerHTML = '<div class="empty-state"><i class="fas fa-user-plus"></i><p>No patients registered yet</p></div>';
        return;
    }
    
    patientsListContainer.innerHTML = patients.map(patient => `
        <div class="patient-item">
            <div>
                <h4><i class="fas fa-user"></i> ${escapeHtml(patient.name)}</h4>
                <p><i class="fas fa-birthday-cake"></i> Age: ${escapeHtml(patient.age)} | <i class="fas fa-venus-mars"></i> Gender: ${escapeHtml(patient.gender)}</p>
                <p><i class="fas fa-phone"></i> Phone: ${escapeHtml(patient.phone || 'Not provided')}</p>
            </div>
        </div>
    `).join('');
}

// Update patient select dropdown
function updatePatientSelect(patients) {
    const patientSelect = document.getElementById('patientSelect');
    
    if (!patientSelect) return;
    
    // Keep the first option
    patientSelect.innerHTML = '<option value="">Select a patient</option>';
    
    if (patients && patients.length > 0) {
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.name} (Age: ${patient.age})`;
            patientSelect.appendChild(option);
        });
    }
}

// Load reports
async function loadReports() {
    try {
        const response = await fetch('/api/reports');
        const reports = await response.json();
        displayReports(reports);
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Trigger AI Processing on a report
async function processReportWithAi(reportId, buttonElement) {
    if (!reportId) return;

    const originalContent = buttonElement ? buttonElement.innerHTML : '';
    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    showToast('MediMike AI is extracting & analyzing clinical records...', 'info');

    try {
        const response = await fetch(`/api/reports/${reportId}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (response.ok) {
            showToast('AI analysis completed successfully!', 'success');
            // Refresh lists & counters
            await loadReports();
            await loadDashboardData();
            // Automatically open analysis modal
            viewAiAnalysis(reportId);
        } else {
            console.error('Processing error:', data);
            showToast('AI Processing failed: ' + (data.error || 'Unknown error'), 'error');
            await loadReports();
            await loadDashboardData();
        }
    } catch (error) {
        console.error('Error triggering AI processing:', error);
        showToast('Network error while processing report: ' + error.message, 'error');
        await loadReports();
    } finally {
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalContent;
        }
    }
}

// Open and display AI analysis modal
async function viewAiAnalysis(reportId) {
    const modal = document.getElementById('aiAnalysisModal');
    const modalLoading = document.getElementById('modalLoading');
    const modalDetails = document.getElementById('modalContentDetails');
    const reportTitle = document.getElementById('modalReportTitle');
    const reportMeta = document.getElementById('modalReportMeta');
    const viewOriginalBtn = document.getElementById('modalViewOriginalBtn');

    if (!modal) return;

    // Show modal & loading state
    modal.style.display = 'flex';
    modalLoading.style.display = 'block';
    modalDetails.style.display = 'none';

    try {
        const response = await fetch(`/api/reports/${reportId}/ai-record`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to load AI record');
        }

        const data = await response.json();
        window.activeAiRecord = data;
        const structured = data.structured_data || {};

        // Title and meta
        reportTitle.textContent = structured.report_type || data.file_name || 'Medical Report Analysis';
        reportMeta.innerHTML = `
            <i class="fas fa-user"></i> Patient: <strong>${escapeHtml(data.patient_name || 'N/A')}</strong> (Age: ${data.patient_age || 'N/A'}, ${data.patient_gender || 'N/A'})
            ${data.upload_date ? ` | <i class="fas fa-calendar-alt"></i> ${new Date(data.upload_date).toLocaleDateString()}` : ''}
            ${structured.facility_or_doctor ? ` | <i class="fas fa-hospital"></i> ${escapeHtml(structured.facility_or_doctor)}` : ''}
        `;

        // Original file button
        const rawFileName = data.file_name || '';
        viewOriginalBtn.href = `/uploads/${encodeURIComponent(rawFileName)}`;

        // Summary & Risk
        document.getElementById('modalAiSummary').textContent = data.ai_summary || structured.ai_summary || 'No summary available.';
        
        const riskBadge = document.getElementById('modalRiskBadge');
        const risk = (structured.risk_level || 'Low').toLowerCase();
        riskBadge.textContent = (structured.risk_level || 'Low') + ' Risk';
        riskBadge.className = 'risk-badge ' + (risk === 'high' ? 'risk-high' : (risk === 'moderate' ? 'risk-moderate' : 'risk-low'));

        // Key Findings
        const keyFindingsList = document.getElementById('modalKeyFindings');
        if (structured.key_findings && structured.key_findings.length > 0) {
            keyFindingsList.innerHTML = structured.key_findings.map(f => `<li>${escapeHtml(f)}</li>`).join('');
        } else {
            keyFindingsList.innerHTML = '<li style="color:var(--text-secondary);">No specific key findings noted.</li>';
        }

        // Abnormal Findings
        const abnormalContainer = document.getElementById('modalAbnormalFindings');
        if (structured.abnormal_findings && structured.abnormal_findings.length > 0) {
            abnormalContainer.innerHTML = structured.abnormal_findings.map(item => {
                const title = typeof item === 'string' ? item : (item.finding || 'Abnormal Observation');
                const severity = (item && item.severity) ? item.severity : 'Attention';
                const details = (item && item.details) ? item.details : '';
                return `
                    <div class="abnormal-item">
                        <div class="abnormal-header">
                            <span><i class="fas fa-exclamation-circle"></i> ${escapeHtml(title)}</span>
                            <span class="flag-badge flag-high">${escapeHtml(severity)}</span>
                        </div>
                        ${details ? `<p>${escapeHtml(details)}</p>` : ''}
                    </div>
                `;
            }).join('');
        } else {
            abnormalContainer.innerHTML = '<p style="color:var(--text-secondary);"><i class="fas fa-check-circle" style="color:var(--accent-success);"></i> No critical abnormalities flagged.</p>';
        }

        // Vitals & Metrics Table
        const metricsTbody = document.getElementById('modalMetricsTbody');
        if (structured.vitals_and_metrics && structured.vitals_and_metrics.length > 0) {
            metricsTbody.innerHTML = structured.vitals_and_metrics.map(m => {
                const flag = (m.flag || 'Normal').toLowerCase();
                let flagClass = 'flag-normal';
                if (flag.includes('high')) flagClass = 'flag-high';
                else if (flag.includes('low')) flagClass = 'flag-low';
                else if (flag.includes('abnormal')) flagClass = 'flag-abnormal';

                return `
                    <tr>
                        <td><strong>${escapeHtml(m.name || 'Metric')}</strong></td>
                        <td>${escapeHtml(m.value || '-')} ${escapeHtml(m.unit || '')}</td>
                        <td>${escapeHtml(m.reference_range || 'N/A')}</td>
                        <td><span class="flag-badge ${flagClass}">${escapeHtml(m.flag || 'Normal')}</span></td>
                    </tr>
                `;
            }).join('');
        } else {
            metricsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">No discrete lab metrics or vital values found.</td></tr>';
        }

        // Diagnoses
        const diagnosesList = document.getElementById('modalDiagnoses');
        if (structured.diagnoses && structured.diagnoses.length > 0) {
            diagnosesList.innerHTML = structured.diagnoses.map(d => `<li><i class="fas fa-notes-medical"></i> ${escapeHtml(d)}</li>`).join('');
        } else {
            diagnosesList.innerHTML = '<li style="background:transparent;color:var(--text-secondary);">None identified.</li>';
        }

        // Medications
        const medicationsContainer = document.getElementById('modalMedications');
        if (structured.medications && structured.medications.length > 0) {
            medicationsContainer.innerHTML = structured.medications.map(med => {
                const name = typeof med === 'string' ? med : med.name;
                const dosage = med.dosage ? `${med.dosage}` : '';
                const freq = med.frequency ? ` • ${med.frequency}` : '';
                const instr = med.instructions ? ` (${med.instructions})` : '';
                return `
                    <div class="medication-card">
                        <h5><i class="fas fa-capsules"></i> ${escapeHtml(name)}</h5>
                        <p>${escapeHtml(dosage + freq + instr)}</p>
                    </div>
                `;
            }).join('');
        } else {
            medicationsContainer.innerHTML = '<p style="color:var(--text-secondary);">No medications documented in report.</p>';
        }

        // Recommendations
        const recsList = document.getElementById('modalRecommendations');
        if (structured.recommendations && structured.recommendations.length > 0) {
            recsList.innerHTML = structured.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('');
        } else {
            recsList.innerHTML = '<li style="color:var(--text-secondary);">Standard follow-up with physician recommended.</li>';
        }

        // Raw extracted text
        const rawTextElem = document.getElementById('modalRawText');
        rawTextElem.textContent = data.extracted_text || 'No raw text stored.';

        // Display contents
        modalLoading.style.display = 'none';
        modalDetails.style.display = 'block';

    } catch (err) {
        console.error('Error fetching AI analysis:', err);
        modalLoading.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color:var(--accent-danger);"></i>
                <p>Failed to load analysis: ${escapeHtml(err.message)}</p>
                <button class="btn btn-primary btn-sm" onclick="closeModal()">Close</button>
            </div>
        `;
    }
}

// Modal control
function initModal() {
    const modal = document.getElementById('aiAnalysisModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const backdrop = document.getElementById('modalBackdrop');

    if (!modal) return;

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    if (backdrop) {
        backdrop.addEventListener('click', closeModal);
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.getElementById('aiAnalysisModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Download or Print Clinical Analysis Report as PDF
function downloadCurrentAnalysisPDF() {
    const record = window.activeAiRecord;
    if (!record) {
        showToast('No active analysis loaded to download', 'error');
        return;
    }

    const patientName = (record.patient_name || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '_');
    const prevTitle = document.title;
    document.title = `MediMike_Clinical_Report_${patientName}_#${record.report_id || record.id}`;

    showToast('Opening print dialog. Select "Save as PDF" to download report.', 'info');
    
    // Give browser a moment before triggering print dialog
    setTimeout(() => {
        window.print();
        document.title = prevTitle;
    }, 250);
}

// Export Structured AI Analytics as JSON File
function exportCurrentAnalysisJSON() {
    const record = window.activeAiRecord;
    if (!record) {
        showToast('No active analysis loaded to export', 'error');
        return;
    }

    const patientName = (record.patient_name || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `MediMike_Analytics_${patientName}_Report_${record.report_id || record.id}.json`;
    
    const exportData = {
        app: 'MediMike AI Medical Record Assistant',
        exported_at: new Date().toISOString(),
        patient_name: record.patient_name,
        patient_age: record.patient_age,
        patient_gender: record.patient_gender,
        report_id: record.report_id,
        file_name: record.file_name,
        upload_date: record.upload_date,
        ai_summary: record.ai_summary,
        structured_data: record.structured_data
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filename} successfully!`, 'success');
}

// Export Dashboard Analytics and Reports to CSV
async function exportDashboardAnalyticsCSV() {
    try {
        showToast('Preparing dashboard analytics export...', 'info');
        const response = await fetch('/api/reports');
        const reports = await response.json();

        if (!reports || reports.length === 0) {
            showToast('No reports available to export', 'info');
            return;
        }

        const headers = ['Report ID', 'Patient ID', 'Patient Name', 'File Name', 'File Type', 'Upload Date', 'Processing Status', 'AI Analyzed'];
        const rows = reports.map(r => [
            r.id,
            r.patient_id,
            `"${(r.patient_name || '').replace(/"/g, '""')}"`,
            `"${(r.file_name || '').replace(/"/g, '""')}"`,
            r.file_type,
            r.upload_date,
            r.processing_status,
            r.ai_record_id ? 'Yes' : 'No'
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `MediMike_Reports_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Dashboard analytics exported to CSV!', 'success');
    } catch (err) {
        console.error('Error exporting dashboard analytics:', err);
        showToast('Failed to export CSV: ' + err.message, 'error');
    }
}

// Toast notification helper
function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

// Simple HTML escaping helper to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

