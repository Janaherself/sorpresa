import { query } from "../../config/database.js";
import { ProductModel } from "../../models/product.js";
import { resetTestDatabase, closeTestDatabase } from '../setupTestDB.js';

describe("ProductModel (Real DB Tests)", () => {
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

  // -----------------------
  // CREATE
  // -----------------------
  describe("create", () => {
    it("should create a new product", async () => {
      const product = await ProductModel.create(
        "Mystery Box",
        "A surprise box",
        29.99,
        5,
        "mystery"
      );

      expect(product).toBeDefined();
      expect(product.name).toBe("Mystery Box");
      expect(product.stock).toBe(5);
    });
  });

  // -----------------------
  // FIND ALL
  // -----------------------
  describe("findAll", () => {
    it("should return all products", async () => {
      await ProductModel.create("A", "a", 10, 1, "cat");
      await ProductModel.create("B", "b", 20, 2, "cat");

      const result = await ProductModel.findAll();

      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty("id");
    });
  });

  // -----------------------
  // FIND BY ID
  // -----------------------
  describe("findById", () => {
    it("should return product by ID", async () => {
      const p = await ProductModel.create("A", "a", 10, 1, "cat");

      const found = await ProductModel.findById(p.id!);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(p.id);
    });

    it("should return null for non-existing ID", async () => {
      const result = await ProductModel.findById(9999);
      expect(result).toBeNull();
    });
  });

  // -----------------------
  // FIND BY CATEGORY
  // -----------------------
  describe("findByCategory", () => {
    it("should return products matching the category", async () => {
      await ProductModel.create("Mystery A", "a", 10, 1, "mystery");
      await ProductModel.create("Mystery B", "b", 20, 2, "mystery");
      await ProductModel.create("Other", "c", 30, 3, "other");

      const result = await ProductModel.findByCategory("mystery");

      expect(result.length).toBe(2);
      expect(result[0]!.category).toBe("mystery");
    });
  });

  // -----------------------
  // TOP POPULAR
  // -----------------------
  describe("findTopPopular", () => {
    beforeAll(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INT,
          status TEXT,
          customer_first_name TEXT,
          customer_last_name TEXT,
          total_amount NUMERIC,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INT REFERENCES orders(id),
          product_id INT REFERENCES products(id),
          quantity INT NOT NULL,
          unit_price NUMERIC NOT NULL
        );
      `);
    });

    it("should return up to 5 most popular products", async () => {
      const p1 = await ProductModel.create("A", "a", 10, 10, "cat");
      const p2 = await ProductModel.create("B", "b", 20, 10, "cat");

      const user = await query(
        `INSERT INTO users (first_name, last_name, email, password_hash, created_at, updated_at)
        VALUES ('John', 'Doe', 'john@example.com', 'hash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *;`
      );

      const order = await query(
        `INSERT INTO orders (user_id, status, customer_first_name, customer_last_name, customer_address, customer_email, total_amount, payment_method)
         VALUES ($1, 'complete', 'John', 'Doe', '123 Main St', 'john@example.com', 10, 'card') RETURNING *;`,
        [user.rows[0].id]
      );

      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, 1, 10);`,
        [order.rows[0].id, p1.id]
      );

      const result = await ProductModel.findTopPopular();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("total_orders");
    });
  });

  // -----------------------
  // UPDATE
  // -----------------------
  describe("update", () => {
    it("should update a product", async () => {
      const p = await ProductModel.create("A", "a", 10, 1, "cat");

      const updated = await ProductModel.update(
        p.id!,
        "Updated",
        "New desc",
        99.99,
        20,
        "updated"
      );

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("Updated");
      expect(Number(updated!.price)).toBe(99.99);
    });

    it("should return null when updating non-existing product", async () => {
      const result = await ProductModel.update(
        9999,
        "X",
        "Y",
        1,
        1,
        "cat"
      );

      expect(result).toBeNull();
    });
  });

  // -----------------------
  // DELETE
  // -----------------------
  describe("delete", () => {
    it("should delete a product", async () => {
      const p = await ProductModel.create("A", "a", 10, 1, "cat");

      const result = await ProductModel.delete(p.id!);

      expect(result).toBe(true);
    });

    it("should return false if product does not exist", async () => {
      const result = await ProductModel.delete(999);

      expect(result).toBe(false);
    });
  });

  // -----------------------
  // DECREASE STOCK
  // -----------------------
  describe("decreaseStock", () => {
    it("should decrease stock if enough quantity exists", async () => {
      const p = await ProductModel.create("A", "a", 10, 5, "cat");

      const result = await ProductModel.decreaseStock(p.id!, 1);

      expect(result).toBe(true);

      const after = await ProductModel.findById(p.id!);
      expect(after!.stock).toBe(4);
    });

    it("should return false if insufficient stock", async () => {
      const p = await ProductModel.create("A", "a", 10, 1, "cat");

      const result = await ProductModel.decreaseStock(p.id!, 10);

      expect(result).toBe(false);
    });
  });
});
