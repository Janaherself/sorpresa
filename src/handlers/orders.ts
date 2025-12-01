import type { Response } from 'express';
import { OrderModel } from '../models/order.js';
import { ProductModel } from '../models/product.js';
import type { AuthRequest } from '../middlewares/auth.js';

// Helper function to calculate total from cart items
const calculateCartTotal = (
  items: Array<{ productId: number; quantity: number; unitPrice: number }>,
): number => {
  return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
};

export const placeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const {
      items,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerAddress,
      paymentMethod,
    } = req.body;

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.some((item) => item.quantity <= 0)
    ) {
      res.status(400).json({
        success: false,
        message: 'Order must contain at least one item with a positive quantity',
      });
      return;
    }

    if (
      !customerFirstName ||
      !customerLastName ||
      !customerEmail ||
      !customerAddress ||
      !paymentMethod
    ) {
      res.status(400).json({
        success: false,
        message:
          'Missing required fields: customerFirstName, customerLastName, customerEmail, customerAddress, paymentMethod',
      });
      return;
    }

    // Step 1: Load products & validate stock
    const itemsWithPrice = await Promise.all(
      items.map(async (item) => {
        const product = await ProductModel.findById(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ID ${item.productId}`);
        }
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      }),
    );

    // Step 2: Calculate total amount
    const totalAmount = calculateCartTotal(itemsWithPrice);

    // Step 3: Create order
    const order = await OrderModel.create(
      req.userId as number,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerAddress,
      totalAmount,
      paymentMethod,
    );

    // Step 4: Add products to order and decrease stock
    for (const item of itemsWithPrice) {
      await OrderModel.addProductsToOrder(order.id, item.productId, item.quantity, item.unitPrice);

      const stockUpdated = await ProductModel.decreaseStock(item.productId, item.quantity);
      if (!stockUpdated) {
        throw new Error(`Insufficient stock for product ID ${item.productId}`);
      }
    }

    // Step 5: Load final full order
    const createdOrder = await OrderModel.findById(order.id);

    res.status(201).json({
      success: true,
      data: createdOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: (error as Error).message,
    });
  }
};

export const getOrdersByUser = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await OrderModel.findByUserId(req.userId as number);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: (error as Error).message,
    });
  }
};

export const getCompletedOrdersByUser = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await OrderModel.findCompletedByUserId(req.userId as number);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed orders',
      error: (error as Error).message,
    });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Missing order id',
      });
      return;
    }

    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order id',
      });
      return;
    }

    const order = await OrderModel.findById(parsedId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: (error as Error).message,
    });
  }
};
