import { jest } from '@jest/globals';

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
  authMiddleware: (req: any, res: any, next: any) => next(),
}));

const { default: app } = await import('../../app.js');
const { ProductModel } = await import('../../models/product.js');
import { type Product } from '../../models/product.js';
import request from 'supertest';

describe('Products Routes', () => {
  const mockProductModel = ProductModel as jest.Mocked<typeof ProductModel>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Mystery Box',
          description: 'A surprise box',
          price: 29.99,
          stock: 3,
          category: 'mystery',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockProductModel.findAll.mockResolvedValueOnce(mockProducts);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by id', async () => {
      const mockProduct = {
        id: 1,
        name: 'Mystery Box',
        description: 'A surprise box',
        price: 29.99,
        stock: 3,
        category: 'mystery',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockProductModel.findById.mockResolvedValueOnce(mockProduct);

      const response = await request(app).get('/api/products/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 for non-existent product', async () => {
      mockProductModel.findById.mockResolvedValueOnce(null);

      const response = await request(app).get('/api/products/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/products/popular/top-5', () => {
    it('should return 5 most popular products', async () => {
      const mockPopularProducts = [
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

      mockProductModel.findTopPopular.mockResolvedValueOnce(
        mockPopularProducts as (Product & { total_orders: number })[],
      );

      const response = await request(app).get('/api/products/popular/top-5');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/products/:category', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return products for a valid category', async () => {
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Mystery Box',
          description: 'A surprise box',
          price: 29.99,
          stock: 3,
          category: 'mystery',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockProductModel.findByCategory.mockResolvedValueOnce(mockProducts);

      const response = await request(app).get('/api/products/category/mystery');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // convert dates to ISO strings
      expect(response.body.data).toEqual(
        mockProducts.map((p) => ({
          ...p,
          created_at: p.created_at.toISOString(),
          updated_at: p.updated_at.toISOString(),
        })),
      );
    });

    it('should return an empty array if no products exist for the category', async () => {
      mockProductModel.findByCategory.mockResolvedValueOnce([]);

      const response = await request(app).get('/api/products/category/unknown-category');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return 500 if ProductModel.findByCategory throws', async () => {
      mockProductModel.findByCategory.mockRejectedValueOnce(new Error('DB error'));

      const response = await request(app).get('/api/products/category/mystery');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to fetch products');
      expect(response.body.error).toBe('DB error');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product with valid token', async () => {
      const newProduct = {
        id: 1,
        name: 'New Mystery Box',
        description: 'A new surprise box',
        price: 39.99,
        stock: 5,
        category: 'mystery',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockProductModel.create.mockResolvedValueOnce(newProduct);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer valid_token`)
        .send({
          name: 'New Mystery Box',
          description: 'A new surprise box',
          price: 39.99,
          stock: 5,
          category: 'mystery',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer valid_token')
        .send({
          name: 'Incomplete Product',
          price: 19.99,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });
  });
});
