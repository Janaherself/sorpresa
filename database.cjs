const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
});

module.exports = {
  dev: {
    driver: 'pg',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  test: {
    driver: 'pg',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.TEST_DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
};
