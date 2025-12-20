import { Pool, type PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { NODE_ENV } = process.env;

const pool = new Pool({
connectionString: process.env.DB_URL,
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

export const query = async (text: string, params?: unknown[]): Promise<any> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default pool;
