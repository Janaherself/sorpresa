import { jest } from '@jest/globals';

jest.unstable_mockModule('../../config/database.js', () => ({
  query: jest.fn(),
}));

const { query } = await import('../../config/database.js');
const { ProductModel } = await import('../../models/product.js');

describe('ProductModel', () => {
  const mockQuery = query as jest.MockedFunction<typeof query>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const mockProduct = {
        id: 1,
        name: 'Mystery Box',
        description: 'A surprise box',
        price: 29.99,
        category: 'mystery',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 });

      const result = await ProductModel.create(
        'Mystery Box',
        'A surprise box',
        29.99,
        3,
        'mystery',
      );

      expect(result.name).toBe('Mystery Box');
      expect(result.price).toBe(29.99);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Mystery Box',
          description: 'A surprise box',
          price: 29.99,
          category: 'mystery',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockProducts, rowCount: 1 });

      const result = await ProductModel.findAll();

      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('Mystery Box');
    });
  });

  describe('findById', () => {
    it('should find product by id', async () => {
      const mockProduct = {
        id: 1,
        name: 'Mystery Box',
        description: 'A surprise box',
        price: 29.99,
        category: 'mystery',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 });

      const result = await ProductModel.findById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });

    it('should return null if product not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await ProductModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByCategory', () => {
    it('should find products by category', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Mystery Box',
          description: 'A surprise box',
          price: 29.99,
          category: 'mystery',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockProducts, rowCount: 1 });

      const result = await ProductModel.findByCategory('mystery');

      expect(result.length).toBe(1);
      expect(result[0]!.category).toBe('mystery');
    });
  });

  describe('findTopPopular', () => {
    it('should return 5 most popular products', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Mystery Box',
          description: 'A surprise box',
          price: 29.99,
          category: 'mystery',
          total_orders: 50,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockProducts, rowCount: 1 });

      const result = await ProductModel.findTopPopular();

      expect(result[0]!.total_orders).toBe(50);
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      const mockProduct = {
        id: 1,
        name: 'Updated Mystery Box',
        description: 'Updated box',
        price: 39.99,
        category: 'mystery',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 });

      const result = await ProductModel.update(
        1,
        'Updated Mystery Box',
        'Updated box',
        39.99,
        1,
        'mystery',
      );

      expect(result?.name).toBe('Updated Mystery Box');
    });
  });

  describe('delete', () => {
    it('should delete product', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await ProductModel.delete(1);

      expect(result).toBe(true);
    });
  });

  describe('decreaseStock', () => {
    it('should decrease stock if enough quantity is available', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ stock: 5 }], rowCount: 1 });

      const result = await ProductModel.decreaseStock(1, 2);

      expect(result).toBe(true);
    });

    it('should return false if stock is insufficient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await ProductModel.decreaseStock(1, 10);

      expect(result).toBe(false);
    });
  });
});
