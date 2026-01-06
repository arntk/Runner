import os
import logging
import requests
import time
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, BigInteger, Text, JSON
from ai_coach import analyze_activity
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.dialects.postgresql import insert

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback for local testing
    DATABASE_URL = "postgresql://user:password@localhost:5432/aerofit"

Base = declarative_base()

# Re-define Activity to ensure we can write to it (sharing models would be better, but keeping it simple)
class Activity(Base):
    __tablename__ = 'activities'
    activity_id = Column(BigInteger, primary_key=True)
    date = Column(DateTime, nullable=False)
    activity_type = Column(String, nullable=False) 
    avg_hr = Column(Integer)
    max_hr = Column(Integer)
    avg_speed_mps = Column(Float)
    distance_meters = Column(Float)
    duration_seconds = Column(Float)
    rpe = Column(Float, nullable=True)
    laps = Column(JSON, nullable=True) # Store array of lap objects
    ai_feedback = Column(Text, nullable=True)

class StravaAuth(Base):
    __tablename__ = 'strava_auth'
    id = Column(Integer, primary_key=True)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    expires_at = Column(BigInteger, nullable=False)
    scope = Column(String)

def init_db():
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)

def get_strava_config():
    client_id = os.getenv("STRAVA_CLIENT_ID")
    client_secret = os.getenv("STRAVA_CLIENT_SECRET")
    redirect_uri = os.getenv("STRAVA_REDIRECT_URI", "http://localhost:5001/api/auth/strava/callback")
    
    if not client_id or not client_secret:
        raise ValueError("STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set")
        
    return client_id, client_secret, redirect_uri

def get_auth_url():
    client_id, _, redirect_uri = get_strava_config()
    scope = "read,activity:read_all"
    return f"https://www.strava.com/oauth/authorize?client_id={client_id}&response_type=code&redirect_uri={redirect_uri}&approval_prompt=force&scope={scope}"

