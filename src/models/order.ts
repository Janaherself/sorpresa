import { query } from '../config/database.js';

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: 'active' | 'complete';
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_address: string;
  payment_method: 'cash_on_delivery' | 'card';
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  created_at: Date;
}

export interface OrderDetail extends Order {
  items: Array<{
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    name: string;
    description: string;
  }>;
}

export class OrderModel {
  // Create a new order (at checkout)
  static async create(
    userId: number,
    firstNameCustomer: string,
    lastNameCustomer: string,
    email: string,
    address: string,
    totalAmount: number,
    paymentMethod: 'cash_on_delivery' | 'card',
  ): Promise<Order> {
    const result = await query(
      `INSERT INTO orders (user_id, status, customer_first_name, customer_last_name, customer_email, customer_address, payment_method, total_amount, created_at, updated_at)
			 VALUES ($1, 'complete', $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			 RETURNING *`,
      [userId, firstNameCustomer, lastNameCustomer, email, address, paymentMethod, totalAmount],
    );

    return result.rows[0];
  }

  // Add product to order
  static async addProductsToOrder(
    orderId: number,
    productId: number,
    quantity: number,
    unitPrice: number,
  ): Promise<OrderItem> {
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

  static async getItems(orderId: number): Promise<OrderDetail['items']> {
    const result = await query(
      `SELECT op.id, op.order_id, op.product_id, op.quantity, op.unit_price, p.name, p.description
			FROM order_items op
			JOIN products p ON p.id = op.product_id
			WHERE op.order_id = $1`,
      [orderId],
    );

    return result.rows;
  }

  // Get order by ID with products
  static async findById(id: number): Promise<OrderDetail | null> {
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) return null;

    const order = orderResult.rows[0];

    const items = await this.getItems(id);

    return { ...order, items };
  }

  // Get all orders by user
  static async findByUserId(userId: number): Promise<OrderDetail[]> {
    const result = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [
      userId,
    ]);

    const orders: OrderDetail[] = [];

    for (const order of result.rows) {
      const items = await this.getItems(order.id);
      orders.push({ ...order, items });
    }

    return orders;
  }

  // Get completed orders by user
  static async findCompletedByUserId(userId: number): Promise<OrderDetail[]> {
    const result = await query(
      `SELECT * FROM orders 
			 WHERE user_id = $1 AND status = 'complete'
			 ORDER BY created_at DESC`,
      [userId],
    );

    const orders: OrderDetail[] = [];

    for (const order of result.rows) {
      const items = await this.getItems(order.id);
      orders.push({ ...order, items });
    }

    return orders;
  }

  // Get all orders
  static async findAll(): Promise<OrderDetail[]> {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');

    const orders: OrderDetail[] = [];

    for (const order of result.rows) {
      const items = await this.getItems(order.id);
      orders.push({ ...order, items });
    }

    return orders;
  }

  // Update order status
  static async updateStatus(id: number, status: 'active' | 'complete'): Promise<Order | null> {
    const result = await query(
      `UPDATE orders
			 SET status = $1, updated_at = CURRENT_TIMESTAMP
			 WHERE id = $2
			 RETURNING *`,
      [status, id],
    );

    return result.rows[0] ?? null;
  }

  // Delete order
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM orders WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
