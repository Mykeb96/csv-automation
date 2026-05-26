from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent
INPUT_CSV = PROJECT_ROOT / "data" / "raw_claims_messy.csv"


def load_claims_csv(path: Path | None = None) -> pd.DataFrame:
    """Load raw claims data from CSV."""
    csv_path = path or INPUT_CSV
    if not csv_path.exists():
        raise FileNotFoundError(f"Input file not found: {csv_path}")
    return pd.read_csv(csv_path)


def main() -> None:
    df = load_claims_csv()
    print(f"Loaded {len(df)} rows and {len(df.columns)} columns from {INPUT_CSV.name}")
    print(f"Columns: {', '.join(df.columns)}")


if __name__ == "__main__":
    main()
