import os
import json
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
from pathlib import Path

# --- CONFIGURATION (ปรับให้ตรงกับ db.py หรือ env ของคุณ) ---
DB_CONFIG = "postgresql://specuser:specpassword123@localhost:5432/auto_spec_db"
BACKEND_ROOT = Path(__file__).resolve().parents[2]
JSON_DIR = BACKEND_ROOT / "docs" / "json"


def migrate():
    try:
        conn = psycopg2.connect(DB_CONFIG)
        cur = conn.cursor()
        print("🚀 Connected to PostgreSQL...")

        # 1. สร้าง System User เบื้องต้นเพื่อเป็นเจ้าของ Spec (ถ้ายังไม่มี)
        system_user_id = "system-migration-user"
        cur.execute(
            """
            INSERT INTO users (id, name, email, role, "updatedAt")
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (id) DO NOTHING
        """,
            (system_user_id, "System Migrator", "system@auto-spec.local", "admin"),
        )

        # 2. อ่านไฟล์ JSON ทั้งหมด
        files = [
            f
            for f in os.listdir(JSON_DIR)
            if f.startswith("spec_") and f.endswith(".json")
        ]
        print(f"📂 Found {len(files)} spec files to migrate.")

        count = 0
        for filename in files:
            with open(os.path.join(JSON_DIR, filename), "r", encoding="utf-8") as f:
                data = json.load(f)

                # เตรียมข้อมูลให้ตรงกับ schema.prisma [cite: 5, 25, 26]
                # Mapping JSON key -> Database column
                spec_id = data.get("_filename", filename)
                val = (
                    spec_id,
                    system_user_id,
                    data.get("project_name", "Untitled Project"),
                    data.get("problem_statement", ""),
                    data.get("solution_overview", ""),
                    data.get("functional_requirements", []),
                    data.get("non_functional_requirements", []),
                    data.get("tech_stack_recommendation", []),
                    data.get("status", "Published"),
                    True,  # isPublished [cite: 5, 26]
                    data.get("_saved_at", datetime.now().isoformat()),
                    datetime.now(),  # createdAt
                    datetime.now(),  # updatedAt
                )

                cur.execute(
                    """
                    INSERT INTO project_specs (
                        id, "userId", "projectName", "problemStatement", "solutionOverview",
                        "functionalRequirements", "nonFunctionalRequirements", "techStackRecommendation",
                        status, "isPublished", "savedAt", "createdAt", "updatedAt"
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET "projectName" = EXCLUDED."projectName"
                """,
                    val,
                )
                count += 1

        conn.commit()
        print(f"✅ Migration Successful! Inserted/Updated {count} records.")

    except Exception as e:
        print(f"❌ Error during migration: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()


if __name__ == "__main__":
    migrate()
