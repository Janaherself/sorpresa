import { query } from '../../config/database.js';
import { OrderModel } from '../../models/order.js';
import type { User } from '../../models/user.js';
import { closeTestDatabase, resetTestDatabase } from '../setupTestDB.js';

// Utility helpers for inserting required data

async function createTestUser() {
  const result = await query(
    `INSERT INTO users (first_name, last_name, email, password_hash, created_at, updated_at)
     VALUES ('Test', 'User', 'test_${Date.now()}@example.com', 'hash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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

describe('OrderModel', () => {

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

  describe('create', () => {
    it('should create a new order', async () => {

      const user = await createTestUser();

      const order = await OrderModel.create(user.id, 'John', 'Doe', 'john@example.com', '123 Main St', 120.5, 'card');

      expect(order).toBeDefined();
      expect(order.user_id).toBe(user.id);
      expect(order.status).toBe('complete');
    });
  });

  describe('addProductsToOrder', () => {
    it('should add product to order', async () => {

      const user = await createTestUser();
      const product = await createTestProduct('Test Product', 50);
      const order = await createTestOrder(user, 100);

      const item = await OrderModel.addProductsToOrder(order.id, product.id, 2, product.price);

      expect(item.order_id).toBe(order.id);
      expect(item.product_id).toBe(product.id);
      expect(item.quantity).toBe(2);
    });
  });

  describe('findById', () => {
    it('should return order with items', async () => {

      const user = await createTestUser();
      const product = await createTestProduct('Apple', 10);
      const order = await createTestOrder(user, 30);
      await createTestOrderItem(order.id, product.id, 3, product.price);

      const found = await OrderModel.findById(order.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(order.id);
      expect(found!.items.length).toBeGreaterThan(0);
      expect(found!.items[0]!.product_id).toBe(product.id);
    });
  });

  describe('findByUserId', () => {
    it('should return all orders for user', async () => {

      const user = await createTestUser();
      const product = await createTestProduct('Test Product', 50);
      const order = await createTestOrder(user, 50);
      await createTestOrderItem(order.id, product.id, 1, product.price);

      const orders = await OrderModel.findByUserId(user.id);

      expect(orders.length).toBe(1);
      expect(orders[0]!.items.length).toBe(1);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {

      const user = await createTestUser();
      const order = await createTestOrder(user, 100);      

      const updated = await OrderModel.updateStatus(order.id, 'active');

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('active');
    });
  });

  describe('delete', () => {
    it('should delete order', async () => {

      const user = await createTestUser();
      const order = await createTestOrder(user, 50);

      const deleted = await OrderModel.delete(order.id);

      expect(deleted).toBe(true);
    });
  });

  describe('getItems', () => {
    it('should return all items for an order', async () => {

      const user = await createTestUser();
      const product1 = await createTestProduct('A', 10);
      const product2 = await createTestProduct('B', 20);
      const order = await createTestOrder(user, 40);
      await createTestOrderItem(order.id, product1.id, 2, product1.price);
      await createTestOrderItem(order.id, product2.id, 1, product2.price);

      const items = await OrderModel.getItems(order.id);

      expect(items.length).toBe(2);
      expect(items[0]!.product_id).toBe(product1.id);
      expect(items[1]!.product_id).toBe(product2.id);
    });
  });

  describe('findCompletedByUserId', () => {
    it('should return completed orders with items', async () => {

      const user = await createTestUser();
      const product = await createTestProduct('Test Product', 50);
      const order = await createTestOrder(user, 100);
      await createTestOrderItem(order.id, product.id, 2, product.price);

      const results = await OrderModel.findCompletedByUserId(user.id);

      expect(results.length).toBe(1);
      expect(results[0]!.items[0]!.product_id).toBe(product.id);
    });
  });

  describe('findAll', () => {
    it('should return all orders with items', async () => {
      
      const user = await createTestUser();
      const product = await createTestProduct('Test Product', 50);
      const order1 = await createTestOrder(user, 50);
      const order2 = await createTestOrder(user, 150);
      await createTestOrderItem(order1.id, product.id, 1, product.price);
      await createTestOrderItem(order2.id, product.id, 3, product.price);

      const all = await OrderModel.findAll();

      expect(all.length).toBe(2);
      expect(all[0]!.items.length).toBeGreaterThanOrEqual(1);
    });
  });
});
