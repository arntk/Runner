from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from ingest_garmin import fetch_garmin_data
from ingest_strava import get_auth_url, exchange_code_for_token, fetch_strava_activities, fetch_strava_athlete, init_db, Activity

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/api/sync', methods=['POST'])
def sync_garmin():
    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password are required'}), 400
    
    try:
        logger.info(f"Starting sync for user: {email}")
        # Run ingestion logic
        fetch_garmin_data(email, password)
        
        # TODO: Run K-Means analysis here
        
        return jsonify({'status': 'success', 'message': 'Synced runs and updated profile'}), 200
        
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        # Check for auth error specifically if possible, but generic 401/500 for now
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
    
    if not code:
        return jsonify({'status': 'error', 'message': 'Auth code required'}), 400
        
    try:
        # Exchange code for token
        exchange_code_for_token(code)
        
        # Trigger initial sync
        # Trigger initial sync
        count = fetch_strava_activities()
        
        # Get Athlete Name
        athlete = fetch_strava_athlete()
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
    try:
        count = fetch_strava_activities()
        return jsonify({'status': 'success', 'message': f'Synced {count} activities'}), 200
    except Exception as e:
        logger.error(f"Strava sync failed: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/activity/latest', methods=['GET'])
def get_latest_activity():
    Session = init_db()
    session = Session()
    try:
        activity = session.query(Activity).filter_by(activity_type='run').order_by(Activity.date.desc()).first()
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
    Session = init_db()
    session = Session()
    try:
        activities = session.query(Activity).filter_by(activity_type='run').order_by(Activity.date.desc()).limit(10).all()
        
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



