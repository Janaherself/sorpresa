import app from '../../app.js';
import request from 'supertest';
import type { User } from '../../models/user.js';
import { query } from '../../config/database.js';
import { closeTestDatabase, resetTestDatabase } from '../setupTestDB.js';
import { generateToken } from '../../utils/jwt.js';

// Utility helpers for inserting required data
async function createTestUser() {
  const result = await query(
    `INSERT INTO users (first_name, last_name, email, password_hash, created_at, updated_at)
     VALUES ('Test', 'User', 'test@example.com', 'hash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`
  );
  return result.rows[0];
}

async function createTestProduct(name: string, price: number) {
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

describe('Orders Routes', () => {
  
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

  describe('POST /api/orders', () => {
    it('should create a new order with valid data', async () => {
        
      const user = await createTestUser();
      const product = await createTestProduct('Test Product', 50);

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer ' + generateToken({ id: user.id, email: user.email }))
        .send({
          items: [{ productId: product.id, quantity: 2 }],
          customerFirstName: user.first_name,
          customerLastName: user.last_name,
          customerEmail: user.email,
          customerAddress: '123 Main St',
          paymentMethod: 'card',
        });
  
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(Number(response.body.data.total_amount)).toBe(100);
    });

    it('should return 400 for invalid product data', async () => {

      const user = await createTestUser();
      const product = await createTestProduct('Test Product', 50);

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer ' + generateToken({ id: user.id, email: user.email }))
        .send({
          items: [{ productId: product.id, quantity: 0 }],
          customerFirstName: user.first_name,
          customerLastName: user.last_name,
          customerEmail: user.email,
          customerAddress: '123 Main St',
          paymentMethod: 'card',
        });
  
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order must contain at least one item with a positive quantity');
    });
    
    it('should return 400 for invalid order data', async () => {

      const user = await createTestUser();
      const product = await createTestProduct('Test Product', 50);

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer ' + generateToken({ id: user.id, email: user.email }))
        .send({
          items: [{ productId: product.id, quantity: 2 }],
          customerFirstName: user.first_name,
          customerLastName: user.last_name,
          customerEmail: user.email,
          customerAddress: '123 Main St',
          // Missing paymentMethod
        });
  
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields: customerFirstName, customerLastName, customerEmail, customerAddress, paymentMethod');
    });
  });

  describe('GET /api/orders', () => {
    it('should return all orders for the user', async () => {

      const user = await createTestUser();
      const order = await createTestOrder(user, 100);

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer ' + generateToken({ id: user.id, email: user.email }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
    });

    it('should return no orders for the user when none exist', async () => {

      const user = await createTestUser();

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer ' + generateToken({ id: user.id, email: user.email }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return the order when it exists', async () => {
      
      const user = await createTestUser();
      const order = await createTestOrder(user, 75);

      const response = await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Authorization', 'Bearer ' + generateToken({ id: user.id, email: user.email }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customer_first_name).toEqual('Test');
      expect(Number(response.body.data.total_amount)).toBe(75);
    });

    it('should return 400 for invalid order id', async () => {
      
      const user = await createTestUser();
      const order = await createTestOrder(user, 75);

      const response = await request(app)
        .get('/api/orders/a')
        .set('Authorization', 'Bearer ' + generateToken({ id: user.id, email: user.email }));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid order id');
    });

    it('should return 404 for non-existent order id', async () => {
      
      const user = await createTestUser();
      const order = await createTestOrder(user, 75);

      const response = await request(app)
        .get(`/api/orders/${order.id + 1}`)
        .set('Authorization', 'Bearer ' + generateToken({ id: user.id, email: user.email }));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found');
    });
  });

  describe('GET /api/orders/completed', () => {
    it('should return completed orders for the user', async () => {

      const user = await createTestUser();

      const response = await request(app)
        .get('/api/orders/completed')
        .set('Authorization', 'Bearer ' + generateToken({ id: user.id, email: user.email }));
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
