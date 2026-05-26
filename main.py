from datetime import datetime
from pathlib import Path
import re

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent
INPUT_CSV = PROJECT_ROOT / "data" / "raw_claims_messy.csv"
OUTPUT_DIR = PROJECT_ROOT / "output"
OUTPUT_CSV = OUTPUT_DIR / "clean_claims.csv"
OUTPUT_REPORT = OUTPUT_DIR / "claims_summary_report.txt"
LATE_REPORT_THRESHOLD_DAYS = 7

VALID_CLAIM_ID = re.compile(r"^CLM-\d{4}-\d{3}$")

STATE_MAP = {
    "ca": "CA",
    "california": "CA",
    "ny": "NY",
    "new york": "NY",
    "tx": "TX",
    "texas": "TX",
    "ia": "IA",
    "iowa": "IA",
    "nj": "NJ",
    "new jersey": "NJ",
}

STATUS_MAP = {
    "open": "Open",
    "closed": "Closed",
    "pending": "Pending",
    "pending review": "Pending Review",
    "reopened": "Reopened",
    "denied": "Denied",
    "invalid": "Invalid",
}

CURRENCY_COLUMNS = ("medical_cost", "indemnity_cost", "total_paid")
TEXT_COLUMNS = (
    "claim_id",
    "employee_id",
    "employee_name",
    "employer_name",
    "body_part",
    "injury_type",
    "claim_status",
    "state",
    "adjuster",
    "notes",
)
DATE_COLUMNS = ("injury_date", "report_date")


def load_claims_csv(path: Path | None = None) -> pd.DataFrame:
    """Load raw claims data from CSV."""
    csv_path = path or INPUT_CSV
    if not csv_path.exists():
        raise FileNotFoundError(f"Input file not found: {csv_path}")
    return pd.read_csv(csv_path)


def _parse_currency(value) -> float | None:
    if pd.isna(value):
        return None
    text = str(value).strip()
    if text in {"", "-", "N/A", "n/a", "???"}:
        return None
    cleaned = text.replace("$", "").replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _normalize_state(value) -> str | None:
    if pd.isna(value):
        return None
    key = str(value).strip().lower()
    return STATE_MAP.get(key, str(value).strip().upper()[:2] if len(key) == 2 else None)


def _normalize_status(value) -> str | None:
    if pd.isna(value):
        return None
    key = str(value).strip().lower()
    return STATUS_MAP.get(key, str(value).strip().title())


def clean_claims_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and standardize raw claims data."""
    cleaned = df.copy()

    for col in TEXT_COLUMNS:
        if col in cleaned.columns:
            cleaned[col] = cleaned[col].astype("string").str.strip()
            cleaned[col] = cleaned[col].replace("", pd.NA)

    cleaned["employee_name"] = cleaned["employee_name"].str.title()
    cleaned["body_part"] = cleaned["body_part"].str.title()
    cleaned["injury_type"] = cleaned["injury_type"].str.title()
    cleaned["adjuster"] = cleaned["adjuster"].str.title()

    cleaned["state"] = cleaned["state"].apply(_normalize_state)
    cleaned["claim_status"] = cleaned["claim_status"].apply(_normalize_status)

    for col in DATE_COLUMNS:
        cleaned[col] = pd.to_datetime(cleaned[col], errors="coerce", format="mixed")

    for col in CURRENCY_COLUMNS:
        cleaned[col] = cleaned[col].apply(_parse_currency)

    cleaned["days_lost"] = pd.to_numeric(cleaned["days_lost"], errors="coerce")
    cleaned.loc[cleaned["days_lost"] < 0, "days_lost"] = pd.NA

    valid_claim_mask = cleaned["claim_id"].str.match(VALID_CLAIM_ID, na=False)
    cleaned = cleaned.loc[valid_claim_mask]

    cleaned = cleaned.drop_duplicates(subset=["claim_id"], keep="first")

    return cleaned.reset_index(drop=True)


def add_calculated_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Add derived columns for analysis."""
    result = df.copy()
    result["days_to_report"] = (result["report_date"] - result["injury_date"]).dt.days
    return result


def export_clean_csv(df: pd.DataFrame, path: Path | None = None) -> Path:
    """Save cleaned claims data to CSV."""
    output_path = path or OUTPUT_CSV
    output_path.parent.mkdir(parents=True, exist_ok=True)

    export_df = df.copy()
    for col in DATE_COLUMNS:
        if col in export_df.columns:
            export_df[col] = pd.to_datetime(export_df[col]).dt.strftime("%Y-%m-%d")

    export_df.to_csv(output_path, index=False)
    return output_path


