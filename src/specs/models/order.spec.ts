import { query } from '../../config/database.js';
import { OrderModel } from '../../models/order.js';
import { closeTestDatabase, resetTestDatabase } from '../setupTestDB.js';

/**
 * Utility helpers for inserting required data
 */

async function createTestUser() {
  const result = await query(
    `INSERT INTO users (first_name, last_name, email, password_hash, created_at, updated_at)
     VALUES ('Test', 'User', 'test_${Date.now()}@example.com', 'hash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`
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

describe('OrderModel', () => {
  beforeAll(async () => {
  await resetTestDatabase();
});

beforeEach(async () => {
  // Clean the entire DB before EVERY test
  await query(`
    TRUNCATE TABLE 
      order_items,
      orders,
      products,
      users
    RESTART IDENTITY CASCADE;
  `);
});

afterAll(async () => {
  await closeTestDatabase();
});

  // ---------------------------------------------------------
  //  create()
  // ---------------------------------------------------------
  describe('create', () => {
    it('should create a new order', async () => {
      const user = await createTestUser();

      const order = await OrderModel.create(
        user.id,
        'John',
        'Doe',
        'john@example.com',
        '123 Main St',
        120.5,
        'card',
      );

      expect(order).toBeDefined();
      expect(order.user_id).toBe(user.id);
      expect(order.status).toBe('complete');
    });
  });

  // ---------------------------------------------------------
  // addProductsToOrder()
  // ---------------------------------------------------------
  describe('addProductsToOrder', () => {
    it('should add product to order', async () => {
      const user = await createTestUser();
      const product = await createTestProduct();
      const order = await OrderModel.create(
        user.id,
        'John',
        'Doe',
        'john@example.com',
        '123 St',
        50,
        'card',
      );

      const item = await OrderModel.addProductsToOrder(order.id, product.id, 2, product.price);

      expect(item.order_id).toBe(order.id);
      expect(item.product_id).toBe(product.id);
      expect(item.quantity).toBe(2);
    });
  });

  // ---------------------------------------------------------
  // findById()
  // ---------------------------------------------------------
  describe('findById', () => {
    it('should return order with items', async () => {
      const user = await createTestUser();
      const product = await createTestProduct('Apple', 10);

      const order = await OrderModel.create(
        user.id, 'A', 'B', 'a@b.com', 'addr', 10, 'card'
      );

      await OrderModel.addProductsToOrder(order.id, product.id, 3, product.price);

      const found = await OrderModel.findById(order.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(order.id);
      expect(found!.items.length).toBeGreaterThan(0);
      expect(found!.items[0]!.product_id).toBe(product.id);
    });
  });

  // ---------------------------------------------------------
  // findByUserId()
  // ---------------------------------------------------------
  describe('findByUserId', () => {
    it('should return all orders for user', async () => {
      const user = await createTestUser();
      const product = await createTestProduct();

      const order = await OrderModel.create(
        user.id, 'John', 'Doe', 'x@y.com', 'address', 33, 'card'
      );

      await OrderModel.addProductsToOrder(order.id, product.id, 1, product.price);

      const orders = await OrderModel.findByUserId(user.id);

      expect(orders.length).toBe(1);
      expect(orders[0]!.items.length).toBe(1);
    });
  });

  // ---------------------------------------------------------
  // updateStatus()
  // ---------------------------------------------------------
  describe('updateStatus', () => {
    it('should update order status', async () => {
      const user = await createTestUser();

      const order = await OrderModel.create(
        user.id, 'John', 'Doe', 'x@y.com', 'Address', 99, 'card'
      );

      const updated = await OrderModel.updateStatus(order.id, 'active');

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('active');
    });
  });

  // ---------------------------------------------------------
  // delete()
  // ---------------------------------------------------------
  describe('delete', () => {
    it('should delete order', async () => {
      const user = await createTestUser();
      const order = await OrderModel.create(
        user.id, 'John', 'Doe', 'x@y.com', 'Address', 50, 'card'
      );

      const deleted = await OrderModel.delete(order.id);

      expect(deleted).toBe(true);

      const check = await OrderModel.findById(order.id);
      expect(check).toBeNull();
    });
  });

  // ---------------------------------------------------------
  // getItems()
  // ---------------------------------------------------------
  describe('getItems', () => {
    it('should return all items for an order', async () => {
      const user = await createTestUser();
      const product1 = await createTestProduct('A', 10);
      const product2 = await createTestProduct('B', 20);

      const order = await OrderModel.create(
        user.id, 'John', 'Doe', 'x@y.com', 'addr', 100, 'card'
      );

      await OrderModel.addProductsToOrder(order.id, product1.id, 2, product1.price);
      await OrderModel.addProductsToOrder(order.id, product2.id, 1, product2.price);

      const items = await OrderModel.getItems(order.id);

      expect(items.length).toBe(2);
      expect(items[0]!.product_id).toBe(product1.id);
      expect(items[1]!.product_id).toBe(product2.id);
    });
  });

  // ---------------------------------------------------------
  // findCompletedByUserId()
  // ---------------------------------------------------------
  describe('findCompletedByUserId', () => {
    it('should return completed orders with items', async () => {
      const user = await createTestUser();
      const product = await createTestProduct();

      const order = await OrderModel.create(
        user.id, 'F', 'L', 'e@mail.com', 'addr', 33, 'card'
      );

      await OrderModel.addProductsToOrder(order.id, product.id, 2, product.price);

      const results = await OrderModel.findCompletedByUserId(user.id);

      expect(results.length).toBe(1);
      expect(results[0]!.items[0]!.product_id).toBe(product.id);
    });
  });

  // ---------------------------------------------------------
  // findAll()
  // ---------------------------------------------------------
  describe('findAll', () => {
    it('should return all orders with items', async () => {
      const user = await createTestUser();
      const product = await createTestProduct();

      const order1 = await OrderModel.create(
        user.id, 'J', 'D', 'a@b.c', 'addr', 55, 'card'
      );
      await OrderModel.addProductsToOrder(order1.id, product.id, 1, product.price);

      const order2 = await OrderModel.create(
        user.id, 'J2', 'D2', 'c@d.e', 'addr', 44, 'card'
      );
      await OrderModel.addProductsToOrder(order2.id, product.id, 3, product.price);

      const all = await OrderModel.findAll();

      expect(all.length).toBe(2);
      expect(all[0]!.items.length).toBeGreaterThanOrEqual(1);
    });
  });
});
