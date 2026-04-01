import os
import logging
import requests
import time
from datetime import datetime
from ai_coach import analyze_activity
from supplements import get_protein_reminder
from sqlalchemy.dialects.postgresql import insert
from models import init_db, Activity, StravaAuth

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

def exchange_code_for_token(code, user_id):
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
    save_tokens(data, user_id)
    return data

def refresh_access_token(refresh_token, user_id):
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
    save_tokens(data, user_id)
    return data['access_token']

def save_tokens(token_data, user_id):
    Session = init_db()
    session = Session()
    try:
        # Multi-user storage: filter by user_id
        stmt = insert(StravaAuth).values(
            user_id=user_id,
            access_token=token_data['access_token'],
            refresh_token=token_data['refresh_token'],
            expires_at=token_data['expires_at'],
            scope=token_data.get('scope', '')
        )
        do_update_stmt = stmt.on_conflict_do_update(
            constraint='strava_auth_pkey', # Assuming user_id is PK or has unique constraint
            set_={
                'access_token': stmt.excluded.access_token,
                'refresh_token': stmt.excluded.refresh_token,
                'expires_at': stmt.excluded.expires_at,
            }
        )
        # Wait, StravaAuth table in models.py has 'id' as primary key.
        # I should change it to user_id as PK or add unique constraint on user_id.
        # Let's check models.py again.
        
        # Actually, let's just use filter_by(user_id=user_id) for update if exists, else insert.
        auth = session.query(StravaAuth).filter_by(user_id=user_id).first()
        if auth:
            auth.access_token = token_data['access_token']
            auth.refresh_token = token_data['refresh_token']
            auth.expires_at = token_data['expires_at']
            if 'scope' in token_data:
                auth.scope = token_data['scope']
        else:
            auth = StravaAuth(
                user_id=user_id,
                access_token=token_data['access_token'],
                refresh_token=token_data['refresh_token'],
                expires_at=token_data['expires_at'],
                scope=token_data.get('scope', '')
            )
            session.add(auth)
            
        session.commit()
    except Exception as e:
        logger.error(f"Failed to save tokens: {e}")
        session.rollback()
        raise
    finally:
        session.close()

def get_valid_access_token(user_id):
    Session = init_db()
    session = Session()
    try:
        auth = session.query(StravaAuth).filter_by(user_id=user_id).first()
        if not auth:
            return None
            
        if auth.expires_at < time.time():
            logger.info("Token expired, refreshing...")
            return refresh_access_token(auth.refresh_token, user_id)
            
        return auth.access_token
    finally:
        session.close()

def fetch_strava_athlete(user_id):
    access_token = get_valid_access_token(user_id)
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

def fetch_strava_activities(user_id):
    access_token = get_valid_access_token(user_id)
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
    process_activities(activities, user_id)
    return len(activities)

def process_activities(activities, user_id):
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
                user_id=user_id,
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
                    'user_id': stmt.excluded.user_id,
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
                details = get_activity_details(activity_id, get_valid_access_token(user_id))
                if details:
                    # Prefer splits_metric (1000m or 1mi usually) over laps (manual laps)
                    # The user prompt asked for "The Split is the Atom"
                    session.query(Activity).filter_by(activity_id=activity_id, user_id=user_id).update({
                        "laps": details.get('splits_metric') or details.get('laps')
                    })
                    session.commit()
            except Exception as e:
                logger.error(f"Error fetching details for {activity_id}: {e}")

            # Reload activity to get updated data including laps
            existing = session.query(Activity).filter_by(activity_id=activity_id, user_id=user_id).first()
            
            # AI Analysis Trigger (Only if it's a new or updated run without feedback)
            if not existing or (existing and not existing.ai_feedback):
                 # Fetch recent history for context
                 # Fetch ONLY the laps data for history now
                 recent_activities = session.query(Activity).filter(
                     Activity.user_id == user_id,
                     Activity.laps.isnot(None)
                 ).order_by(Activity.date.desc()).limit(20).all()
                 
                 # Analyze
                 feedback = analyze_activity(existing, recent_activities)
                 
                 # Update DB with feedback
                 session.query(Activity).filter_by(activity_id=activity_id, user_id=user_id).update({"ai_feedback": feedback})
                 session.commit()
                 
                 # ─── Post-run protein reminder ─────────────────────────────
                 reminder = get_protein_reminder()
                 logger.info(f"Post-run protein reminder for activity {activity_id}: {reminder['label']}")
                 # Mark reminder as sent so downstream consumers can check the flag
                 session.query(Activity).filter_by(activity_id=activity_id, user_id=user_id).update({"protein_reminded": True})
                 session.commit()
            
            updated_count += 1
                
        logger.info(f"Processed {len(activities)} activities for user {user_id}.")
        
    except Exception as e:
        logger.error(f"Error processing Strava activities: {e}")
        session.rollback()
        raise
    finally:
        session.close()