def _format_currency(amount: float) -> str:
    return f"${amount:,.2f}"


def _append_count_section(lines: list[str], title: str, counts: pd.Series) -> None:
    lines.append(title)
    lines.append("-" * len(title))
    for label, count in counts.items():
        lines.append(f"  {label}: {count}")
    lines.append("")


def generate_summary_report(df: pd.DataFrame) -> str:
    """Build a text summary report from cleaned claims data."""
    lines: list[str] = []
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    lines.append("WORKERS' COMPENSATION CLAIMS SUMMARY REPORT")
    lines.append("=" * 48)
    lines.append(f"Generated: {generated_at}")
    lines.append("")

    lines.append("OVERVIEW")
    lines.append("-" * 8)
    lines.append(f"Total claims: {len(df)}")
    injury_min, injury_max = df["injury_date"].min(), df["injury_date"].max()
    if pd.notna(injury_min) and pd.notna(injury_max):
        lines.append(
            f"Injury date range: {injury_min.date()} to {injury_max.date()}"
        )
    lines.append(f"Total days lost (all claims): {df['days_lost'].fillna(0).sum():,.0f}")
    lines.append("")

    lines.append("FINANCIAL SUMMARY")
    lines.append("-" * 18)
    lines.append(f"Total medical costs:   {_format_currency(df['medical_cost'].fillna(0).sum())}")
    lines.append(f"Total indemnity costs: {_format_currency(df['indemnity_cost'].fillna(0).sum())}")
    lines.append(f"Total paid:            {_format_currency(df['total_paid'].fillna(0).sum())}")
    lines.append(f"Average paid per claim: {_format_currency(df['total_paid'].fillna(0).mean())}")
    lines.append("")

    _append_count_section(
        lines, "CLAIMS BY STATUS", df["claim_status"].value_counts(dropna=False)
    )
    _append_count_section(lines, "CLAIMS BY STATE", df["state"].value_counts(dropna=False))

    lines.append("TOP EMPLOYERS BY CLAIM COUNT")
    lines.append("-" * 32)
    for employer, count in df["employer_name"].value_counts().head(5).items():
        lines.append(f"  {employer}: {count}")
    lines.append("")

    lines.append("TOP INJURY TYPES")
    lines.append("-" * 17)
    for injury_type, count in df["injury_type"].value_counts().head(5).items():
        lines.append(f"  {injury_type}: {count}")
    lines.append("")

    avg_days_to_report = df["days_to_report"].mean()
    late_reports = (df["days_to_report"] > LATE_REPORT_THRESHOLD_DAYS).sum()
    lines.append("REPORTING TIMELINESS")
    lines.append("-" * 21)
    if pd.notna(avg_days_to_report):
        lines.append(f"Average days to report: {avg_days_to_report:.1f}")
    else:
        lines.append("Average days to report: N/A")
    lines.append(
        f"Claims reported after {LATE_REPORT_THRESHOLD_DAYS} days: {late_reports}"
    )
    lines.append("")

    open_claims = df[df["claim_status"] == "Open"]
    lines.append("OPEN CLAIMS SNAPSHOT")
    lines.append("-" * 22)
    lines.append(f"Open claims: {len(open_claims)}")
    lines.append(
        f"Open claims total paid: {_format_currency(open_claims['total_paid'].fillna(0).sum())}"
    )

    return "\n".join(lines)


def export_summary_report(df: pd.DataFrame, path: Path | None = None) -> Path:
    """Generate and save the summary report."""
    output_path = path or OUTPUT_REPORT
    output_path.parent.mkdir(parents=True, exist_ok=True)
    report = generate_summary_report(df)
    output_path.write_text(report, encoding="utf-8")
    return output_path


def main() -> None:
    raw_df = load_claims_csv()
    print(f"Loaded {len(raw_df)} rows from {INPUT_CSV.name}")

    clean_df = clean_claims_data(raw_df)
    removed = len(raw_df) - len(clean_df)
    print(f"Cleaned to {len(clean_df)} rows ({removed} rows removed)")

    final_df = add_calculated_columns(clean_df)
    print(f"Added calculated column: days_to_report")

    csv_path = export_clean_csv(final_df)
    print(f"Saved clean CSV to {csv_path} ({len(final_df)} rows)")

    report_path = export_summary_report(final_df)
    print(f"Saved summary report to {report_path}")


if __name__ == "__main__":
    main()
