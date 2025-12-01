import { jest } from '@jest/globals';

jest.unstable_mockModule('../../models/user.js', () => ({
  UserModel: {
    create: jest.fn(),
    authenticate: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    findByIdWithPurchases: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.unstable_mockModule('../../middlewares/auth.js', () => ({
  authMiddleware: (req: any, res: any, next: any) => next(),
}));

const { default: app } = await import('../../app.js');
const { UserModel } = await import('../../models/user.js');
import request from 'supertest';

describe('Users Routes', () => {
  const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_hash: 'hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserModel.findByEmail.mockResolvedValueOnce(null);
      mockUserModel.create.mockResolvedValueOnce(mockUser);

      const response = await request(app).post('/api/users/register').send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should reject if email already exists', async () => {
      const existingUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_hash: 'hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserModel.findByEmail.mockResolvedValueOnce(existingUser);

      const response = await request(app).post('/api/users/register').send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/login', () => {
    it('should login a user with correct credentials', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_hash: 'hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserModel.authenticate.mockResolvedValueOnce(mockUser);

      const response = await request(app).post('/api/users/login').send({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should reject login with incorrect credentials', async () => {
      mockUserModel.authenticate.mockResolvedValueOnce(null);

      const response = await request(app).post('/api/users/login').send({
        email: 'john@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users', () => {
    it('should return all users with valid token', async () => {
      const mockUsers = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          password_hash: 'hashedpassword',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockUserModel.findAll.mockResolvedValueOnce(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer valid_token`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user with purchases', async () => {
      const mockUserData = {
        user: {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          password_hash: 'hashedpassword',
          created_at: new Date(),
          updated_at: new Date(),
        },
        purchases: [],
      };

      mockUserModel.findByIdWithPurchases.mockResolvedValueOnce(mockUserData);

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer valid_token`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
