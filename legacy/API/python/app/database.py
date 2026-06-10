from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Mirror of your Prisma SourcePaddle model
class SourcePaddle(Base):
    __tablename__ = "source_paddles"

    id = Column(Integer, primary_key=True)
    source = Column(String)
    company = Column(String)
    normalized_company = Column(String, name="normalized_company")
    paddle_name = Column(String, name="paddle_name")
    price = Column(String)
    discount_code = Column(String, name="discount_code")
    purchase_link = Column(String, name="purchase_link")
    swing_weight = Column(Float, name="swing_weight")
    twist_weight = Column(Float, name="twist_weight")
    weight = Column(Float)
    weight_grams = Column(Float, name="weight_grams")
    spin_rpm = Column(Integer, name="spin_rpm")
    serve_speed = Column(Float, name="serve_speed")
    punch_volley_speed = Column(Float, name="punch_volley_speed")
    swing_weight_percentile = Column(String, name="swing_weight_percentile")
    twist_weight_percentile = Column(String, name="twist_weight_percentile")
    power_percentile = Column(String, name="power_percentile")
    pop_percentile = Column(String, name="pop_percentile")
    spin_percentile = Column(String, name="spin_percentile")
    core_thickness = Column(Float, name="core_thickness")
    shape = Column(String)
    length = Column(Float)
    width = Column(Float)
    grip_length = Column(Float, name="grip_length")
    grip_circumference = Column(Float, name="grip_circumference")
    balance_point = Column(String, name="balance_point")
    face_material = Column(String, name="face_material")
    core_material = Column(String, name="core_material")
    surface_texture = Column(String, name="surface_texture")
    paddle_type = Column(String, name="paddle_type")
    build_type = Column(String, name="build_type")
    control_rating = Column(Integer, name="control_rating")
    feel_rating = Column(Integer, name="feel_rating")
    forgiveness_rating = Column(Integer, name="forgiveness_rating")
    power_rating = Column(String, name="power_rating")
    spin_rating = Column(String, name="spin_rating")
    touch_shots_rating = Column(Integer, name="touch_shots_rating")
    paddle_rating = Column(String, name="paddle_rating")
    release_year = Column(String, name="release_year")
    paddle_image = Column(String, name="paddle_image")
    source_data = Column(JSON, name="source_data")
    created_at = Column(DateTime, name="created_at")
    updated_at = Column(DateTime, name="updated_at")
