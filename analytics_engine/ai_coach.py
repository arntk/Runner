import os
import logging
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from openai import OpenAI
from models import init_db, Profile

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize OpenAI Client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def convert_relative_to_absolute(profile):
    """
    Converts relative units (% of Max HR, % of Threshold Pace) into absolute values.
    Returns absolute hr_zones and pace_zones.
    """
    abs_hr_zones = {}
    abs_pace_zones = {}
    
    # HR Conversion
    if profile.hr_unit_pref == 'percentage' and profile.max_hr:
        for zone, val in profile.hr_zones.items():
            if isinstance(val, (int, float)):
                abs_hr_zones[zone] = int((val / 100) * profile.max_hr)
            else:
                abs_hr_zones[zone] = val
    else:
        abs_hr_zones = profile.hr_zones

    # Pace Conversion
    # Assuming relative pace is % of Threshold Pace (vDOT based or manual)
    # If pace_unit_pref is 'percentage', val is % of Threshold Speed (m/s)
    # Actually, usually pace zones are defined by ranges. 
    # Let's assume a simpler model for now: val is m/s if absolute, or % of threshold if relative.
    # We need a threshold speed. If profile has vdot, we can get it.
    threshold_speed = None
    if profile.vdot:
        from vdot import get_velocity_for_vo2
        # Threshold is ~88% of VO2max
        threshold_speed = get_velocity_for_vo2(0.88 * profile.vdot)

    if profile.pace_unit_pref == 'percentage' and threshold_speed:
        for zone, val in profile.pace_zones.items():
            if isinstance(val, (int, float)):
                speed = (val / 100) * threshold_speed
                abs_pace_zones[zone] = speed
            else:
                abs_pace_zones[zone] = val
    else:
        abs_pace_zones = profile.pace_zones
        
    return abs_hr_zones, abs_pace_zones

SYSTEM_PROMPT = """
You are an elite-level running coach specializing in the Norwegian Training Method (Double Threshold). You are coaching a sub-elite athlete.
You rely entirely on the provided K-Means clustering analysis of their recent lap data.

Core Philosophy:
- "The Split is the Atom": Analysis is based on individual splits/laps, not average activity stats.
- Double Threshold: Focus on controlled intensity (Cluster 3: Threshold) without accumulation of fatigue.
- Data Driven: Use the specific Cluster stats provided in the Context to give feedback.

Your goal:
1. Compare today's workout structure (distribution of laps across clusters) against the targets.
2. If the user ran "Threshold" intervals (Cluster 3), check if they drifted into "VO2 Max" (Cluster 4) or went too slow (Cluster 2).
3. If the user ran "Recovery" (Cluster 0), check if they ran too fast (Cluster 1 or 2).
4. Provide a prediction update if valid.

Output Format:
- Concise "Coach's Insight" (2-3 sentences).
- Specific reference to Pace/HR data from the clusters.
"""

