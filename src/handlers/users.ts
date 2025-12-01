import type { Request, Response } from 'express';
import { UserModel } from '../models/user.js';
import type { AuthRequest } from '../middlewares/auth.js';
import { generateToken } from '../utils/jwt.js';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, password',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    const user = await UserModel.create(firstName, lastName, email, password);
    const token = generateToken({ id: user.id, email: user.email });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: (error as Error).message,
    });
  }
};

export const authenticateUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password',
      });
      return;
    }

    const user = await UserModel.authenticate(email, password);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email });

    res.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to login user',
      error: (error as Error).message,
    });
  }
};

export const listUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UserModel.findAll();

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: (error as Error).message,
    });
  }
};

export const getUserWithPurchases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Missing required param: id',
      });
      return;
    }

    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user id',
      });
      return;
    }

    const result = await UserModel.findByIdWithPurchases(userId);

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          email: result.user.email,
        },
        purchases: result.purchases.map((p) => ({
          id: p.id,
          status: p.status,
          customerFirstName: p.customer_first_name,
          customerLastName: p.customer_last_name,
          createdAt: p.created_at,
          total: p.total,
          products: p.products,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: (error as Error).message,
    });
  }
};
