import { execSync } from 'child_process';
import pool from '../config/database.js';

export const resetTestDatabase = async () => {
  // Drop all tables and rerun migrations
  console.log('Resetting test database...');
  execSync(
    'db-migrate down --config database.cjs --env test --verbose --migrations-dir ./migrations',
    { stdio: 'inherit' }
  );
  execSync(
    'db-migrate up --config database.cjs --env test --verbose --migrations-dir ./migrations',
    { stdio: 'inherit' }
  );
};

export const closeTestDatabase = async () => {
  await pool.end();
};
