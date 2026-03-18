import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

# Read from .env
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "quantum")

async def create_database():
    print("Checking database existence...")
    # Connect to 'postgres' database to create new db
    # Using 'template1' or 'postgres' is standard
    try:
        sys_conn = await asyncpg.connect(
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_SERVER,
            port=POSTGRES_PORT,
            database="postgres"
        )
    except Exception as e:
        print(f"Failed to connect to postgres server: {e}")
        return

    try:
        # Check if database exists
        exists = await sys_conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", POSTGRES_DB
        )
        if not exists:
            print(f"Database '{POSTGRES_DB}' does not exist. Creating...")
            await sys_conn.execute(f'CREATE DATABASE "{POSTGRES_DB}"')
            print(f"Database '{POSTGRES_DB}' created successfully.")
        else:
            print(f"Database '{POSTGRES_DB}' already exists.")
    except Exception as e:
        print(f"Error checking/creating database: {e}")
    finally:
        await sys_conn.close()

async def run_schema():
    print(f"Connecting to '{POSTGRES_DB}' to run schema...")
    try:
        conn = await asyncpg.connect(
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_SERVER,
            port=POSTGRES_PORT,
            database=POSTGRES_DB
        )
    except Exception as e:
        print(f"Failed to connect to database '{POSTGRES_DB}': {e}")
        return

    schema_path = os.path.join(os.path.dirname(__file__), "..", "schema.sql")
    if not os.path.exists(schema_path):
        print("schema.sql not found at", schema_path)
        await conn.close()
        return

    print("Reading schema.sql...")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    print("Executing schema...")
    try:
        # asyncpg execute can handle multiple statements if separated by semicolons, 
        # but sometimes requires distinct execute calls if statements are complex.
        # However, for a schema file it usually works.
        await conn.execute(schema_sql)
        print("Schema executed successfully.")
    except Exception as e:
        print(f"Error executing schema: {e}")
    finally:
        await conn.close()

async def main():
    await create_database()
    await run_schema()

if __name__ == "__main__":
    asyncio.run(main())
