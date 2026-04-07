#!/usr/bin/env python3
"""
Parse InBody CSV files to JSON
Finds the latest CSV file in data/ folder and converts it to data/data.json
"""

import csv
import json
import os
from pathlib import Path


def find_latest_csv(data_dir: str = "data") -> Path | None:
    """Find the most recent CSV file in the data directory."""
    csv_files = list(Path(data_dir).glob("*.csv"))
    if not csv_files:
        return None
    # Sort by filename (assuming format: InBody-YYYYMMDD.csv)
    return max(csv_files, key=lambda f: f.name)


def parse_csv_to_json(csv_path: Path) -> dict:
    """Parse CSV file and return structured data."""
    with open(csv_path, 'r', encoding='utf-8-sig') as f:  # utf-8-sig removes BOM
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            cleaned_row = {}
            for key, value in row.items():
                if key and key.strip():
                    cleaned_key = key.strip()
                    cleaned_value = value.strip() if value else '-'
                    cleaned_row[cleaned_key] = cleaned_value
            if cleaned_row:
                rows.append(cleaned_row)

    # Sort by date (newest first)
    rows.sort(key=lambda x: x.get('ngày', ''), reverse=True)

    return {
        "source_file": csv_path.name,
        "total_records": len(rows),
        "data": rows
    }


def main():
    data_dir = "data"
    output_file = os.path.join(data_dir, "data.json")

    csv_file = find_latest_csv(data_dir)

    if not csv_file:
        print("[ERROR] No CSV file found in data/ folder")
        return

    print(f"[OK] Found CSV: {csv_file.name}")

    try:
        data = parse_csv_to_json(csv_file)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"[OK] Parsed {data['total_records']} records")
        print(f"[OK] Saved to: {output_file}")

    except Exception as e:
        print(f"[ERROR] {e}")


if __name__ == "__main__":
    main()
