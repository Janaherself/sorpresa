import { query } from '../../config/database.js';
import { UserModel } from '../../models/user.js';
import { resetTestDatabase, closeTestDatabase } from '../setupTestDB.js';

describe('UserModel', () => {

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

  describe('create()', () => {
    it('creates a new user and hashes the password', async () => {

      const user = await UserModel.create('John', 'Doe', 'john@example.com', 'password123');

      expect(user).toBeDefined();
      expect(user.id).toBe(1);
      expect(user.email).toBe('john@example.com');
      expect(user.password_hash).not.toBe('password123');
    });
  });

  describe('authenticate()', () => {
    beforeEach(async () => {
      await UserModel.create('Alice', 'Smith', 'alice@example.com', 'mypassword');
    });

    it('authenticates a user with the correct password', async () => {
      
      const user = await UserModel.authenticate('alice@example.com', 'mypassword');

      expect(user).not.toBeNull();
      expect(user?.email).toBe('alice@example.com');
    });

    it('returns null for invalid password', async () => {

       const user = await UserModel.authenticate('alice@example.com', 'wrong');

      expect(user).toBeNull();
    });

    it('returns null if user does not exist', async () => {

      const user = await UserModel.authenticate('notfound@example.com', 'anything');

      expect(user).toBeNull();
    });
  });

  describe('findById()', () => {
    it('returns a user when found', async () => {

      const created = await UserModel.create('Bob', 'Marley', 'bob@example.com', 'secret');

      const user = await UserModel.findById(created.id);

      expect(user).not.toBeNull();
      expect(user?.email).toBe('bob@example.com');
    });

    it('returns null when user does not exist', async () => {

      const user = await UserModel.findById(999);
      
      expect(user).toBeNull();
    });
  });

  describe('findByEmail()', () => {
    it('returns a user when found', async () => {

      await UserModel.create('Karen', 'Lee', 'karen@example.com', 'pass');

      const user = await UserModel.findByEmail('karen@example.com');

      expect(user).not.toBeNull();
      expect(user?.email).toBe('karen@example.com');
    });

    it('returns null when not found', async () => {

      const user = await UserModel.findByEmail('nope@example.com');
      
      expect(user).toBeNull();
    });
  });

  describe('findAll()', () => {
    it('returns all users', async () => {

      await UserModel.create('A', 'A', 'a@example.com', 'a');
      await UserModel.create('B', 'B', 'b@example.com', 'b');

      const users = await UserModel.findAll();

      expect(users.length).toBe(2);
      expect(users[0]).toHaveProperty('id');
    });
  });

  describe('update()', () => {
    it('updates an existing user', async () => {

      const created = await UserModel.create('Old', 'Name', 'old@example.com', 'pw');

      const updated = await UserModel.update(created.id, 'NewName', 'Updated');

      expect(updated).not.toBeNull();
      expect(updated?.first_name).toBe('NewName');
    });

    it('returns null if user does not exist', async () => {

      const result = await UserModel.update(999, 'X', 'Y');
      
      expect(result).toBeNull();
    });
  });

  describe('delete()', () => {
    it('deletes a user', async () => {

      const created = await UserModel.create('Del', 'User', 'del@example.com', 'pw');

      const isDeleted = await UserModel.delete(created.id);

      expect(isDeleted).toBe(true);
    });

    it('returns false if user not found', async () => {

      const isDeleted = await UserModel.delete(12345);
      
      expect(isDeleted).toBe(false);
    });
  });

  describe('findByIdWithPurchases()', () => {
    it('returns user with purchase list', async () => {

      const user = await UserModel.create('Buyer', 'Test', 'buyer@example.com', 'pw');

      const productResult = await query(
        `INSERT INTO products (name, price, description, stock, category, created_at, updated_at)
         VALUES ('TestProd', 10.5, 'desc', 100, 'TestCat', NOW(), NOW())
         RETURNING *`
      );
      const product = productResult.rows[0];

      const orderResult = await query(
        `INSERT INTO orders (user_id, status, customer_first_name, customer_last_name, customer_email, customer_address, total_amount,  payment_method, created_at)
         VALUES ($1, 'complete', 'Buyer', 'Test', 'buyer@example.com', '123 Main St', 10.5, 'card', NOW())
         RETURNING *`,
        [user.id]
      );
      const order = orderResult.rows[0];

      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, 1, 10.5)`,
        [order.id, product.id]
      );

      const result = await UserModel.findByIdWithPurchases(user.id);

      expect(result).not.toBeNull();
      expect(result?.user.email).toBe('buyer@example.com');
      expect(result?.purchases.length).toBe(1);
      expect(result?.purchases[0]!.products.length).toBe(1);
      expect(result?.purchases[0]!.products[0]!.id).toBe(product.id);
    });

    it('returns null for non-existing user', async () => {

      const result = await UserModel.findByIdWithPurchases(999);
      
      expect(result).toBeNull();
    });
  });
});
