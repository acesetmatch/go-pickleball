import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def run_migrations():
    here = os.path.dirname(__file__)
    with engine.begin() as conn:
        for f in ["migrations/000_init.sql", "migrations/001_indexes.sql"]:
            with open(os.path.join(here, f), "r") as sql:
                conn.execute(text(sql.read()))
