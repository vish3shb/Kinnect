import sqlite3
conn = sqlite3.connect('kinnect.db')
cur = conn.cursor()
cur.execute("DELETE FROM notifications WHERE type = 'new_message'")
conn.commit()
print(f"Deleted {cur.rowcount} old chat notifications")
conn.close()
