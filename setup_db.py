import os
import json
import psycopg2
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# We take the DATABASE_API connection string that user added to .env
db_url = os.environ.get("DATABASE_API")

if not db_url:
    print("Error: DATABASE_API not found in .env")
    exit(1)

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print("Connected to Supabase PostgreSQL.")

# Create table
cursor.execute("""
CREATE TABLE IF NOT EXISTS menu_items (
    item_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    base_price INTEGER,
    variants JSONB
);
""")
print("Table 'menu_items' created (or already exists).")

# Clear existing data just in case
cursor.execute("TRUNCATE TABLE menu_items;")

menu_data = [
    # Burgers
    ("zinger_burger", "Zinger Burger", "Burgers", 350, None),
    ("beef_burger", "Beef Cheese Burger", "Burgers", 450, None),
    ("tower_burger", "Tower Burger", "Burgers", 550, None),
    ("chicken_patty", "Chicken Patty Burger", "Burgers", 250, None),
    
    # Broast
    ("broast_crispy", "Crispy Broast", "Broast", None, json.dumps({"4-Piece": 450, "8-Piece": 800})),
    ("broast_spicy", "Spicy Broast", "Broast", None, json.dumps({"4-Piece": 480, "8-Piece": 850})),
    
    # Fries
    ("fries_plain", "Plain Fries", "Fries", None, json.dumps({"Regular": 120, "Large": 180})),
    ("fries_masala", "Masala Fries", "Fries", None, json.dumps({"Regular": 140, "Large": 200})),
    ("fries_loaded", "Loaded Cheese Fries", "Fries", None, json.dumps({"Regular": 300, "Large": 450})),
    
    # Drinks
    ("coke", "Coca Cola", "Drinks", None, json.dumps({"Regular 250ml": 80, "Large 500ml": 120, "1 Liter": 200})),
    ("sprite", "Sprite", "Drinks", None, json.dumps({"Regular 250ml": 80, "Large 500ml": 120, "1 Liter": 200})),
    ("fanta", "Fanta", "Drinks", None, json.dumps({"Regular 250ml": 80, "Large 500ml": 120, "1 Liter": 200})),
    
    # Pizza
    ("pizza_fajita", "Chicken Fajita Pizza", "Pizza", None, json.dumps({"Small": 400, "Medium": 800, "Large": 1200})),
    ("pizza_tikka", "Chicken Tikka Pizza", "Pizza", None, json.dumps({"Small": 400, "Medium": 800, "Large": 1200})),
    
    # Deals
    ("deal_1", "Zinger Deal (1 Zinger, 1 Reg Fries, 1 Reg Coke)", "Deals", 500, None),
    ("deal_2", "Couple Deal (2 Zingers, 1 Large Fries, 2 Reg Cokes)", "Deals", 950, None)
]

for item in menu_data:
    cursor.execute("""
        INSERT INTO menu_items (item_id, name, category, base_price, variants)
        VALUES (%s, %s, %s, %s, %s)
    """, item)

conn.commit()
cursor.close()
conn.close()

print(f"Inserted {len(menu_data)} items into the menu.")
