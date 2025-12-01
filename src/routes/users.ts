import { Router } from 'express';
import * as userHandler from '../handlers/users.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// POST /users/register - Create new user
router.post('/register', userHandler.createUser);

// POST /users/login - Authenticate user
router.post('/login', userHandler.authenticateUser);

// GET /users - List all users (auth required)
router.get('/', authMiddleware, userHandler.listUsers);

// GET /users/:id - Get user with purchases (auth required)
router.get('/:id', authMiddleware, userHandler.getUserWithPurchases);

export default router;
