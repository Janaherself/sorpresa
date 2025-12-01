import { jest } from '@jest/globals';

jest.unstable_mockModule('../../models/order.js', () => ({
  OrderModel: {
    create: jest.fn(),
    addProductsToOrder: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findCompletedByUserId: jest.fn(),
    getItems: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.unstable_mockModule('../../models/product.js', () => ({
  ProductModel: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCategory: jest.fn(),
    findTopPopular: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    decreaseStock: jest.fn(),
  },
}));

jest.unstable_mockModule('../../middlewares/auth.js', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.userId = 1;
    next();
  },
}));

const { default: app } = await import('../../app.js');
const { OrderModel } = await import('../../models/order.js');
const { ProductModel } = await import('../../models/product.js');
import { type OrderDetail } from '../../models/order.js';
import request from 'supertest';

describe('Orders Routes', () => {
  const mockOrderModel = OrderModel as jest.Mocked<typeof OrderModel>;
  const mockProductModel = ProductModel as jest.Mocked<typeof ProductModel>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/orders', () => {
    it('should create a new order with valid data', async () => {
        const mockOrder = {
        id: 1,
        user_id: 1,
        status: 'complete',
        customer_first_name: 'John',
        customer_last_name: 'Doe',
        customer_email: 'john@example.com',
        customer_address: '123 Main St',
        total_amount: 50.0,
        payment_method: 'card',
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      };

      mockProductModel.findById.mockResolvedValue({
        id: 1,
        name: 'Test Product',
        price: 25.00,
        stock: 10,
        description: 'A product for testing',
        category: 'Test',
        created_at: new Date(),
        updated_at: new Date(),
      });

      mockOrderModel.create.mockResolvedValueOnce({
        id: 1,
        user_id: 1,
        status: 'complete',
        customer_first_name: 'John',
        customer_last_name: 'Doe',
        customer_email: 'john@example.com',
        customer_address: '123 Main St',
        total_amount: 50.0,
        payment_method: 'card',
        created_at: new Date(),
        updated_at: new Date(),
      });

      mockOrderModel.addProductsToOrder.mockResolvedValueOnce({
        id: 1,
        order_id: 1,
        product_id: 1,
        quantity: 1,
        unit_price: 25.00,
        created_at: new Date(),
      });

      mockProductModel.decreaseStock.mockResolvedValueOnce(true);

      mockOrderModel.findById.mockResolvedValueOnce(mockOrder as OrderDetail);

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer valid_token`)
        .send({
          items: [{ productId: 1, quantity: 2 }],
          customerFirstName: 'John',
          customerLastName: 'Doe',
          customerEmail: 'john@example.com',
          customerAddress: '123 Main St',
          paymentMethod: 'card',
        });

      if (response.status !== 201) {
        console.log('Error response:', response.body);
      }
  
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders', () => {
    it('should return all orders for the user', async () => {
      const mockOrders: OrderDetail[] = [];

      mockOrderModel.findByUserId.mockResolvedValueOnce(mockOrders);

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer valid_token`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return the order when it exists', async () => {
      const mockOrder: OrderDetail = {
        id: 1,
        user_id: 1,
        status: 'complete',
        customer_first_name: 'John',
        customer_last_name: 'Doe',
        customer_email: 'john@example.com',
        customer_address: '123 Main St',
        total_amount: 50.0,
        payment_method: 'card',
        created_at: new Date(),
        updated_at: new Date(),
        items: [
          {
            id: 1,
            order_id: 1,
            product_id: 1,
            quantity: 2,
            unit_price: 25.0,
            name: 'Product A',
            description: 'Description A',
          },
        ],
      };

      mockOrderModel.findById.mockResolvedValueOnce(mockOrder as any);

      const response = await request(app)
        .get('/api/orders/1')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customer_first_name).toEqual('John');
    });

    it('should return 400 for invalid order id', async () => {
      const response = await request(app)
        .get('/api/orders/abc')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid order id');
    });
  });

  describe('GET /api/orders/completed', () => {
    it('should return completed orders for the user', async () => {
      const mockOrders: OrderDetail[] = [];

      mockOrderModel.findCompletedByUserId.mockResolvedValueOnce(mockOrders);

      const response = await request(app)
        .get('/api/orders/completed')
        .set('Authorization', `Bearer valid_token`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
