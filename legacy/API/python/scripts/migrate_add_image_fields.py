#!/usr/bin/env python3
"""
Migration script to add image_url, buy_url, and price columns to existing paddles table.
Run this script if you have an existing database that needs the new columns.
"""

import psycopg2
import os
import logging
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection using environment variables or defaults."""
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "postgres")
    dbname = os.getenv("DB_NAME", "pickleball_db")
    
    conn_str = f"host={host} port={port} user={user} password={password} dbname={dbname}"
    return psycopg2.connect(conn_str)

def column_exists(cursor, table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    cursor.execute("""
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = %s
        );
    """, (table_name, column_name))
    return cursor.fetchone()[0]

def add_image_fields():
    """Add image_url, buy_url, and price columns to paddles table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check and add image_url column
        if not column_exists(cursor, 'paddles', 'image_url'):
            logger.info("Adding image_url column...")
            cursor.execute("ALTER TABLE paddles ADD COLUMN image_url TEXT;")
            logger.info("✓ Added image_url column")
        else:
            logger.info("image_url column already exists")
        
        # Check and add buy_url column
        if not column_exists(cursor, 'paddles', 'buy_url'):
            logger.info("Adding buy_url column...")
            cursor.execute("ALTER TABLE paddles ADD COLUMN buy_url TEXT;")
            logger.info("✓ Added buy_url column")
        else:
            logger.info("buy_url column already exists")
        
        # Check and add price column
        if not column_exists(cursor, 'paddles', 'price'):
            logger.info("Adding price column...")
            cursor.execute("ALTER TABLE paddles ADD COLUMN price DECIMAL(10,2);")
            logger.info("✓ Added price column")
        else:
            logger.info("price column already exists")
        
        # Commit the changes
        conn.commit()
        logger.info("Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    add_image_fields()
