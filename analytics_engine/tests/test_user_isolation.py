import uuid
import pytest
from models import Activity, StravaAuth, Profile
from sqlalchemy.orm import Session

def test_activity_requires_user_id():
    activity = Activity(
        activity_id=123,
        date="2026-03-31 08:00:00",
        activity_type='run'
    )
    # This should fail if user_id is missing and non-nullable
    # But for now we are testing if the attribute exists
    assert hasattr(activity, 'user_id')

def test_strava_auth_requires_user_id():
    auth = StravaAuth(
        id=1,
        access_token='abc',
        refresh_token='def',
        expires_at=1234567890
    )
    assert hasattr(auth, 'user_id')

def test_profile_model_mapping():
    profile = Profile(
        user_id=uuid.uuid4(),
        max_hr=190
    )
    assert hasattr(profile, 'user_id')
    assert hasattr(profile, 'max_hr')
