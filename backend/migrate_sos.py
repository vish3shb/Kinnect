"""
Run this once to add new columns introduced in the SOS validation update.
Usage:  python migrate_sos.py
"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./kinnect.db")

async def main():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        # Users table - false alarm counter
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN sos_false_alarms INTEGER DEFAULT 0"))
            print("OK  Added users.sos_false_alarms")
        except Exception as e:
            print(f"SKIP users.sos_false_alarms: {e}")

        # Emergencies table - responder + resolution
        for col, ddl in [
            ("responder_id", "VARCHAR"),
            ("is_resolved",  "BOOLEAN DEFAULT 0"),
            ("resolution",   "VARCHAR(20)"),
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE emergencies ADD COLUMN {col} {ddl}"))
                print(f"OK  Added emergencies.{col}")
            except Exception as e:
                print(f"SKIP emergencies.{col}: {e}")

    await engine.dispose()
    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(main())

