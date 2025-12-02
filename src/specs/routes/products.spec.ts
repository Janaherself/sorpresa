import app from '../../app.js';
import request from 'supertest';
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
     VALUES ($1, 'desc', $2, 10, 'mystery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [name, price]
  );
  return result.rows[0];
}

describe('Products Routes', () => {

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

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      
      const product = await createTestProduct('Mystery Box', 20);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe(product.name);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by id', async () => {
      
      const product = await createTestProduct('Mystery Box', 20);

      const response = await request(app).get(`/api/products/${product.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 for non-existent product', async () => {

      const response = await request(app).get('/api/products/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/products/popular/top-5', () => {
    it('should return 5 most popular products', async () => {
      
      const productNames = ['Prod1', 'Prod2', 'Prod3', 'Prod4', 'Prod5', 'Prod6'];
      for (const name of productNames) {
        await createTestProduct(name, 20);
      }

      const response = await request(app).get('/api/products/popular/top-5');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
    });
  });

  describe('GET /api/products/:category', () => {
    it('should return products for a valid category', async () => {
      
      const product1 = await createTestProduct('Mystery Box 1', 20);
      const product2 = await createTestProduct('Mystery Box 2', 30);
      
      const response = await request(app).get('/api/products/category/mystery');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].name).toEqual(product2.name);
      expect(response.body.data[1].name).toEqual(product1.name);
    });

    it('should return an empty array if no products exist for the category', async () => {

      const response = await request(app).get('/api/products/category/unknown-category');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product with valid token', async () => {
      
      const user = await createTestUser();

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ` + generateToken({ id: user.id, email: user.email }))
        .send({
          name: 'New Mystery Box',
          description: 'A new surprise box',
          price: 39.99,
          stock: 5,
          category: 'mystery',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 if required fields are missing', async () => {
      
      const user = await createTestUser();

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ` + generateToken({ id: user.id, email: user.email }))
        .send({
          name: 'Incomplete Product',
          price: 19.99,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });
  });
});
