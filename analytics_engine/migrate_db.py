import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/aerofit")

def migrate_db():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Check if column exists
            conn.execute(text("SELECT ai_feedback FROM activities LIMIT 1"))
            print("Column 'ai_feedback' already exists.")
        except Exception:
            print("Adding 'ai_feedback' column...")
            conn.rollback() # Clear error
            try:
                conn.execute(text("ALTER TABLE activities ADD COLUMN ai_feedback TEXT"))
                conn.commit()
                print("Column added successfully.")
            except Exception as e:
                print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate_db()
