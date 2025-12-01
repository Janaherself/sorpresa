import { Router } from 'express';
import * as orderHandler from '../handlers/orders.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// POST /orders - Create new order (checkout) (auth required)
router.post('/', authMiddleware, orderHandler.placeOrder);

// GET /orders - Get all orders by user (auth required)
router.get('/', authMiddleware, orderHandler.getOrdersByUser);

// GET /orders/completed - Get completed orders by user (auth required)
router.get('/completed', authMiddleware, orderHandler.getCompletedOrdersByUser);

// GET /orders/:id - Get specific order (auth required)
router.get('/:id', authMiddleware, orderHandler.getOrderById);

export default router;
