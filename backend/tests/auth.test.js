const request = require('supertest');
const app = require('../server');

describe('Authentication API', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('user_id');
            expect(res.body).toHaveProperty('token');
        });

        it('should fail if email is missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    password: 'password123'
                });
            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login an existing user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toBe(401);
        });
    });
});