def get_activity_details(activity_id, access_token):
    """Fetch detailed activity data including splits/laps"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(
        f"https://www.strava.com/api/v3/activities/{activity_id}",
        headers=headers
    )
    if response.status_code != 200:
        logger.warning(f"Failed to fetch details for activity {activity_id}: {response.text}")
        return None
    return response.json()

def exchange_code_for_token(code):
    client_id, client_secret, _ = get_strava_config()
    
    response = requests.post(
        "https://www.strava.com/oauth/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code"
        }
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to exchange code: {response.text}")
        
    data = response.json()
    save_tokens(data)
    return data

def refresh_access_token(refresh_token):
    client_id, client_secret, _ = get_strava_config()
    
    response = requests.post(
        "https://www.strava.com/oauth/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to refresh token: {response.text}")
        
    data = response.json()
    save_tokens(data)
    return data['access_token']

def save_tokens(token_data):
    Session = init_db()
    session = Session()
    try:
        # Simple single-user storage: always update ID 1
        stmt = insert(StravaAuth).values(
            id=1,
            access_token=token_data['access_token'],
            refresh_token=token_data['refresh_token'],
            expires_at=token_data['expires_at'],
            scope=token_data.get('scope', '') # Scope might not be in refresh response
        )
        do_update_stmt = stmt.on_conflict_do_update(
            index_elements=['id'],
            set_={
                'access_token': stmt.excluded.access_token,
                'refresh_token': stmt.excluded.refresh_token,
                'expires_at': stmt.excluded.expires_at,
            }
        )
        session.execute(do_update_stmt)
        session.commit()
    except Exception as e:
        logger.error(f"Failed to save tokens: {e}")
        session.rollback()
        raise
    finally:
        session.close()

def get_valid_access_token():
    Session = init_db()
    session = Session()
    try:
        auth = session.query(StravaAuth).filter_by(id=1).first()
        if not auth:
            return None
            
        if auth.expires_at < time.time():
            logger.info("Token expired, refreshing...")
            return refresh_access_token(auth.refresh_token)
            
        return auth.access_token
    finally:
        session.close()

def fetch_strava_athlete():
    access_token = get_valid_access_token()
    if not access_token:
        raise Exception("Not authenticated with Strava")
        
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(
        "https://www.strava.com/api/v3/athlete",
        headers=headers
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to fetch athlete: {response.text}")
        
    return response.json()

def fetch_strava_activities():
    access_token = get_valid_access_token()
    if not access_token:
        raise Exception("Not authenticated with Strava")
        
    headers = {"Authorization": f"Bearer {access_token}"}
    # Fetch last 30 activities
    response = requests.get(
        "https://www.strava.com/api/v3/athlete/activities?per_page=30",
        headers=headers
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to fetch activities: {response.text}")
        
    activities = response.json()
    process_activities(activities)
    return len(activities)

def process_activities(activities):
    Session = init_db()
    session = Session()
    inserted_count = 0
    updated_count = 0
    
    try:
        for activity in activities:
            if activity['type'] != 'Run':
                continue
                
            activity_id = activity['id']
            # Strava date: "2018-02-16T14:52:54Z" -> UTC. 
            # We'll use start_date_local to match Garmin logic roughly
            start_date_local = datetime.strptime(activity['start_date_local'], "%Y-%m-%dT%H:%M:%SZ")
            
            activity_type = 'run'
            if activity.get('workout_type') == 1: # 1 is 'Race' in Strava
                activity_type = 'race'
                
            stmt = insert(Activity).values(
                activity_id=activity_id,
                date=start_date_local,
                activity_type=activity_type,
                avg_hr=activity.get('average_heartrate'),
                max_hr=activity.get('max_heartrate'),
                avg_speed_mps=activity.get('average_speed'),
                distance_meters=activity.get('distance'),
                duration_seconds=activity.get('moving_time'),
                rpe=None # Strava doesn't always provide simple RPE in list
            )
            
            do_update_stmt = stmt.on_conflict_do_update(
                index_elements=['activity_id'],
                set_={
                    'date': stmt.excluded.date,
                    'activity_type': stmt.excluded.activity_type,
                    'avg_hr': stmt.excluded.avg_hr,
                    'max_hr': stmt.excluded.max_hr,
                    'avg_speed_mps': stmt.excluded.avg_speed_mps,
                    'distance_meters': stmt.excluded.distance_meters,
                    'duration_seconds': stmt.excluded.duration_seconds
                }
            )
            
            session.execute(do_update_stmt)
            session.commit() # Commit basic info first

            # Fetch detailed splits if laps are missing or it's a new run
            # In a real system, we'd check if 'laps' column is null for this ID
            # Here we just blindly fetch details for simplicity of this task, 
            # but ideally we only do this if it's new.
            
            # Fetch details
            # Note: This increases API rate limit usage!
            try:
                details = get_activity_details(activity_id, get_valid_access_token())
                if details:
                    # Prefer splits_metric (1000m or 1mi usually) over laps (manual laps)
                    # The user prompt asked for "The Split is the Atom"
                    splits = details.get('splits_metric') or details.get('laps')
                    if splits:
                        session.query(Activity).filter_by(activity_id=activity_id).update({"laps": splits})
                        session.commit()
            except Exception as e:
                logger.error(f"Error fetching details for {activity_id}: {e}")

            # Reload activity to get updated data including laps
            existing = session.query(Activity).filter_by(activity_id=activity_id).first()
            
            # AI Analysis Trigger (Only if it's a new or updated run without feedback)
            if not existing or (existing and not existing.ai_feedback):
                 # Fetch recent history for context
                 # Fetch ONLY the laps data for history now
                 recent_activities = session.query(Activity).filter(Activity.laps.isnot(None)).order_by(Activity.date.desc()).limit(20).all()
                 
                 # Analyze
                 feedback = analyze_activity(existing, recent_activities)
                 
                 # Update DB with feedback
                 session.query(Activity).filter_by(activity_id=activity_id).update({"ai_feedback": feedback})
                 session.commit()
            
            updated_count += 1
                
        logger.info(f"Processed {len(activities)} activities.")
        
    except Exception as e:
        logger.error(f"Error processing Strava activities: {e}")
        session.rollback()
        raise
    finally:
        session.close()
