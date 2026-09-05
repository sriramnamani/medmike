# MediMike

## Project Title
MediMike - AI-Powered Medical Record & Clinical Report System

## Problem Statement
Medical reports are often stored as unstructured documents (PDFs, images) that are difficult to search, organize, and review. Healthcare professionals and patients need a system that can digitize these reports, extract relevant medical information, and present it in a structured, understandable format.

## Proposed Solution
Build an AI-powered web application that:
- Collects patient information
- Accepts medical report uploads (PDF, images)
- Extracts text from reports using OCR/PDF parsing
- Uses AI to identify and structure medical information
- Generates easy-to-understand summaries
- Stores data in a structured database
- Displays information in a clean, reviewable dashboard

## Features
- Patient registration and management
- Medical report upload (PDF, JPG, JPEG, PNG)
- Automated text extraction from reports
- AI-powered medical information extraction
- Structured patient records
- AI-generated summaries of medical reports
- Patient dashboard with statistics
- Report comparison with original documents
- Processing status tracking
- Responsive design for desktop, tablet, and mobile

## Technology Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Responsive design

### Backend
- Node.js
- Express.js
- REST API

### AI/ML
- OpenAI API
- Tesseract.js for OCR
- PDF parsing for text-based PDFs

### Database
- SQLite with better-sqlite3

### File Processing
- Multer for file uploads
- PDF text extraction
- OCR for scanned documents

## Project Architecture

```
Frontend (HTML/CSS/JS)
    ↓
REST API (Express.js)
    ↓
Services Layer
    ↓
Database (SQLite)
```

### AI Processing Pipeline
```
Upload Report
    ↓
Text Extraction (PDF/OCR)
    ↓
AI Processing (OpenAI)
    ↓
Medical Information Extraction
    ↓
Structured Data Generation
    ↓
Summary Generation
    ↓
Database Storage
```

## Folder Structure

```
AI-Patient-Record/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── server.js
│   │
│   ├── routes/
│   │   ├── patientRoutes.js
│   │   └── reportRoutes.js
│   │
│   ├── controllers/
│   │   ├── patientController.js
│   │   └── reportController.js
│   │
│   └── services/
│       ├── aiService.js
│       ├── ocrService.js
│       └── reportService.js
│
├── uploads/
│
├── database/
│   └── database.js
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Installation Instructions

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variable Setup

1. Copy `.env.example` to `.env`
2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   PORT=3000
   ```

## How to Run the Application

1. Set up environment variables (see above)
2. Start the server:
   ```bash
   npm start
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## API Endpoints

### Patient APIs
- `POST /api/patients` - Create a new patient
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get a specific patient

### Report APIs
- `POST /api/reports/upload` - Upload a medical report
- `POST /api/reports/:id/process` - Process a report with AI
- `GET /api/patients/:id/reports` - Get reports for a patient

## AI Workflow

1. **Report Upload**: User uploads a medical report (PDF or image)
2. **Text Extraction**: 
   - For PDFs: Extract text using PDF parsing
   - For images: Use OCR (Tesseract.js) to extract text
3. **AI Processing**: Send extracted text to OpenAI API
4. **Information Extraction**: AI identifies and structures medical information
5. **Summary Generation**: AI creates an understandable summary
6. **Storage**: Structured data and summary stored in database
7. **Display**: Information presented in patient dashboard

## Database Structure

### Patients Table
- id (INTEGER, PRIMARY KEY)
- name (TEXT)
- age (INTEGER)
- gender (TEXT)
- phone (TEXT)
- medical_history (TEXT)
- conditions (TEXT)
- allergies (TEXT)
- medications (TEXT)
- symptoms (TEXT)
- created_at (TIMESTAMP)

### Reports Table
- id (INTEGER, PRIMARY KEY)
- patient_id (INTEGER, FOREIGN KEY)
- file_name (TEXT)
- file_path (TEXT)
- file_type (TEXT)
- extracted_text (TEXT)
- upload_date (TIMESTAMP)
- processing_status (TEXT)

### AI Records Table
- id (INTEGER, PRIMARY KEY)
- patient_id (INTEGER, FOREIGN KEY)
- report_id (INTEGER, FOREIGN KEY)
- structured_data (JSON)
- ai_summary (TEXT)
- created_at (TIMESTAMP)

## Medical Safety Disclaimer

**IMPORTANT**: This application is designed for information processing and record organization only.

- AI-generated information is provided for record organization and informational purposes only
- It does NOT replace professional medical advice, diagnosis, or treatment
- All extracted information should be verified against the original report
- The AI does NOT diagnose patients independently
- The AI does NOT prescribe medication or recommend treatment
- Users should always consult qualified healthcare professionals for medical decisions

## Future Enhancements

- User authentication and authorization
- Cloud storage integration (AWS S3, Google Cloud Storage)
- Advanced OCR capabilities
- Integration with electronic health record (EHR) systems
- Multi-language support
- Advanced search and filtering
- Export functionality (PDF, CSV)
- Real-time notifications
- Mobile app development
- Advanced analytics and reporting
