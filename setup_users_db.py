import os
import psycopg2
from dotenv import load_dotenv

# Load env variables
load_dotenv()

db_url = os.environ.get("DATABASE_API")
if not db_url:
    print("Error: DATABASE_API not found in .env")
    exit(1)

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print("Connected to Supabase PostgreSQL.")

# Create table
cursor.execute("""
CREATE TABLE IF NOT EXISTS customers (
    phone_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    delivery_number VARCHAR(50),
    address TEXT,
    last_order JSONB
);
""")
print("Table 'customers' created (or already exists).")

conn.commit()
cursor.close()
conn.close()

print("Customer Database setup complete.")
