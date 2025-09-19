import sqlite3

DATABASE_URL = "./coffee.db"

def get_db_connection():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables(conn):
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coffees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            votes INTEGER DEFAULT 0
        )
    """)
    conn.commit()

def seed_database(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM coffees")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO coffees (name, description, image_url, votes) VALUES (?, ?, ?, ?)
        """, ("Espresso", "A strong, concentrated coffee beverage.", "/static/espresso.jpg", 0))
        conn.commit()

def get_all_coffees(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, description, image_url, votes FROM coffees")
    coffees = cursor.fetchall()
    return [dict(coffee) for coffee in coffees]

def increment_coffee_vote(conn, coffee_id):
    cursor = conn.cursor()
    cursor.execute("UPDATE coffees SET votes = votes + 1 WHERE id = ?", (coffee_id,))
    conn.commit()
    return cursor.rowcount > 0

def add_coffee(conn, name, description, image_url):
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO coffees (name, description, image_url) VALUES (?, ?, ?)
    """, (name, description, image_url))
    conn.commit()
    return cursor.lastrowid

def delete_coffee(conn, coffee_id):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM coffees WHERE id = ?", (coffee_id,))
    conn.commit()
    return cursor.rowcount > 0

def update_coffee(conn, coffee_id, name, description, image_url):
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE coffees
        SET name = ?,
            description = ?,
            image_url = ?
        WHERE id = ?
    """, (name, description, image_url, coffee_id))
    conn.commit()
    return cursor.rowcount > 0
