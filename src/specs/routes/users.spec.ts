import app from '../../app.js';
import request from 'supertest';
import { query } from '../../config/database.js';
import { closeTestDatabase, resetTestDatabase } from '../setupTestDB.js';
import { generateToken } from '../../utils/jwt.js';
import bcrypt from 'bcrypt';
import type { User } from '../../models/user.js';

// Utility helpers for inserting required data
async function createTestUser(hashedPassword: string) {
  const result = await query(
    `INSERT INTO users (first_name, last_name, email, password_hash, created_at, updated_at)
     VALUES ('Test', 'User', 'test@example.com', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
     [hashedPassword]
  );
  return result.rows[0];
}

async function createTestProduct(name = 'Product', price = 20) {
  const result = await query(
    `INSERT INTO products (name, description, price, stock, category, created_at, updated_at)
     VALUES ($1, 'desc', $2, 10, 'cat', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [name, price]
  );
  return result.rows[0];
}

async function createTestOrder(user: User, totalAmount: number) {
    const result = await query(
      `INSERT INTO orders (user_id, status, customer_first_name, customer_last_name, customer_email, customer_address, payment_method, total_amount, created_at, updated_at)
       VALUES ($1, 'complete', $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [user.id, user.first_name, user.last_name, user.email, '123 Main St', 'card', totalAmount],
    );
    return result.rows[0];
}

async function createTestOrderItem(orderId: number, productId: number, quantity: number, unitPrice: number) {
    const result = await query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, created_at)
			 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
			 ON CONFLICT (order_id, product_id) 
			 DO UPDATE SET quantity = order_items.quantity + $3
			 RETURNING *`,
      [orderId, productId, quantity, unitPrice],
    );

    return result.rows[0];
  }

describe('Users Routes', () => {

  beforeAll(async () => {
    await resetTestDatabase();
  });

  beforeEach(async () => {
    await query(`
      TRUNCATE TABLE order_items, orders, products, users
      RESTART IDENTITY CASCADE;
    `);
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      
      const response = await request(app).post('/api/users/register').send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@user.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should reject if email already exists', async () => {
      
      const user = await createTestUser('password123');

      const response = await request(app).post('/api/users/register').send({
        firstName: 'Test',
        lastName: 'User',
        email: user.email,
        password: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login a user with correct credentials', async () => {

      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createTestUser(hashedPassword);

      const response = await request(app).post('/api/users/login').send({
        email: user.email,
        password: password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should reject login with incorrect credentials', async () => {

      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createTestUser(hashedPassword);

      const response = await request(app).post('/api/users/login').send({
        email: 'new@email.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

      it('should reject login with missing credentials', async () => {

      const response = await request(app).post('/api/users/login').send({
        email: 'new@email.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields: email, password');
    });
  });

  describe('GET /api/users', () => {
    it('should return all users with valid token', async () => {
      
      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createTestUser(hashedPassword);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ` + generateToken({ id: user.id, email: user.email }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);

    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user with purchases', async () => {
    
      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createTestUser(hashedPassword);
      const product = await createTestProduct('Test Product', 50);
      const order = await createTestOrder(user, 50);
      await createTestOrderItem(order.id, product.id, 1, 50);

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ` + generateToken({ id: user.id, email: user.email }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid user ID', async () => {

      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createTestUser(hashedPassword);

      const response = await request(app)
        .get('/api/users/a')
        .set('Authorization', `Bearer ` + generateToken({ id: user.id, email: user.email }));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

        it('should return 404 for non-existent user ID', async () => {

      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createTestUser(hashedPassword);

      const response = await request(app)
        .get(`/api/users/${user.id + 1}`)
        .set('Authorization', `Bearer ` + generateToken({ id: user.id, email: user.email }));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
