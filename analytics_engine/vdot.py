import math

def calculate_vdot(distance_m, time_min):
    """
    Calculate VDOT based on race performance.
    distance_m: distance in meters
    time_min: time in minutes
    """
    velocity = distance_m / time_min
    
    # VO2 of the performance
    vo2 = -4.60 + 0.182258 * velocity + 0.000104 * velocity**2
    
    # % of VO2max at which the performance was held (f_t)
    f_t = 0.8 + 0.189439 * math.exp(-0.012778 * time_min) + 0.298955 * math.exp(-0.193260 * time_min)
    
    vdot = vo2 / f_t
    return vdot

def get_velocity_for_vo2(target_vo2):
    """
    Find velocity (m/min) for a given VO2 (ml/kg/min)
    Using quadratic formula: 0.000104*V^2 + 0.182258*V - (4.60 + target_vo2) = 0
    """
    a = 0.000104
    b = 0.182258
    c = -(4.60 + target_vo2)
    
    # V = (-b + sqrt(b^2 - 4ac)) / 2a
    velocity = (-b + math.sqrt(b**2 - 4 * a * c)) / (2 * a)
    return velocity

def pace_to_min_km(velocity_m_min):
    """Convert velocity (m/min) to pace (min/km)"""
    if velocity_m_min <= 0:
        return "00:00"
    pace_min = 1000 / velocity_m_min
    minutes = int(pace_min)
    seconds = int((pace_min - minutes) * 60)
    return f"{minutes}:{seconds:02d}"

def estimate_zones(race_distance_m, race_time_min):
    """
    Estimate 5 pace zones based on VDOT.
    Zones mapping:
    1. Recovery: 60% VO2max
    2. Aerobic Base: 70% VO2max
    3. Grey Zone: 80% VO2max
    4. Threshold: 88% VO2max
    5. VO2 Max: 98% VO2max
    """
    if race_distance_m <= 0 or race_time_min <= 0:
        raise ValueError("Distance and time must be positive")
        
    vdot = calculate_vdot(race_distance_m, race_time_min)
    
    percentages = {
        "Recovery": 0.60,
        "Aerobic Base": 0.70,
        "Grey Zone": 0.80,
        "Threshold": 0.88,
        "VO2 Max": 0.98
    }
    
    zones = {}
    for name, pct in percentages.items():
        target_vo2 = pct * vdot
        velocity = get_velocity_for_vo2(target_vo2)
        zones[name] = pace_to_min_km(velocity)
        
    return {
        "vdot": round(vdot, 2),
        "zones": zones
    }

if __name__ == "__main__":
    # Test with 5K in 20:00 (VDOT approx 50)
    result = estimate_zones(5000, 20.0)
    print(f"VDOT: {result['vdot']}")
    for zone, pace in result['zones'].items():
        print(f"{zone}: {pace} min/km")
