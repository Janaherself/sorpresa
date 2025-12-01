import type { Request, Response } from 'express';
import { ProductModel } from '../models/product.js';
import type { AuthRequest } from '../middlewares/auth.js';

export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await ProductModel.findAll();
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: (error as Error).message,
    });
  }
};

export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter: id',
      });
      return;
    }

    const productId = parseInt(id, 10);
    if (Number.isNaN(productId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid id parameter',
      });
      return;
    }

    const product = await ProductModel.findById(productId);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: (error as Error).message,
    });
  }
};

export const getProductByCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    if (!category) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter: category',
      });
      return;
    }
    const products = await ProductModel.findByCategory(category);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: (error as Error).message,
    });
  }
};

export const get5MostPopularProducts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await ProductModel.findTopPopular();

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular products',
      error: (error as Error).message,
    });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, stock, category } = req.body;

    if (
      !name ||
      !description ||
      typeof price !== 'number' ||
      typeof stock !== 'number' ||
      !category
    ) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, price, category',
      });
      return;
    }

    const product = await ProductModel.create(name, description, price, stock, category);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: (error as Error).message,
    });
  }
};
