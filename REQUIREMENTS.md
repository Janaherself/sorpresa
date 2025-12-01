# Sorpresa API Requirements

## Overview

The Sorpresa API is a RESTful backend service for an online mystery package shop. It provides endpoints for browsing products, managing user accounts, and handling orders.

## API Endpoints

### Products

| Method | Endpoint                           | Description                 | Auth Required |
| ------ | ---------------------------------- | --------------------------- | ------------- |
| GET    | `/api/products`                    | List all products           | No            |
| GET    | `/api/products/:id`                | Get product details         | No            |
| GET    | `/api/products/category/:category` | Get products by category    | No            |
| GET    | `/api/products/popular/top-5`      | Get 5 most popular products | No            |
| POST   | `/api/products`                    | Create a new product        | Yes           |

### Users

| Method | Endpoint              | Description                                   | Auth Required |
| ------ | --------------------- | --------------------------------------------- | ------------- |
| POST   | `/api/users/register` | Register a new user                           | No            |
| POST   | `/api/users/login`    | Login user                                    | No            |
| GET    | `/api/users`          | List all users                                | Yes           |
| GET    | `/api/users/:id`      | Get user details with 5 most recent purchases | Yes           |

### Orders

| Method | Endpoint                | Description                   | Auth Required |
| ------ | ----------------------- | ----------------------------- | ------------- |
| POST   | `/api/orders`           | Create a new order (checkout) | Yes           |
| GET    | `/api/orders`           | Get all orders for user       | Yes           |
| GET    | `/api/orders/completed` | Get completed orders for user | Yes           |
| GET    | `/api/orders/:id`       | Get specific order details    | Yes           |

(Implementations in `src/routes/*`.)

## Database schema

- `users`:
  - `id` SERIAL PK
  - `first_name` VARCHAR(50) NOT NULL
  - `last_name` VARCHAR(50) NOT NULL
  - `email` VARCHAR(100) UNIQUE NOT NULL
  - `password_hash` VARCHAR(255)
  - `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  - `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

- `products`:
  - `id` SERIAL PK
  - `name` VARCHAR(50) NOT NULL
  - `description` TEXT NOT NULL
  - `price` DECIMAL(10, 2) NOT NULL
  - `category` VARCHAR(100) NOT NULL
  - `stock` INT NOT NULL
  - `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  - `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

- `orders`:
  - `id` SERIAL PK
  - `user_id` INT NOT NULL FK -> users(id)
  - `total_amount` DECIMAL NOT NULL
  - `status` VARCHAR(50) DEFAULT 'active' - active' or 'complete'
  - `customer_first_name` VARCHAR(100) NOT NULL
  - `customer_last_name` VARCHAR(100) NOT NULL
  - `customer_email` VARCHAR(255) NOT NULL
  - `customer_address` TEXT NOT NULL
  - `payment_method` VARCHAR(50) NOT NULL - 'cash_on_delivery' or 'card'
  - `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  - `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

- `order_items`:
  - `id` SERIAL PK
  - `order_id` INT FK NOT NULL -> orders(id)
  - `product_id` INT FK NOT NULL -> products(id)
  - `quantity` INT NOT NULL
  - `unit_price` DECIMAL NOT NULL
  - `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
