require('dotenv').config();

module.exports = {
  dev: {
    driver: 'pg',
    connectionString: process.env.DB_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  test: {
    driver: 'pg',
    connectionString: process.env.TEST_DB_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
};
