import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, BigInteger, Text, JSON, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()

class Activity(Base):
    __tablename__ = 'activities'
    activity_id = Column(BigInteger, primary_key=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    date = Column(DateTime, nullable=False)
    activity_type = Column(String, nullable=False) 
    avg_hr = Column(Integer)
    max_hr = Column(Integer)
    avg_speed_mps = Column(Float)
    distance_meters = Column(Float)
    duration_seconds = Column(Float)
    rpe = Column(Float, nullable=True)
    laps = Column(JSON, nullable=True) 
    ai_feedback = Column(Text, nullable=True)
    protein_reminded = Column(Boolean, default=False)

class StravaAuth(Base):
    __tablename__ = 'strava_auth'
    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    expires_at = Column(BigInteger, nullable=False)
    scope = Column(String)

class Profile(Base):
    __tablename__ = 'profiles'
    user_id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255))
    max_hr = Column(Integer)
    resting_hr = Column(Integer)
    hr_zones = Column(JSON, default={})
    pace_zones = Column(JSON, default={})
    vdot = Column(Float)
    hr_unit_pref = Column(String(10), default='absolute')
    pace_unit_pref = Column(String(10), default='absolute')

def init_db():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        # Fallback for local testing
        DATABASE_URL = "postgresql://user:password@localhost:5432/aerofit"
    
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)
