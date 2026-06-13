# MoneyMirror — Personal Finance & Spending Analytics

Academic demo project built for ICAI course submission.

---

## Quick Start (run locally)

### 1. Generate sample data
```bash
python3 scripts/generate_sample_data.py
```
Creates `backend/data/sample_transactions.csv` with 1,500 realistic Indian transactions.

### 2. Start the backend API
```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```
API runs at http://localhost:8000  
Interactive docs at http://localhost:8000/docs

### 3. Start the frontend
```bash
cd frontend
npm install     # first time only
npm run dev
```
App opens at http://localhost:5173

---

## Demo Walkthrough

1. Open http://localhost:5173 → click **Sign up** (use any email)
2. On the Dashboard, click **"Load Sample Data"** — this seeds 1,500 transactions
3. Use the month selector to browse Jan–Jun 2025 data
4. Click **Transactions** to see/filter all records
5. Click **Analytics** for health score, UPI behaviour, 50-30-20 budget
6. Click **AI Advisor** for rule-based (or AI) financial insights
7. Click **Upload Data** to try uploading your own CSV

---

## Project Structure

```
Money Mirror/
├── scripts/
│   └── generate_sample_data.py   # Phase 0: sample data
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── models/               # SQLAlchemy DB models
│   │   ├── routers/              # API endpoints
│   │   ├── services/             # Categorization engine
│   │   └── core/                 # Config, DB, security
│   ├── data/                     # SQLite DB + sample CSV
│   ├── requirements.txt
│   └── .env                      # Environment variables
└── frontend/
    └── src/
        ├── pages/                # React page components
        ├── components/           # Shared UI components
        ├── hooks/                # Auth context
        └── utils/                # API client, formatters
```

---

## Features Built (Phases 0–4)

| Feature | Status |
|---|---|
| Sample data generator (1,500 Indian transactions) | ✅ Phase 0 |
| FastAPI backend + SQLite + JWT auth | ✅ Phase 1 |
| User profile (name, income, city, goal) | ✅ Phase 1 |
| CSV / Excel upload + categorization | ✅ Phase 2 |
| Rules engine (80+ merchants, 19 categories) | ✅ Phase 2 |
| AI categorization fallback (OpenAI-compatible) | ✅ Phase 2 |
| Dashboard: KPI cards, pie chart, bar chart, trend line | ✅ Phase 3 |
| Transactions table with filters | ✅ Phase 3 |
| UPI behavioural analytics | ✅ Phase 4 |
| Financial Health Score (weighted, 5 factors) | ✅ Phase 4 |
| 50-30-20 budget view with green/red indicators | ✅ Phase 4 |
| Money leakage detection + annual savings estimate | ✅ Phase 4 |
| AI Advisor (rule-based + OpenAI fallback) | ✅ Phase 5 |

---

## Environment Variables (`backend/.env`)

```
SECRET_KEY=your-random-secret
OPENAI_API_KEY=          # optional — app works without it
OPENAI_MODEL=gpt-4o-mini
```

---

## Deferred to Future Work

Per original spec:
- PDF bank statement parsing (formats vary per bank)
- Google SSO login
- WhatsApp / push alerts
- Multi-language support (Hindi, Tamil, etc.)
- Account Aggregator (AA) integration
- Mutual fund / credit score tracking module
- Admin dashboard
- Multi-user scaling beyond single-demo deployment
- PDF report download (in progress — Phase 5)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS v4 + Recharts |
| Backend | Python FastAPI + SQLAlchemy |
| Database | SQLite (dev) |
| Auth | JWT (email + password) |
| Charts | Recharts |
| AI | OpenAI-compatible API (optional) |
