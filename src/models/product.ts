import { query } from '../config/database.js';

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  created_at: Date;
  updated_at: Date;
}

export class ProductModel {
  // Create a new product
  static async create(
    name: string,
    description: string,
    price: number,
    stock: number,
    category: string,
  ): Promise<Product> {
    const result = await query(
      `INSERT INTO products (name, description, price, stock, category, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			 RETURNING *`,
      [name, description, price, stock, category],
    );

    return result.rows[0];
  }

  // Get all products
  static async findAll(): Promise<Product[]> {
    const result = await query('SELECT * FROM products ORDER BY created_at DESC');
    return result.rows;
  }

  // Get product by ID
  static async findById(id: number): Promise<Product | null> {
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0] ?? null;
  }

  // Get products by category
  static async findByCategory(category: string): Promise<Product[]> {
    const result = await query(
      'SELECT * FROM products WHERE category = $1 ORDER BY created_at DESC',
      [category],
    );
    return result.rows;
  }

  // Get 5 most popular products (most ordered)
  static async findTopPopular(): Promise<Array<Product & { total_orders: number }>> {
    const result = await query(
      `SELECT p.*, COUNT(op.id) as total_orders
			 FROM products p
			 LEFT JOIN order_items op ON p.id = op.product_id
			 GROUP BY p.id
			 ORDER BY total_orders DESC
			 LIMIT 5`,
    );
    return result.rows;
  }

  // Update product
  static async update(
    id: number,
    name: string,
    description: string,
    price: number,
    stock: number,
    category: string,
  ): Promise<Product | null> {
    const result = await query(
      `UPDATE products
			 SET name = $1, description = $2, price = $3, stock = $4, category = $5, updated_at = CURRENT_TIMESTAMP
			 WHERE id = $6
			 RETURNING *`,
      [name, description, price, stock, category, id],
    );

    return result.rows[0] ?? null;
  }

  // Delete product
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM products WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async decreaseStock(productId: number, quantity: number): Promise<boolean> {
    const result = await query(
      `UPDATE products
       		 SET stock = stock - $1
       		 WHERE id = $2 AND stock >= $1
       		 RETURNING stock`,
      [quantity, productId],
    );

    // If no rows returned, stock was insufficient
    return result.rows.length > 0;
  }
}
