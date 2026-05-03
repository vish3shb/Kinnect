import sqlite3
conn = sqlite3.connect('kinnect.db')
cur = conn.cursor()
cur.execute("DELETE FROM notifications")
conn.commit()
print(f"Deleted {cur.rowcount} notifications (all types)")
conn.close()
