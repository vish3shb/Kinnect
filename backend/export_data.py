import sqlite3
import csv
import os

db_path = 'kinnect.db'
export_dir = 'exported_data'

if not os.path.exists(export_dir):
    os.makedirs(export_dir)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    for table_name in tables:
        table_name = table_name[0]
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        # Get column names
        column_names = [description[0] for description in cursor.description]
        
        csv_file_path = os.path.join(export_dir, f"{table_name}.csv")
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(column_names)  # Write headers
            writer.writerows(rows)         # Write data
            
        print(f"Exported {len(rows)} rows to {table_name}.csv")

except Exception as e:
    print(f"Error: {e}")
finally:
    if conn:
        conn.close()
        
print(f"Data export completed! Check the '{export_dir}' folder.")
