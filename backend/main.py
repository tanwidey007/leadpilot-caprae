from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import csv, io, re
from typing import Any

app = FastAPI(title="LeadPilot API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE = [
    {"company":"Northstar Dental Group","name":"Maya Chen","email":"maya@northstardental.example","phone":"+1-555-0101","industry":"Healthcare","location":"Austin, TX","employees":"85","revenue":"12000000"},
    {"company":"BrightPath Logistics","name":"Daniel Reed","email":"daniel@brightpath.example","phone":"","industry":"Logistics","location":"Dallas, TX","employees":"240","revenue":"42000000"},
    {"company":"Cedar & Stone Foods","name":"Ava Patel","email":"","phone":"+1-555-0103","industry":"Food & Beverage","location":"Denver, CO","employees":"45","revenue":""},
    {"company":"Orbit Learning Systems","name":"Noah Brooks","email":"noah@orbitlearning.example","phone":"+1-555-0104","industry":"Education Technology","location":"Boston, MA","employees":"120","revenue":"18000000"},
    {"company":"Northstar Dental Group","name":"Maya Chen","email":"maya@northstardental.example","phone":"+1-555-0101","industry":"Healthcare","location":"Austin, TX","employees":"85","revenue":"12000000"},
    {"company":"Greenline Facility Services","name":"Sophia Kim","email":"sophia@greenline.example","phone":"","industry":"","location":"Phoenix, AZ","employees":"60","revenue":"8000000"},
    {"company":"Apex Components","name":"Liam Wilson","email":"liam@apexcomponents.example","phone":"+1-555-0107","industry":"Manufacturing","location":"","employees":"310","revenue":"67000000"},
    {"company":"Bluebird Home Care","name":"Olivia Garcia","email":"olivia@bluebirdcare.example","phone":"+1-555-0108","industry":"Healthcare","location":"Tampa, FL","employees":"","revenue":"9500000"},
]

ALIASES = {
    "company": ["company", "company_name", "organization", "business"],
    "name": ["name", "contact", "contact_name", "full_name", "person"],
    "email": ["email", "email_address", "work_email"],
    "phone": ["phone", "phone_number", "telephone"],
    "industry": ["industry", "sector"],
    "location": ["location", "city", "address", "region"],
    "employees": ["employees", "employee_count", "headcount", "company_size"],
    "revenue": ["revenue", "annual_revenue", "estimated_revenue"],
}

def clean_row(raw: dict[str, Any]) -> dict[str, str]:
    normalized = {re.sub(r"[^a-z0-9]+", "_", str(k).strip().lower()).strip("_"): ("" if v is None else str(v).strip()) for k, v in raw.items()}
    out = {}
    for target, names in ALIASES.items():
        out[target] = next((normalized[n] for n in names if normalized.get(n)), "")
    # Keep other useful source fields so exports don't silently discard them.
    for k, v in normalized.items():
        if k and k not in out and k not in [a for vals in ALIASES.values() for a in vals]:
            out[k] = v
    return out

def score(row: dict[str, str]) -> int:
    points = [
        (bool(row.get("email")), 25),
        (bool(row.get("phone")), 10),
        (bool(row.get("industry")), 20),
        (bool(row.get("location")), 15),
        (bool(row.get("employees")), 15),
        (bool(row.get("revenue")), 15),
    ]
    return sum(value for present, value in points if present)

def process(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    result = []
    for i, raw in enumerate(rows):
        row = clean_row(raw)
        company = row.get("company", "").strip().lower()
        email = row.get("email", "").strip().lower()
        key = (company, email) if company or email else ("row", str(i))
        duplicate = key in seen
        seen.add(key)
        missing = [field for field in ["company", "email", "industry", "location"] if not row.get(field)]
        points = score(row)
        row.update({
            "id": i + 1,
            "score": points,
            "priority": "High" if points >= 80 else ("Medium" if points >= 55 else "Low"),
            "duplicate": duplicate,
            "missing": missing,
        })
        result.append(row)
    return result

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/leads")
def get_sample_leads():
    return {"leads": process(SAMPLE), "source": "sample"}

@app.post("/api/leads/upload")
async def upload_leads(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")
    try:
        raw = await file.read()
        text = raw.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            raise ValueError("CSV must include a header row.")
        rows = list(reader)
        if not rows:
            raise ValueError("CSV contains headers but no data rows.")
        if len(rows) > 5000:
            raise ValueError("Please upload 5,000 rows or fewer for this demo.")
        return {"leads": process(rows), "source": file.filename}
    except (UnicodeDecodeError, csv.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
