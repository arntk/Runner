from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime
from ingest_garmin import fetch_garmin_data
from ingest_strava import get_auth_url, exchange_code_for_token, fetch_strava_activities, fetch_strava_athlete, init_db, Activity
from packing_list import build_packing_list
from supplements import build_timeline, get_protein_reminder
from vdot import estimate_zones

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def get_user_id():
    """Helper to extract user_id from query params or JSON body"""
    user_id = request.args.get('user_id')
    if not user_id and request.is_json:
        user_id = request.get_json().get('user_id')
    return user_id

@app.route('/api/vdot/estimate', methods=['POST'])
def vdot_estimate():
    """
    POST /api/vdot/estimate
    Body: { "distance_m": 5000, "time_min": 20.0 }
    """
    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'JSON body required'}), 400

    distance_m = float(data.get('distance_m', 0))
    time_min = float(data.get('time_min', 0))

    if distance_m <= 0 or time_min <= 0:
        return jsonify({'status': 'error', 'message': 'Positive distance and time required'}), 400

    try:
        result = estimate_zones(distance_m, time_min)
        return jsonify(result), 200
    except Exception as e:
        logger.error(f'VDOT estimation error: {e}')
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/sync', methods=['POST'])
def sync_garmin():
    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400
    
    user_id = get_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id is required'}), 400
        
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password are required'}), 400
    
    try:
        logger.info(f"Starting sync for user: {email} (UUID: {user_id})")
        # Run ingestion logic
        fetch_garmin_data(user_id, email, password)
        
        return jsonify({'status': 'success', 'message': 'Synced runs and updated profile'}), 200
        
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        if "authentication" in str(e).lower() or "login" in str(e).lower():
             return jsonify({'status': 'error', 'message': 'Authentication failed'}), 401
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/strava/url', methods=['POST', 'GET'])
def strava_auth_url():
    try:
        url = get_auth_url()
        return jsonify({'url': url}), 200
    except Exception as e:
        logger.error(f"Error getting Strava auth URL: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/strava/callback', methods=['POST'])
def strava_callback():
    data = request.get_json()
    code = data.get('code')
    user_id = get_user_id()
    
    if not code:
        return jsonify({'status': 'error', 'message': 'Auth code required'}), 400
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id required'}), 400
        
    try:
        # Exchange code for token
        exchange_code_for_token(code, user_id)
        
        # Trigger initial sync
        count = fetch_strava_activities(user_id)
        
        # Get Athlete Name
        athlete = fetch_strava_athlete(user_id)
        name = f"{athlete.get('firstname', '')} {athlete.get('lastname', '')}"
        
        return jsonify({
            'status': 'success', 
            'message': f'Authenticated and synced {count} activities for {name}',
            'user': {
                'name': name,
                'id': athlete.get('id')
            }
        }), 200
    except Exception as e:
        logger.error(f"Strava callback failed: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/sync/strava', methods=['POST'])
def sync_strava():
    user_id = get_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id required'}), 400
        
    try:
        count = fetch_strava_activities(user_id)
        return jsonify({'status': 'success', 'message': f'Synced {count} activities'}), 200
    except Exception as e:
        logger.error(f"Strava sync failed: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200


# ──────────────────────────────────────────────────────────────────────────────
# Packing List
# ──────────────────────────────────────────────────────────────────────────────

@app.route('/api/packing-list', methods=['GET'])
def packing_list():
    """
    GET /api/packing-list?user_id=<UUID>&city=Boston&distance_km=10
    """
    user_id = get_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id required'}), 400
        
    city = request.args.get('city', '')
    distance_km = float(request.args.get('distance_km', 10))
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)

    if not city and (lat is None or lon is None):
        return jsonify({'status': 'error', 'message': 'Provide city or lat+lon'}), 400

    try:
        # In the future, build_packing_list might use user_id for preferences
        result = build_packing_list(city, distance_km, lat, lon)
        return jsonify(result), 200
    except Exception as e:
        logger.error(f'Packing list error: {e}')
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# Supplement Timeline
# ──────────────────────────────────────────────────────────────────────────────

@app.route('/api/supplements/timeline', methods=['POST'])
def supplement_timeline():
    """
    POST /api/supplements/timeline
    Body: { "user_id": "<UUID>", "race_datetime": "2026-04-05T08:00:00", "distance_km": 42.2 }
    """
    user_id = get_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id required'}), 400

    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'JSON body required'}), 400

    race_dt_str = data.get('race_datetime')
    distance_km = float(data.get('distance_km', 10))

    if not race_dt_str:
        return jsonify({'status': 'error', 'message': 'race_datetime is required (ISO 8601)'}), 400

    try:
        race_dt = datetime.fromisoformat(race_dt_str)
    except ValueError:
        return jsonify({'status': 'error', 'message': 'Invalid race_datetime format. Use ISO 8601.'}), 400

    try:
        timeline = build_timeline(race_dt, distance_km)
        return jsonify({'race_datetime': race_dt_str, 'distance_km': distance_km, 'timeline': timeline}), 200
    except Exception as e:
        logger.error(f'Supplement timeline error: {e}')
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/supplements/protein-reminder', methods=['GET'])
def protein_reminder():
    """GET /api/supplements/protein-reminder — standalone post-run protein prompt."""
    user_id = get_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id required'}), 400
    return jsonify(get_protein_reminder()), 200

@app.route('/api/activity/latest', methods=['GET'])
def get_latest_activity():
    user_id = get_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id required'}), 400
        
    Session = init_db()
    session = Session()
    try:
        activity = session.query(Activity).filter_by(user_id=user_id, activity_type='run').order_by(Activity.date.desc()).first()
        if not activity:
            return jsonify({'message': 'No activities found'}), 404
            
        return jsonify({
            'date': activity.date,
            'type': activity.activity_type,
            'distance': activity.distance_meters,
            'duration': activity.duration_seconds,
            'ai_feedback': activity.ai_feedback
        }), 200
    except Exception as e:
        logger.error(f"Error fetching latest activity: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        session.close()

@app.route('/api/activities', methods=['GET'])
def get_recent_activities():
    user_id = get_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id required'}), 400
        
    Session = init_db()
    session = Session()
    try:
        activities = session.query(Activity).filter_by(user_id=user_id, activity_type='run').order_by(Activity.date.desc()).limit(10).all()
        
        result = []
        for a in activities:
            result.append({
                'id': a.activity_id,
                'date': a.date,
                'type': a.activity_type,
                'distance': a.distance_meters,
                'duration': a.duration_seconds,
                'avg_hr': a.avg_hr,
                'ai_feedback': a.ai_feedback
            })
            
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error fetching recent activities: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        session.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
