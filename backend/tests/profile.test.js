const request = require('supertest');
const app = require('../server');

describe('Profile API', () => {
    let token;

    beforeAll(async () => {
        // Register and login to get a token
        await request(app)
            .post('/api/auth/register')
            .send({
                email: 'profiletest@example.com',
                password: 'password123'
            });
        
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'profiletest@example.com',
                password: 'password123'
            });
        
        token = loginRes.body.token;
    });

    describe('GET /api/profile', () => {
        it('should get current user profile', async () => {
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('email', 'profiletest@example.com');
            expect(res.body).toHaveProperty('profiles');
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/profile');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('PUT /api/profile', () => {
        it('should update user profile', async () => {
            const updateData = {
                name: 'Test Runner',
                max_hr: 190,
                resting_hr: 50,
                hr_zones: {
                    zone1: { min: 110, max: 130, unit: 'bpm' },
                    zone2: { min: 130, max: 145, unit: 'bpm' }
                }
            };
            const res = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);
            expect(res.statusCode).toBe(200);
            expect(res.body.profiles).toMatchObject(updateData);
        });
    });
});