def train_user_model(recent_history_activities):
    """
    Trains a K-Means model on the user's recent lap history to identify 5 physiological zones.
    Returns the model and the centroids (labeled).
    """
    all_laps = []
    
    # flattened extraction
    for activity in recent_history_activities:
        if not activity.laps:
            continue
            
        for lap in activity.laps:
            # Safe extraction with defaults
            avg_speed = lap.get('average_speed', 0) # m/s
            avg_hr = lap.get('average_heartrate', 0)
            distance = lap.get('distance', 0) # meters
            moving_time = lap.get('moving_time', 0) # seconds
            
            # 1. Exclusion Criteria
            # < 30 seconds duration
            if moving_time < 30:
                continue
                
            # Convert speed to min/mile for filtering check
            # m/s to min/mile: (1609.34 / speed) / 60
            if avg_speed <= 0:
                continue
            
            pace_min_mile = (1609.34 / avg_speed) / 60
            
            # < 10:00/mile (approx 6.0 min/km or 2.68 m/s check)
            # 10 min/mile = 10 * 60 = 600 seconds per mile. 
            # Speed = 1609.34 / 600 = 2.68 m/s. 
            # If pace > 10:00/mi, it means slower. So speed < 2.68 m/s.
            if pace_min_mile > 10.0:
                 continue
                 
            all_laps.append({
                'speed': avg_speed,
                'hr': avg_hr,
                'pace_min_mile': pace_min_mile
            })
            
    if len(all_laps) < 10:
        logger.warning(f"Not enough clean laps to train model. Found {len(all_laps)}.")
        return None, None

    df = pd.DataFrame(all_laps)
    
    # Features for clustering: Pace (speed) and HR. 
    # Use HR and Speed. 
    X = df[['speed', 'hr']].copy() # Using speed (m/s) ensures linear relationships better than pace sometimes, but pace is fine too.
    
    # Handle missing HR (fill with mean? or drop?)
    if X['hr'].isnull().any():
        X = X.dropna()

    if len(X) < 5:
        return None, None

    # K-Means = 5
    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    kmeans.fit(X)
    
    # Labeling Logic (Map centroids to 0-4 based on Speed logic)
    # Cluster 0: Slowest -> Cluster 4: Fastest
    centroids = kmeans.cluster_centers_
    labels_map = {} # cluster_index -> meaning
    
    # Create simple structure to sort
    # centroid = [speed, hr]
    # We sort by speed (index 0) ascending? No, speed m/s ascending is Slow to Fast.
    
    sorted_indices = np.argsort(centroids[:, 0]) # Indices of centroids sorted by speed (low to high)
    
    # Map sorted indices to specific zones
    # index 0 (slowest) -> Cluster 0 (Recovery)
    # index 1 -> Cluster 1 (Aerobic Base)
    # index 2 -> Cluster 2 (Grey Zone)
    # index 3 -> Cluster 3 (Threshold)
    # index 4 (fastest) -> Cluster 4 (VO2 Max)
    
    zone_names = ["Recovery", "Aerobic Base", "Grey Zone", "Threshold", "VO2 Max"]
    labeled_centroids = {}
    
    for rank, cluster_idx in enumerate(sorted_indices):
        name = zone_names[rank]
        c_speed = centroids[cluster_idx][0]
        c_hr = centroids[cluster_idx][1]
        
        # Convert speed to min/mile for readable display
        c_pace = (1609.34 / c_speed) / 60
        minutes = int(c_pace)
        seconds = int((c_pace - minutes) * 60)
        pace_str = f"{minutes}:{seconds:02d}"
        
        labeled_centroids[cluster_idx] = {
            "name": name,
            "speed_mps": c_speed,
            "hr": c_hr,
            "pace": pace_str
        }

    return kmeans, labeled_centroids

