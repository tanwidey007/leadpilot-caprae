# LeadPilot — Lead Quality & Prioritization Dashboard

LeadPilot is a lightweight full-stack application designed to help sales teams clean, review, and prioritize prospect lists before outreach. It turns raw CSV data into a more organized view of potential leads by highlighting profile completeness, missing information, duplicate records, and priority levels.

The project was built as a focused prototype for the Caprae Capital Full Stack Developer assessment, with an emphasis on practical business value, usability, and clear, explainable logic.

## 1. Business Problem

Sales teams may spend considerable time reviewing incomplete prospect lists, identifying repeated records, and deciding which prospects to investigate first. Inconsistent data can make this process slower and less reliable.

LeadPilot addresses this problem by providing a simple workflow to:

- Import prospect data from a CSV file.
- Assess how complete each lead's profile is.
- Identify potential duplicate records.
- Highlight missing key information.
- Search and filter leads by priority.
- Export the visible results for further review.

The goal is to help users organize their existing data and make more informed decisions about their next steps.

## 2. Key Features

- **Lead dashboard:** View prospect records alongside their profile completeness scores and priority levels.
- **Profile completeness scoring:** Evaluate the presence of selected contact and company attributes using a transparent, rule-based scoring model.
- **Priority classification:** Categorize leads as High, Medium, or Low according to their completeness scores.
- **CSV import:** Upload a CSV file containing prospect information.
- **Duplicate detection:** Flag repeated records using normalized company names and email addresses.
- **Missing-data detection:** Highlight missing company, email, industry, and location fields.
- **Search:** Find leads by company, contact name, industry, and other displayed searchable fields.
- **Priority filtering:** Filter the list by High, Medium, or Low priority.
- **Duplicate filtering:** Display records flagged as duplicates.
- **Lead details:** Open an individual record to inspect its available information and data-quality flags.
- **CSV export:** Download the currently visible, filtered records for further analysis.

## 3. Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, Vite, JavaScript, plain CSS |
| Backend | Python, FastAPI |
| Data processing | Python CSV utilities and rule-based logic |
| API documentation | FastAPI interactive documentation |
| Data input/output | CSV import and export |

The frontend communicates with the backend through HTTP API requests. The backend normalizes incoming records, calculates scores, and identifies duplicates and missing fields.

## 4. Architecture

The application follows a simple frontend–backend architecture.

1. **Frontend:** Displays the dashboard, sample leads, search and filtering controls, record details, and CSV export functionality.
2. **Backend API:** Provides the sample dataset and processes uploaded CSV files.
3. **Processing layer:** Normalizes recognized column names, calculates completeness scores, assigns priority levels, and flags duplicates and missing fields.
4. **Response layer:** Returns processed lead records as JSON for the frontend to display.

The prototype uses in-memory processing and does not require a database.

## 5. Getting Started

### Prerequisites

- Python 3.10 or later.
- Node.js 20.19+ or a compatible supported version.
- npm.
- Git (optional for running locally, required for the GitHub workflow).

### Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd leadpilot-caprae
```

Replace the repository URL with the actual GitHub URL after creating the repository. If you have already downloaded the project, open its root folder directly instead.

### Start the backend

Open a terminal in the project root:

```bash
cd backend
python -m venv .venv
```

On Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

On macOS or Linux:

```bash
source .venv/bin/activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn main:app --reload --port 8000
```

Backend health check:

`http://localhost:8000/health`

Interactive API documentation:

`http://localhost:8000/docs`

Keep the backend terminal running.

### Start the frontend

Open a second terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

`http://localhost:5173`

Keep both development servers running while using the application.

## 6. CSV Import Format

The importer recognizes common variations of the following column names:

| Field | Example |
|-------|---------|
| company | Northstar Dental Group |
|  name   | Maya Chen |
| email   | maya@example.com |
| phone   | +1-555-0101 |
| industry | Healthcare |
| location | Austin, TX |
| employees | 85 |
| revenue | 12000000 |

Column names are normalized, and several common aliases are supported, such as `company_name`, `contact_name`, `email_address`, `employee_count`, and `annual_revenue`.

