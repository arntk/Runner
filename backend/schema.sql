-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    weight_kg FLOAT,
    max_hr INTEGER,
    resting_hr INTEGER,
    hr_zones JSONB DEFAULT '{}'::jsonb,
    pace_zones JSONB DEFAULT '{}'::jsonb,
    vdot FLOAT,
    hr_unit_pref VARCHAR(10) DEFAULT 'absolute',
    pace_unit_pref VARCHAR(10) DEFAULT 'absolute'
);
