const request = require('supertest');
const app = require('../server');

describe('Backend Data Isolation', () => {
    let userAToken;
    let userBToken;
    let userAId;
    let userBId;

    beforeAll(async () => {
        // Clean up
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
        await pool.query('TRUNCATE users CASCADE');
        await pool.end();

        // Register User A
        const resA = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'userA@example.com',
                password: 'password123'
            });
        userAToken = resA.body.token;
        userAId = resA.body.user_id;

        // Register User B
        const resB = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'userB@example.com',
                password: 'password123'
            });
        userBToken = resB.body.token;
        userBId = resB.body.user_id;
    });

    it('should isolate user profiles during GET requests', async () => {
        // Update User A's profile
        await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
                name: 'User A Name'
            });

        // Get User A's profile
        const resA = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${userAToken}`);
        expect(resA.body.profiles.name).toBe('User A Name');

        // Get User B's profile - should NOT have User A's name
        const resB = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${userBToken}`);
        expect(resB.body.profiles.name).not.toBe('User A Name');
        expect(resB.body.profiles.user_id).toBe(userBId);
        expect(resB.body.profiles.user_id).not.toBe(userAId);
    });

    it('should isolate user profiles during PUT requests', async () => {
        // User A tries to update profile (implicitly their own, but we verify it doesn't touch B)
        await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
                name: 'Updated User A'
            });

        // Verify User B still has their original (default) profile
        const resB = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${userBToken}`);
        expect(resB.body.profiles.name).not.toBe('Updated User A');
    });

    // Since there are no endpoints that take user_id as a parameter, 
    // we can't test "User A cannot modify User B's profile via PUT /api/profile/:id".
    // However, if we ever add such endpoints, they MUST be tested for isolation.
});
