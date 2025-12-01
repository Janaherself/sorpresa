import { Router } from 'express';
import * as ProductHandler from '../handlers/products.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// GET /products - List all products (public)
router.get('/', ProductHandler.listProducts);

// GET /products/:id - Get product details (public)
router.get('/:id', ProductHandler.getProductById);

// GET /products/category/:category - Get products by category (public)
router.get('/category/:category', ProductHandler.getProductByCategory);

// GET /products/popular/top-5 - Get 5 most popular products (public)
router.get('/popular/top-5', ProductHandler.get5MostPopularProducts);

// POST /products - Create new product (auth required)
router.post('/', authMiddleware, ProductHandler.createProduct);

export default router;
