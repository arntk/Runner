const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Auth Middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Routes
app.get('/', (req, res) => {
    res.send('AeroFit AI Backend is running!');
});

app.get('/health', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.json({ status: 'ok', db_time: result.rows[0].now });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

// Registration
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const userResult = await client.query(
                'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
                [email, passwordHash]
            );
            
            const userId = userResult.rows[0].id;
            
            // Create default profile
            await client.query(
                'INSERT INTO profiles (user_id) VALUES ($1)',
                [userId]
            );
            
            await client.query('COMMIT');
            
            const token = jwt.sign({ user_id: userId, email }, JWT_SECRET);
            
            res.status(201).json({ user_id: userId, token });
        } catch (err) {
            await client.query('ROLLBACK');
            if (err.code === '23505') { // Unique violation
                return res.status(400).json({ message: 'User already exists' });
            }
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ user_id: user.id, email }, JWT_SECRET);
        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Profile Endpoints
app.get('/api/profile', authenticateJWT, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT u.email, p.* FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.id = $1',
            [req.user.user_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const profileData = result.rows[0];
        // The test expects `profiles` key for some reason based on `expect(res.body).toHaveProperty('profiles');`
        // Wait, let me check the test again.
        // `expect(res.body).toHaveProperty('email', 'profiletest@example.com');`
        // `expect(res.body).toHaveProperty('profiles');`
        // This is a bit strange, usually it's just `profile`. 
        // Let's match the test.
        const { email, ...profiles } = profileData;
        res.json({ email, profiles });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/profile', authenticateJWT, async (req, res) => {
    const { name, weight_kg, max_hr, resting_hr, hr_zones, pace_zones, vdot, hr_unit_pref, pace_unit_pref } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE profiles SET 
                name = COALESCE($1, name),
                weight_kg = COALESCE($2, weight_kg),
                max_hr = COALESCE($3, max_hr),
                resting_hr = COALESCE($4, resting_hr),
                hr_zones = COALESCE($5, hr_zones),
                pace_zones = COALESCE($6, pace_zones),
                vdot = COALESCE($7, vdot),
                hr_unit_pref = COALESCE($8, hr_unit_pref),
                pace_unit_pref = COALESCE($9, pace_unit_pref)
            WHERE user_id = $10 RETURNING *`,
            [name, weight_kg, max_hr, resting_hr, hr_zones, pace_zones, vdot, hr_unit_pref, pace_unit_pref, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.json({ profiles: result.rows[0] });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;
