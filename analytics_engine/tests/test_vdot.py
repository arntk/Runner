import pytest
from vdot import estimate_zones

def test_vdot_calculation_vdot_50_5k():
    # VDOT 50 for 5K is approx 20:00
    # Let's test if estimate_zones returns correct paces
    result = estimate_zones(5000, 20.0) # distance in m, time in minutes
    
    # Check vdot
    assert result["vdot"] > 45 # approx 50
    
    zones = result["zones"]
    # Check for specific keys in the returned dict
    assert "Recovery" in zones
    assert "Aerobic Base" in zones
    assert "Threshold" in zones
    assert "VO2 Max" in zones
    
    # Values should be min/km strings like "5:30"
    # Recovery for VDOT 50: ~5:30-6:15 min/km
    # Threshold for VDOT 50: ~4:18 min/km
    # VO2 Max for VDOT 50: ~3:56 min/km
    
    assert ":" in zones["Recovery"]
    assert ":" in zones["Threshold"]
    assert ":" in zones["VO2 Max"]

def test_vdot_invalid_input():
    with pytest.raises(ValueError):
        estimate_zones(0, 20.0)
    with pytest.raises(ValueError):
        estimate_zones(5000, 0)