def analyze_activity(activity, recent_history_activities):
    """
    Analyzes current activity laps against historical K-Means model and user profile.
    """
    Session = init_db()
    session = Session()
    try:
        # 1. Fetch User Profile
        profile = session.query(Profile).filter_by(user_id=activity.user_id).first()
        abs_hr_zones = {}
        abs_pace_zones = {}
        if profile:
            abs_hr_zones, abs_pace_zones = convert_relative_to_absolute(profile)
            
        # 2. Train Model (on history)
        kmeans_model, labeled_centroids = train_user_model(recent_history_activities)
        
        # If no model (not enough data), fallback to basic
        if not kmeans_model:
            return "Not enough history to generate K-Means analysis. Keep running!"

        # 3. Analyze Current Laps
        current_laps_splits = activity.laps
        if not current_laps_splits:
             # If no detailed laps yet, maybe return basic message
             return "No detailed lap data available for this run."

        # Parse current laps for prediction
        lap_data = []
        valid_laps = []
        
        for lap in current_laps_splits:
            speed = lap.get('average_speed', 0)
            hr = lap.get('average_heartrate', 0)
            # Apply same exclusion for noise
            if speed > 0 and lap.get('moving_time', 0) > 30:
                 lap_df = pd.DataFrame([[speed, hr]], columns=['speed', 'hr'])
                 # Predict cluster
                 try:
                    cluster_id = kmeans_model.predict(lap_df)[0]
                    valid_laps.append({
                        "cluster": cluster_id, 
                        "cluster_name": labeled_centroids[cluster_id]['name'],
                        "speed": speed,
                        "hr": hr,
                        "distance": lap.get('distance', 0)
                    })
                 except:
                    pass

        # 4. Generate Race Prediction from Threshold Centroid (Cluster 3 logic)
        # Find which centroid is "Threshold"
        threshold_stats = None
        for cid, stats in labeled_centroids.items():
            if stats['name'] == 'Threshold':
                threshold_stats = stats
                break
        
        race_pred_msg = ""
        if threshold_stats:
            # Prediction: Threshold Pace + 5-10s (approx 0.16 to 0.33 min/mile slower)
            # Calculate pace from speed
            t_pace_dec = (1609.34 / threshold_stats['speed_mps']) / 60 
            hm_pace_dec = t_pace_dec + (8/60) # adding ~8 seconds decay
            
            hm_mins = int(hm_pace_dec)
            hm_secs = int((hm_pace_dec - hm_mins) * 60)
            
            # Total time (13.1 miles)
            total_min = hm_pace_dec * 13.1
            total_h = int(total_min // 60)
            total_m = int(total_min % 60)
            
            race_pred_msg = f"Predicted HM: {total_h}h {total_m}m @ {hm_mins}:{hm_secs:02d}/mi (Based on Threshold Analysis)."

        # 5. Construct Prompt
        # Summarize established zones
        zones_summary = "ESTABLISHED ZONES (K-Means Centroids):\n"
        for cid, info in labeled_centroids.items():
            zones_summary += f"- {info['name']}: {info['pace']}/mi, {int(info['hr'])} bpm\n"
            
        # Summarize Today's Performance
        today_summary = "TODAY'S LAPS CLUSTERING:\n"
        from collections import Counter
        cluster_counts = Counter([l['cluster_name'] for l in valid_laps])
        
        for name, count in cluster_counts.items():
            # Get avg pace/hr for these laps
            laps_in_cluster = [l for l in valid_laps if l['cluster_name'] == name]
            avg_speed_c = np.mean([l['speed'] for l in laps_in_cluster])
            avg_hr_c = np.mean([l['hr'] for l in laps_in_cluster])
            
            c_pace = (1609.34 / avg_speed_c) / 60
            c_m = int(c_pace)
            c_s = int((c_pace - c_m) * 60)
            
            today_summary += f"- {count} laps in {name}: Avg {c_m}:{c_s:02d}/mi, {int(avg_hr_c)} bpm\n"

        # User profile constraints
        profile_summary = ""
        if profile:
            profile_summary = "USER PROFILE CONSTRAINTS (Reference):\n"
            if abs_hr_zones:
                profile_summary += f"Manual HR Zones: {abs_hr_zones}\n"
            if abs_pace_zones:
                # Need readable pace for profile too?
                from vdot import pace_to_min_km
                readable_paces = {z: pace_to_min_km(s) for z, s in abs_pace_zones.items() if isinstance(s, (int, float))}
                profile_summary += f"Manual Pace Zones (min/km): {readable_paces}\n"

        user_prompt = f"""
        Analyze this workout based on the K-Means analysis and user profile.
        
        {zones_summary}
        
        {today_summary}
        
        {profile_summary}
        
        {race_pred_msg}
        
        The user titled this run: "{activity.activity_type}" (Date: {activity.date})
        Discrepancy Check:
        - Did they run Recovery laps too fast?
        - Did their Threshold laps align with the established Threshold centroid?
        """

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        feedback = response.choices[0].message.content.strip()
        
        # Append race prediction to feedback if relevant
        if race_pred_msg:
             feedback += f"\n\n{race_pred_msg}"
             
        logger.info(f"Generated AI Feedback: {feedback}")
        return feedback

    except Exception as e:
        logger.error(f"Error generating AI feedback: {e}")
        return f"Error analyzing data: {str(e)}"
    finally:
        session.close()
