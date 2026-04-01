import pytest
import uuid
import json
from unittest.mock import MagicMock, patch
from api import app
from models import Activity, Profile

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@patch('api.init_db')
def test_get_activities_isolation(mock_init_db, client):
    # Setup
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())
    
    mock_session = MagicMock()
    mock_init_db.return_value = MagicMock(return_value=mock_session)
    
    # Mock data for User A
    activity_a = Activity(
        activity_id=1,
        user_id=uuid.UUID(user_a_id),
        date="2026-03-31 08:00:00",
        activity_type='run',
        distance_meters=5000,
        duration_seconds=1200
    )
    
    # Mock data for User B
    activity_b = Activity(
        activity_id=2,
        user_id=uuid.UUID(user_b_id),
        date="2026-03-31 09:00:00",
        activity_type='run',
        distance_meters=10000,
        duration_seconds=2400
    )
    
    def side_effect_filter_by(**kwargs):
        u_id = kwargs.get('user_id')
        mock_query = MagicMock()
        if str(u_id) == user_a_id:
            mock_query.order_by.return_value.limit.return_value.all.return_value = [activity_a]
        elif str(u_id) == user_b_id:
            mock_query.order_by.return_value.limit.return_value.all.return_value = [activity_b]
        else:
            mock_query.order_by.return_value.limit.return_value.all.return_value = []
        return mock_query

    mock_session.query.return_value.filter_by.side_effect = side_effect_filter_by
    
    # Test User A request
    response_a = client.get(f'/api/activities?user_id={user_a_id}')
    assert response_a.status_code == 200
    data_a = json.loads(response_a.data)
    assert len(data_a) == 1
    assert data_a[0]['id'] == 1
    
    # Test User B request
    response_b = client.get(f'/api/activities?user_id={user_b_id}')
    assert response_b.status_code == 200
    data_b = json.loads(response_b.data)
    assert len(data_b) == 1
    assert data_b[0]['id'] == 2

@patch('ai_coach.init_db')
@patch('ai_coach.client')
def test_activity_analysis_isolation(mock_client, mock_init_db):
    from ai_coach import analyze_activity
    
    user_a_id = uuid.uuid4()
    user_b_id = uuid.uuid4()
    
    mock_session = MagicMock()
    mock_init_db.return_value = MagicMock(return_value=mock_session)
    
    # Mock profiles
    profile_a = Profile(user_id=user_a_id, max_hr=190)
    profile_b = Profile(user_id=user_b_id, max_hr=160)
    
    def side_effect_profile_query(**kwargs):
        u_id = kwargs.get('user_id')
        mock_query = MagicMock()
        if u_id == user_a_id:
            mock_query.first.return_value = profile_a
        elif u_id == user_b_id:
            mock_query.first.return_value = profile_b
        return mock_query

    mock_session.query.return_value.filter_by.side_effect = side_effect_profile_query
    
    # Mock activity
    activity_a = Activity(user_id=user_a_id, laps=[{'average_speed': 3.0, 'average_heartrate': 150, 'moving_time': 100}])
    
    # Mock history for User A (at least 10 laps needed for K-Means)
    history_a = [
        Activity(user_id=user_a_id, laps=[{'average_speed': 3.5, 'average_heartrate': 140, 'moving_time': 100}] * 10)
    ]
    
    # Mock OpenAI response
    mock_client.chat.completions.create.return_value.choices[0].message.content = "User A Feedback"
    
    # Run analysis for User A
    feedback = analyze_activity(activity_a, history_a)
    
    # Verify User A's profile was used
    # The first call to filter_by is for Profile in analyze_activity
    # Actually, the mock_session.query().filter_by() is called with user_id
    mock_session.query.return_value.filter_by.assert_any_call(user_id=user_a_id)
    assert "User A Feedback" in feedback

    # Run analysis for User B (different activity)
    activity_b = Activity(user_id=user_b_id, laps=[{'average_speed': 2.0, 'average_heartrate': 130, 'moving_time': 100}])
    mock_client.chat.completions.create.return_value.choices[0].message.content = "User B Feedback"
    
    feedback_b = analyze_activity(activity_b, history_a) # History doesn't matter much for this check
    mock_session.query.return_value.filter_by.assert_any_call(user_id=user_b_id)
    assert "User B Feedback" in feedback_b
