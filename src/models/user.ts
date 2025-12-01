import { query } from '../config/database.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserPurchase {
  id: number;
  status: string;
  customer_first_name: string;
  customer_last_name: string;
  total_amount: number;
  created_at: Date;
  total: number;
  products: Array<{
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
  }>;
}

export class UserModel {
  // Create a new user with hashed password
  static async create(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			 RETURNING *`,
      [firstName, lastName, email, hashedPassword],
    );

    return result.rows[0];
  }

  // Authenticate user by verifying password
  static async authenticate(email: string, password: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    return isPasswordValid ? user : null;
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ?? null;
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Get all users (admin function)
  static async findAll(): Promise<User[]> {
    const result = await query(
      'SELECT id, first_name, last_name, email, created_at, updated_at FROM users',
    );
    return result.rows;
  }

  // Get user with 5 most recent purchases
  static async findByIdWithPurchases(
    id: number,
  ): Promise<{ user: User; purchases: UserPurchase[] } | null> {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];

    // Get 5 most recent completed orders with products
    const purchasesResult = await query(
      `SELECT 
				o.id,
				o.status,
				o.customer_first_name,
				o.customer_last_name,
				o.total_amount,
				o.created_at,
				JSON_AGG(
					JSON_BUILD_OBJECT(
						'id', p.id,
						'name', p.name,
						'quantity', op.quantity,
						'unit_price', op.unit_price
					)
				) as products
			 FROM orders o
			 LEFT JOIN order_items op ON o.id = op.order_id
			 LEFT JOIN products p ON op.product_id = p.id
			 WHERE o.user_id = $1 AND o.status = 'complete'
			 GROUP BY o.id, o.status, o.customer_first_name, o.customer_last_name, o.total_amount, o.created_at
			 ORDER BY o.created_at DESC
			 LIMIT 5`,
      [id],
    );

    return { user, purchases: purchasesResult.rows };
  }

  // Update user information
  static async update(id: number, firstName: string, lastName: string): Promise<User | null> {
    const result = await query(
      `UPDATE users 
			 SET first_name = $1, last_name = $2, updated_at = CURRENT_TIMESTAMP
			 WHERE id = $3
			 RETURNING *`,
      [firstName, lastName, id],
    );

    return result.rows[0] ?? null;
  }

  // Delete user
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
