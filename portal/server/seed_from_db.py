#!/usr/bin/env python3
"""Export/import seed data for portal.db (SQLite).

Goal:
- Backup DB content in a git-friendly way (JSON) without committing the raw .db.
- Allow regenerating an identical DB content for dev/test.

Usage:
  # export
  python3 seed_from_db.py export --db portal.db --out ../seed/portal_seed.json

  # import (will create/overwrite target db)
  python3 seed_from_db.py import --seed ../seed/portal_seed.json --db portal.db

Notes:
- This script does NOT manage schema migrations. It expects schema to exist.
- For a fully reproducible DB, pair this with your migration/schema setup.
"""

import argparse
import json
import os
import sqlite3
from datetime import datetime

DEFAULT_TABLES = [
    "guestbook_entry",
    "visitor_stats",
    "newsletter_subscriber",
    "contact_submission",
]


def connect(db_path: str) -> sqlite3.Connection:
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    return con


def export_seed(db_path: str, out_path: str, tables):
    con = connect(db_path)
    cur = con.cursor()

    data = {
        "meta": {
            "exportedAt": datetime.utcnow().isoformat() + "Z",
            "db": os.path.basename(db_path),
        },
        "tables": {},
    }

    for t in tables:
        cur.execute(f"PRAGMA table_info({t})")
        cols = [r[1] for r in cur.fetchall()]
        cur.execute(f"SELECT * FROM {t}")
        rows = [dict(r) for r in cur.fetchall()]
        data["tables"][t] = {"columns": cols, "rows": rows}

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Exported seed to {out_path}")


def import_seed(seed_path: str, db_path: str):
    with open(seed_path, "r", encoding="utf-8") as f:
        seed = json.load(f)

    con = connect(db_path)
    cur = con.cursor()

    # Insert rows table by table.
    for t, payload in seed.get("tables", {}).items():
        rows = payload.get("rows", [])
        if not rows:
            continue

        cols = list(rows[0].keys())
        placeholders = ",".join(["?"] * len(cols))
        col_list = ",".join([f"{c}" for c in cols])

        # clear existing
        cur.execute(f"DELETE FROM {t}")

        for r in rows:
            cur.execute(
                f"INSERT INTO {t} ({col_list}) VALUES ({placeholders})",
                [r.get(c) for c in cols],
            )

    con.commit()
    print(f"Imported seed into {db_path}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    ex = sub.add_parser("export")
    ex.add_argument("--db", default="portal.db")
    ex.add_argument("--out", default=os.path.join("..", "seed", "portal_seed.json"))
    ex.add_argument("--tables", nargs="*", default=DEFAULT_TABLES)

    im = sub.add_parser("import")
    im.add_argument("--seed", default=os.path.join("..", "seed", "portal_seed.json"))
    im.add_argument("--db", default="portal.db")

    args = ap.parse_args()

    if args.cmd == "export":
        export_seed(args.db, args.out, args.tables)
    else:
        import_seed(args.seed, args.db)


if __name__ == "__main__":
    main()
