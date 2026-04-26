import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import psycopg2

DEFAULT_DB_URL = "postgresql://specuser:specpassword123@localhost:5432/auto_spec_db"
DEFAULT_JSON_DIR = Path(__file__).resolve().parents[2] / "docs" / "json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Adopt orphaned JSON specs into project_specs for a specific userId"
    )
    parser.add_argument("--user-id", required=True, help="Target userId in users table")
    parser.add_argument(
        "--db-url",
        default=os.getenv("DATABASE_URL") or DEFAULT_DB_URL,
        help="PostgreSQL connection URL (default: DATABASE_URL env or local default)",
    )
    parser.add_argument(
        "--json-dir",
        default=str(DEFAULT_JSON_DIR),
        help="Directory containing spec_*.json files",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview adoption without writing to database",
    )
    parser.add_argument(
        "--force-update-existing",
        action="store_true",
        help="Update userId for specs that already exist (default: skip existing)",
    )
    return parser.parse_args()


def to_list_of_str(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    if value is None:
        return []
    return [str(value)]


def parse_saved_at(raw_value: Any) -> datetime:
    if not raw_value:
        return datetime.now()
    if isinstance(raw_value, datetime):
        return raw_value
    if isinstance(raw_value, str):
        try:
            return datetime.fromisoformat(raw_value)
        except ValueError:
            return datetime.now()
    return datetime.now()


def main() -> None:
    args = parse_args()
    json_dir = Path(args.json_dir)

    if not json_dir.exists() or not json_dir.is_dir():
        raise SystemExit(f"JSON directory not found: {json_dir}")

    files = sorted(
        [path for path in json_dir.iterdir() if path.is_file() and path.name.startswith("spec_") and path.suffix == ".json"]
    )

    if not files:
        print(f"No spec_*.json files found in {json_dir}")
        return

    conn = psycopg2.connect(args.db_url)
    cur = conn.cursor()

    try:
        cur.execute('SELECT id FROM users WHERE id = %s', (args.user_id,))
        if not cur.fetchone():
            raise SystemExit(f"User not found in users table: {args.user_id}")

        inserted = 0
        skipped_existing = 0
        skipped_invalid = 0
        failed = 0
        updated = 0

        for file_path in files:
            try:
                with file_path.open("r", encoding="utf-8") as f:
                    data = json.load(f)

                spec_id = data.get("_filename") or file_path.name
                project_name = data.get("project_name")

                if not project_name:
                    skipped_invalid += 1
                    continue

                cur.execute('SELECT 1 FROM project_specs WHERE id = %s', (spec_id,))
                exists = cur.fetchone() is not None
                if exists and not args.force_update_existing:
                    skipped_existing += 1
                    continue

                values = (
                    spec_id,
                    args.user_id,
                    str(project_name),
                    str(data.get("problem_statement") or ""),
                    str(data.get("solution_overview") or ""),
                    to_list_of_str(data.get("functional_requirements")),
                    to_list_of_str(data.get("non_functional_requirements")),
                    to_list_of_str(data.get("tech_stack_recommendation")),
                    str(data.get("status") or "Draft"),
                    bool(data.get("isPublished", True)),
                    parse_saved_at(data.get("_saved_at")),
                )

                if not args.dry_run:
                    if exists and args.force_update_existing:
                        # Update existing spec with new userId
                        cur.execute(
                            '''
                            UPDATE project_specs SET
                                "userId" = %s,
                                "projectName" = %s,
                                "problemStatement" = %s,
                                "solutionOverview" = %s,
                                "functionalRequirements" = %s,
                                "nonFunctionalRequirements" = %s,
                                "techStackRecommendation" = %s,
                                status = %s,
                                "isPublished" = %s,
                                "savedAt" = %s,
                                "updatedAt" = NOW()
                            WHERE id = %s
                            ''',
                            (args.user_id, str(project_name), str(data.get("problem_statement") or ""),
                             str(data.get("solution_overview") or ""), to_list_of_str(data.get("functional_requirements")),
                             to_list_of_str(data.get("non_functional_requirements")), to_list_of_str(data.get("tech_stack_recommendation")),
                             str(data.get("status") or "Draft"), bool(data.get("isPublished", True)),
                             parse_saved_at(data.get("_saved_at")), spec_id)
                        )
                        updated += 1
                    else:
                        # Insert new spec
                        cur.execute(
                            '''
                            INSERT INTO project_specs (
                                id, "userId", "projectName", "problemStatement", "solutionOverview",
                                "functionalRequirements", "nonFunctionalRequirements", "techStackRecommendation",
                                status, "isPublished", "savedAt", "createdAt", "updatedAt"
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                            ''',
                            values,
                        )
                        inserted += 1
                elif exists and args.force_update_existing:
                    updated += 1
                elif not exists:
                    inserted += 1
            except Exception as item_error:
                failed += 1
                print(f"[WARN] Failed processing {file_path.name}: {item_error}")

        if args.dry_run:
            conn.rollback()
        else:
            conn.commit()

        mode = "DRY-RUN" if args.dry_run else "APPLIED"
        print("=" * 60)
        print(f"Adopt orphaned JSON specs ({mode})")
        print(f"json_dir         : {json_dir}")
        print(f"target_user_id   : {args.user_id}")
        print(f"files_total      : {len(files)}")
        print(f"inserted         : {inserted}")
        print(f"updated          : {updated}")
        print(f"skipped_existing : {skipped_existing}")
        print(f"skipped_invalid  : {skipped_invalid}")
        print(f"failed           : {failed}")
        print("=" * 60)
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
