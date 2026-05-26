# ClaimFlow — Workers' Comp Claims Automation Demo

End-to-end demo: ingest messy employer claim CSVs, clean and transform data, export a normalized file, and generate a summary report — with a React UI for live presentation.

## Project structure

```
automation-project/
├── main.py              # Pipeline logic (load → clean → calculate → export)
├── api.py               # FastAPI server for the UI
├── data/                # Sample messy input CSV
├── output/              # Generated clean CSV + report
└── frontend/            # React + Vite demo UI
```

## Run the full demo (UI + API)

**Terminal 1 — API (from project root):**

```bash
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, scroll to **Live workspace**, and click **Run pipeline**.

## CLI only

```bash
python main.py
```

Outputs: `output/clean_claims.csv`, `output/claims_summary_report.txt`
