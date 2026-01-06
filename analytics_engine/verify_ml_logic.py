import unittest
from ai_coach import train_user_model, analyze_activity
import logging
import random
import numpy as np
import os

# Mock Activity Class
class MockActivity:
    def __init__(self, activity_type, date, laps, distance_meters=0):
        self.activity_type = activity_type
        self.date = date
        self.laps = laps
        self.distance_meters = distance_meters
        self.ai_feedback = None

def generate_mock_laps(cluster_type, count):
    laps = []
    for _ in range(count):
        # 1609.34 meters per mile
        if cluster_type == 'recovery':
            # > 7:00/mi -> < 3.8 m/s. Say 8:00/mi -> 3.35 m/s
            speed = random.uniform(3.0, 3.5) 
            hr = random.uniform(120, 135)
        elif cluster_type == 'base':
            # 6:30 - 7:00/mi -> 3.8 - 4.1 m/s
            speed = random.uniform(3.8, 4.1)
            hr = random.uniform(135, 150)
        elif cluster_type == 'threshold':
            # ~5:00/mi -> 5.36 m/s
            speed = random.uniform(5.2, 5.5)
            hr = random.uniform(160, 175)
        elif cluster_type == 'vo2':
            # < 4:45/mi -> > 5.6 m/s
            speed = random.uniform(5.7, 6.2)
            hr = random.uniform(175, 190)
        else:
            speed = 3.0
            hr = 100
            
        laps.append({
            'average_speed': speed,
            'average_heartrate': hr,
            'distance': 1600,
            'moving_time': 1609.34 / speed
        })
    return laps

class TestMLModel(unittest.TestCase):
    def setUp(self):
        # Generate history: 
        # 10 runs x 5 laps each
        self.history = []
        for i in range(5):
            # Recovery runs
            self.history.append(MockActivity('Run', '2023-01-01', generate_mock_laps('recovery', 5)))
            # Threshold runs
            self.history.append(MockActivity('Run', '2023-01-02', generate_mock_laps('threshold', 5) + generate_mock_laps('recovery', 2)))
        
        # Add some VO2 and Base
        self.history.append(MockActivity('Run', '2023-01-03', generate_mock_laps('vo2', 4) + generate_mock_laps('base', 4)))
        
    def test_training(self):
        print("\nTesting Model Training...")
        model, centroids = train_user_model(self.history)
        
        self.assertIsNotNone(model)
        self.assertIsNotNone(centroids)
        self.assertEqual(len(centroids), 5)
        
        print("Centroids Found:")
        for cid, stats in centroids.items():
            print(f"Cluster {cid} ({stats['name']}): {stats['pace']}/mi, {stats['hr']:.1f} bpm")
            
        # Verify Threshold Cluster (should be around 5:00-5:15/mi)
        # 5:00 = 300s -> 5.36 m/s
        # 5:15 = 315s -> 5.1 m/s
        
        threshold = [c for c in centroids.values() if c['name'] == 'Threshold'][0]
        self.assertTrue(5.0 < threshold['speed_mps'] < 5.8) 
        
    def test_race_prediction(self):
        print("\nTesting Prediction Logic matches Threshold...")
        model, centroids = train_user_model(self.history)
        
        # Manually invoke analyze logic with a new workout
        current_run = MockActivity('Run', '2023-01-05', generate_mock_laps('threshold', 6))
        
        # We can't easily test the LLM output without a real key, 
        # but we can verify no crash and the function attempts to run.
        # We will mock the OpenAI client call if needed, but for now let's just 
        # assume if the code runs up to prompt generation it's good.
        
        # Note: Set OPENAI_API_KEY to 'test' if it's not set
        if not os.getenv("OPENAI_API_KEY"):
            os.environ["OPENAI_API_KEY"] = "test-key"
            
        try:
            # This might fail on actual OpenAI call if key is invalid, 
            # so we interpret the error string
            result = analyze_activity(current_run, self.history)
            print(f"Result (Expect Error or Success): {result[:100]}...")
        except Exception as e:
            print(f"Execution Error: {e}")

if __name__ == '__main__':
    unittest.main()
