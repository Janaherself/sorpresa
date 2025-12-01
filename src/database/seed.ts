import dotenv from 'dotenv';
import { query } from '../config/database.js';
import { ProductModel } from '../models/product.js';
import { UserModel } from '../models/user.js';

dotenv.config();

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await query('DELETE FROM order_items');
    await query('DELETE FROM orders');
    await query('DELETE FROM products');
    await query('DELETE FROM users');

    // Create sample users
    console.log('👥 Creating sample users...');
    const user1 = await UserModel.create('John', 'Doe', 'john@example.com', 'password123');
    const user2 = await UserModel.create('Jane', 'Smith', 'jane@example.com', 'password456');
    console.log(`✅ Created ${user1.id} and ${user2.id}`);

    // Create sample products (mystery packages)
    console.log('🎁 Creating sample mystery packages...');
    const products = [
      {
        name: 'Mystery Box Deluxe',
        description: 'A surprise collection of premium items worth 3x the price! ',
        price: 49.99,
        stock: 70,
        category: 'mystery',
      },
      {
        name: 'Mystery Bundle Classic',
        description: 'Curated selection of everyday treasures and surprises.',
        price: 29.99,
        stock: 50,
        category: 'mystery',
      },
      {
        name: 'Mystery Grab Bag',
        description: "Spontaneous collection of random goodies - you never know what you'll get!",
        price: 19.99,
        stock: 40,
        category: 'mystery',
      },
      {
        name: 'Mystery Mega Pack',
        description: 'The ultimate surprise package with the most variety!',
        price: 79.99,
        stock: 30,
        category: 'mystery',
      },
      {
        name: 'Mystery Quick Pick',
        description: 'A small but mighty bag of surprises.',
        price: 14.99,
        stock: 25,
        category: 'mystery',
      },
      {
        name: 'Mystery Luxury Collection',
        description: 'Premium mystery items for the discerning collector.',
        price: 99.99,
        stock: 20,
        category: 'mystery',
      },
      {
        name: 'Mystery Gadget Box',
        description: 'Tech surprises and fun gadgets await!',
        price: 39.99,
        stock: 35,
        category: 'mystery',
      },
      {
        name: 'Mystery Entertainment Pack',
        description: 'Games, puzzles, and fun surprises for the whole family.',
        price: 34.99,
        stock: 30,
        category: 'mystery',
      },
      {
        name: 'Mystery Lifestyle Bundle',
        description: 'Lifestyle and wellness surprises curated just for you.',
        price: 44.99,
        stock: 45,
        category: 'mystery',
      },
      {
        name: "Mystery Artist's Palette",
        description: 'Creative supplies and art-related surprises.',
        price: 54.99,
        stock: 15,
        category: 'mystery',
      },
      {
        name: "Mystery Book Lover's Box",
        description: 'Literary treasures and reading-related surprises.',
        price: 39.99,
        stock: 66,
        category: 'mystery',
      },
      {
        name: 'Mystery Foodie Feast',
        description: 'Gourmet treats and culinary surprises from around the world.',
        price: 59.99,
        stock: 55,
        category: 'mystery',
      },
      {
        name: 'Mystery Office Essentials',
        description: 'Useful and fun items to spruce up your workspace.',
        price: 24.99,
        stock: 42,
        category: 'mystery',
      },
      {
        name: 'Mystery Home Comfort',
        description: 'Cozy items and home surprises for comfort lovers.',
        price: 69.99,
        stock: 36,
        category: 'mystery',
      },
      {
        name: 'Mystery Travel Buddy',
        description: 'Travel accessories and adventure-ready surprises.',
        price: 44.99,
        stock: 28,
        category: 'mystery',
      },
    ];

    for (const productData of products) {
      await ProductModel.create(
        productData.name,
        productData.description,
        productData.price,
        productData.stock,
        productData.category,
      );
    }
    console.log(`✅ Created ${products.length} mystery packages`);

    console.log('✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
