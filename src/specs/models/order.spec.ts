import { jest } from '@jest/globals';

jest.unstable_mockModule('../../config/database.js', () => ({
  query: jest.fn(),
}));

const { query } = await import('../../config/database.js');
const { OrderModel } = await import('../../models/order.js');
import type { Product } from '../../models/product.js';
import type { OrderDetail } from '../../models/order.js';

describe('OrderModel', () => {
  const mockQuery = query as jest.MockedFunction<typeof query>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const mockOrder = {
        id: 1,
        user_id: 1,
        status: 'complete',
        customer_first_name: 'John',
        customer_last_name: 'Doe',
        customer_email: 'john@example.com',
        customer_address: '123 Main St',
        payment_method: 'card',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockOrder], rowCount: 1 });

      const result = await OrderModel.create(
        1,
        'John',
        'Doe',
        'john@example.com',
        '123 Main St',
        120.5,
        'card',
      );

      expect(result.user_id).toBe(1);
      expect(result.status).toBe('complete');
    });
  });

  describe('addProductsToOrder', () => {
    it('should add product to order', async () => {
      const mockOrderProduct = {
        id: 1,
        order_id: 1,
        product_id: 1,
        quantity: 2,
        unit_price: 29.99,
        created_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockOrderProduct], rowCount: 1 });

      const result = await OrderModel.addProductsToOrder(1, 1, 2, 29.99);

      expect(result.quantity).toBe(2);
      expect(result.unit_price).toBe(29.99);
    });
  });

  describe('findById', () => {
    it('should find order by id with products', async () => {
      const mockOrder = {
        id: 1,
        user_id: 1,
        status: 'complete',
        customer_first_name: 'John',
        customer_last_name: 'Doe',
        customer_email: 'john@example.com',
        customer_address: '123 Main St',
        payment_method: 'card',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockProducts: Product[] = [];

      mockQuery
        .mockResolvedValueOnce({ rows: [mockOrder], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockProducts, rowCount: 0 });

      const result = await OrderModel.findById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });
  });

  describe('findByUserId', () => {
    it('should find all orders by user id', async () => {
      const mockOrders = [
        {
          id: 1,
          user_id: 1,
          status: 'complete',
          customer_first_name: 'John',
          customer_last_name: 'Doe',
          customer_email: 'john@example.com',
          customer_address: '123 Main St',
          payment_method: 'card',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockOrders, rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      console.log(mockQuery.mock.calls.length);

      const result = await OrderModel.findByUserId(1);

      expect(result.length).toBe(1);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 1,
        user_id: 1,
        status: 'complete',
        customer_first_name: 'John',
        customer_last_name: 'Doe',
        customer_email: 'john@example.com',
        customer_address: '123 Main St',
        payment_method: 'card',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockOrder], rowCount: 1 });

      const result = await OrderModel.updateStatus(1, 'complete');

      expect(result?.status).toBe('complete');
    });
  });

  describe('delete', () => {
    it('should delete order', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await OrderModel.delete(1);

      expect(result).toBe(true);
    });
  });

  describe('getItems', () => {
    it('should return all items for an order', async () => {
      const mockItems = [
        {
          id: 1,
          order_id: 1,
          product_id: 10,
          quantity: 2,
          unit_price: 19.99,
          name: 'Product A',
          description: 'Desc A',
        },
        {
          id: 2,
          order_id: 1,
          product_id: 11,
          quantity: 1,
          unit_price: 29.99,
          name: 'Product B',
          description: 'Desc B',
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockItems,
        rowCount: mockItems.length,
      });

      const result = await OrderModel.getItems(1);

      expect(result.length).toBe(2);
      expect(result[0]?.product_id).toBe(10);
      expect(result[1]?.name).toBe('Product B');
    });
  });

  describe('findCompletedByUserId', () => {
    it('should return completed orders with their items for a given user', async () => {
      const mockOrders = [
        {
          id: 1,
          user_id: 5,
          status: 'complete',
          customer_first_name: 'John',
          customer_last_name: 'Doe',
          customer_email: 'john@example.com',
          customer_address: '123 Main St',
          payment_method: 'card',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockItems = [
        {
          id: 1,
          order_id: 1,
          product_id: 10,
          quantity: 2,
          unit_price: 20,
          name: 'Prod',
          description: 'desc',
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockOrders,
        rowCount: 1,
      });

      OrderModel.getItems = jest
        .fn<(orderId: number) => Promise<OrderDetail['items']>>()
        .mockResolvedValueOnce(mockItems);

      const result = await OrderModel.findCompletedByUserId(5);

      expect(result.length).toBe(1);
      expect(result[0]?.items[0]!.id).toBe(1);
      expect(result[0]?.items[0]!.product_id).toBe(10);
    });
  });

  describe('findAll', () => {
    it('should return all orders with their items', async () => {
      const mockOrders = [
        { id: 1, user_id: 1, status: 'complete', created_at: new Date(), updated_at: new Date() },
        { id: 2, user_id: 2, status: 'active', created_at: new Date(), updated_at: new Date() },
      ];

      const mockItems1 = [
        {
          id: 1,
          order_id: 1,
          product_id: 11,
          quantity: 1,
          unit_price: 10,
          name: 'Item A',
          description: '',
        },
      ];

      const mockItems2 = [
        {
          id: 2,
          order_id: 2,
          product_id: 22,
          quantity: 3,
          unit_price: 15,
          name: 'Item B',
          description: '',
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockOrders,
        rowCount: 2,
      });

      OrderModel.getItems = jest
        .fn<(orderId: number) => Promise<OrderDetail['items']>>()
        .mockResolvedValueOnce(mockItems1)
        .mockResolvedValueOnce(mockItems2);

      const result = await OrderModel.findAll();

      expect(result.length).toBe(2);
      expect(result[0]?.items[0]!.product_id).toBe(11);
    });
  });
});
