import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'kinnect.db')
if not os.path.exists(db_path):
    # Depending on where they run the backend, kinnect.db could be in backend/ or backend/src/
    db_path = 'kinnect.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Check if reports column exists
    cursor.execute("PRAGMA table_info(activities)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'reports' not in columns:
        cursor.execute("ALTER TABLE activities ADD COLUMN reports INTEGER DEFAULT 0")
        conn.commit()
        print("Successfully added 'reports' column to activities table.")
    else:
        print("'reports' column already exists.")
    try:
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'banned_until' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN banned_until DATETIME")
            conn.commit()
            print("Successfully added 'banned_until' column to users table.")
        else:
            print("'banned_until' column already exists.")
    except Exception as e:
        print(f"Error checking users: {e}")

    # Create notifications table if it doesn't exist
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                activity_id TEXT REFERENCES activities(id),
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        print("Notifications table created (or already exists).")
    except Exception as e:
        print(f"Error creating notifications table: {e}")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
