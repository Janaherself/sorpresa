import { jest } from '@jest/globals';

jest.unstable_mockModule('../../config/database.js', () => ({
  query: jest.fn(),
}));

const { query } = await import('../../config/database.js');
const { UserModel } = await import('../../models/user.js');
import bcrypt from 'bcrypt';

describe('UserModel', () => {
  const mockQuery = query as jest.MockedFunction<typeof query>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_hash: 'hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

      const result = await UserModel.create('John', 'Doe', 'john@example.com', 'password123');

      expect(result.email).toBe('john@example.com');
      expect(result.password_hash).not.toBe('password123');
    });
  });

  describe('authenticate', () => {
    it('should authenticate user with correct password', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_hash: '$2b$10$hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true) as Promise<boolean>);

      const result = await UserModel.authenticate('john@example.com', 'password123');

      expect(result).not.toBeNull();
    });

    it('should not authenticate user with incorrect password', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_hash: '$2b$10$hashedpassword', // mocked bcrypt hash
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

      // Mock bcrypt.compare to return false for incorrect password
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false) as Promise<boolean>);

      const result = await UserModel.authenticate('john@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await UserModel.authenticate('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_digest: 'hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

      const result = await UserModel.findById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });

    it('should return null if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await UserModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_hash: 'hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

      const result = await UserModel.findByEmail('john@example.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('john@example.com');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockUsers, rowCount: 2 });

      const result = await UserModel.findAll();

      expect(result.length).toBe(2);
      expect(result[0]!.email).toBe('john@example.com');
    });
  });

  describe('update', () => {
    it('should update user information', async () => {
      const mockUser = {
        id: 1,
        first_name: 'Johnny',
        last_name: 'Doe',
        email: 'john@example.com',
        password_digest: 'hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

      const result = await UserModel.update(1, 'Johnny', 'Doe');

      expect(result).not.toBeNull();
      expect(result?.first_name).toBe('Johnny');
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await UserModel.delete(1);

      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      const result = await UserModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('findByIdWithPurchases', () => {
    it('should return user with recent purchases', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockPurchases = [
        {
          id: 101,
          status: 'complete',
          customer_first_name: 'John',
          customer_last_name: 'Doe',
          total_amount: 99.99,
          created_at: new Date(),
          products: [
            { id: 1, name: 'Product A', quantity: 2, unit_price: 10 },
            { id: 2, name: 'Product B', quantity: 1, unit_price: 79.99 },
          ],
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });
      mockQuery.mockResolvedValueOnce({ rows: mockPurchases, rowCount: mockPurchases.length });

      const result = await UserModel.findByIdWithPurchases(1);

      expect(result).not.toBeNull();
      expect(result?.user.id).toBe(1);
      expect(result?.purchases.length).toBe(1);
      expect(result?.purchases[0]?.products.length).toBe(2);
      expect(result?.purchases[0]?.products[0]?.name).toBe('Product A');
    });

    it('should return null if user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await UserModel.findByIdWithPurchases(999);

      expect(result).toBeNull();
    });
  });
});