Extra columns are retained where possible. Missing values are left empty rather than invented.

The demo accepts CSV files with a header row and up to 5,000 data records. Uploaded data must be UTF-8 compatible. Invalid file types, unreadable CSV data, and empty datasets are rejected with an API error.

## 7. Scoring Methodology

LeadPilot uses a deterministic profile completeness score with a maximum of 100 points.

| Attribute present | Points |
|-------------------|--------|
| Email | 25 |
| Phone | 10 |
| Industry | 20 |
| Location | 15 |
| Employee count | 15 |
| Revenue | 15 |
| **Maximum** | **100** |

Each attribute contributes its assigned points when its value is present.

### Priority thresholds

- **High:** Score of 80–100.
- **Medium:** Score of 55–79.
- **Low:** Score below 55.

These thresholds are configurable in the backend implementation.

**Important:** The score measures profile completeness, not verified lead quality, purchase intent, or probability of conversion. A complete profile is not necessarily a more promising sales opportunity. The model should be calibrated against real business outcomes before production use.

## 8. Duplicate and Missing-Data Detection

### Duplicate detection

Records are flagged as potential duplicates when their normalized company name and email address match an earlier record. Comparison is case-insensitive and ignores surrounding whitespace.

This is a basic heuristic rather than a comprehensive entity-resolution system. Records with variations in company names or different email addresses may not be recognized as duplicates.

### Missing-data detection

The application flags missing values for:

- Company
- Email
- Industry
- Location

Phone number, employee count, and revenue also contribute to the completeness score, but they are not part of the current missing-field flag list.

## 9. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check whether the API is running. |
| GET | `/api/leads` | Retrieve and process the built-in sample dataset. |
| POST | `/api/leads/upload` | Upload and process a CSV file. |

FastAPI provides interactive documentation at `/docs`, where the endpoints can be explored and tested.

## 10. Suggested Evaluation Workflow

1. Open the dashboard and review the sample leads.
2. Search for a company or contact.
3. Filter the records by priority.
4. Enable duplicate-only filtering to inspect flagged records.
5. Open a lead's details to review its score and missing fields.
6. Upload a valid CSV file to process a different dataset.
7. Export the visible results to a CSV file.

## 11. Current Limitations

This version is intentionally scoped as a lightweight assessment prototype.

- **No persistent database:** Data is processed in memory and is reset when the application restarts.
- **No authentication or authorization:** The prototype is not intended for unrestricted public use.
- **No external enrichment:** It does not retrieve additional company or contact information from third-party providers.
- **No verified contact information:** Email addresses and phone numbers are not checked for deliverability or validity.
- **Heuristic scoring:** The model evaluates field completeness, not conversion potential.
- **Basic duplicate matching:** Similarity-based matching and advanced entity resolution are not implemented.
- **Local API configuration:** The frontend currently uses a local backend URL; deployment requires appropriate API URL configuration and CORS settings.
- **No automated test suite:** The current assessment workflow has been checked manually; automated regression tests remain a potential improvement.

## 12. Potential Future Improvements

- Persistent storage with PostgreSQL or another suitable database.
- Pagination and scalable server-side filtering.
- More advanced duplicate matching and data validation.
- Optional company enrichment through authorized third-party APIs.
- Configurable scoring rules calibrated against actual sales outcomes.
- Authentication, role-based access control, and audit logging.
- Automated unit and integration tests.
- Production deployment with environment-based API configuration.
- Caching only where repeated, expensive operations justify it.

## 13. Privacy and Responsible Data Use

Use only prospect data that you are authorized to process. Avoid uploading sensitive personal information to a public deployment, and follow applicable privacy requirements and the terms of any data providers you use.

LeadPilot does not scrape websites or bypass access controls. Its current functionality is limited to the sample dataset and user-provided CSV files.

## 14. Project Status

LeadPilot is a working local prototype. The frontend and backend have been run locally, and the primary dashboard workflows have been manually tested.

A public demo URL is not currently provided. The repository and walkthrough video can be added to the assessment submission once they are ready.

## Author

**Tanwi Dey**
Full Stack Developer Candidate