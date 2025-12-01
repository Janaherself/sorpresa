## 🎁 Sorpresa – The API Full of (Good) Surprises

Welcome to Sorpresa, the backend API that powers your e-commerce dreams, nightmares, and everything in between.
Built with Node.js, TypeScript, Express, PostgreSQL, and enough caffeine to fuel a small city.

This README will walk you through installation, setup, running scripts, database configuration, and how not to turn using this API into the worst surprise ever.

The REQUIREMENTS.md will have all the API routes alongside a detailed database schema, don't forget to check it out!

---

### 🚀 Features (a.k.a What Sorpresa Can Do)

- 🧩 Modular TypeScript architecture

- 🛒 Supports products, orders, categories, users & authentication

- 🔑 Secure JWT-based login

- 🧂 Password hashing & salting with bcrypt

- 🧪 Jest tests with watch mode

- 🐘 PostgreSQL integration + migrations + seeds

- 🌍 CORS configuration so your frontend won’t scream at you

- 😎 Runs on ports that won't clash with your entire OS

- _`API: 3000,  Database: 5432`_

---

### 🛠️ Installation

1. **Clone the repo** (feel free to pretend it was your idea):

- `git clone https://github.com/your-user/sorpresa.git`

- `cd sorpresa`

2. **Install dependencies:**

- `npm install`

---

### 🗄️ Database Setup (PostgreSQL)

Sorpresa uses PostgreSQL — because real databases use ducks as mascots.

1️⃣ **Create your databases (normal + test)**

- `CREATE DATABASE sorpresa;`
- `CREATE DATABASE sorpresa_test;`

2️⃣ **Create a user (optional but highly recommended)**

- `CREATE USER sorpresa_user WITH PASSWORD 'supersecurepassword'`
- `GRANT ALL PRIVILEGES ON DATABASE sorpresa TO sorpresa_user;`
- `GRANT ALL PRIVILEGES ON DATABASE sorpresa_test TO sorpresa_user;`

3️⃣ **Run migrations**

- `npm run db:migrate:up`

4️⃣ **(Optional) Seed the database**

- `npm run db:seed`

---

### 🔧 Environment Variables (.env)

Create a .env file in the project root.  
Here’s a comfy template to get you started:

##### **_Server Configuration_**

NODE_ENV=development  
SERVER_PORT=3000

##### **_Postgres_**

DB_HOST=localhost  
DB_PORT=5432  
DB_NAME=  
DB_USER=  
DB_PASSWORD=

##### **_Test DB (only used during tests)_**

TEST_DB_NAME=

##### **_JWT Configuration_**

JWT_SECRET=  
JWT_EXPIRATION=

##### **_CORS Configuration_**

CORS_ORIGIN=http://localhost:4200

##### **_Bcrypt Configuration_**

BCRYPT_ROUNDS=10

_If anything breaks, it's probably because you forgot to fill this in.
Don't worry — happens to the best of us._

---

### 📦 Available NPM Scripts

This project comes with a couble of scripts:

| Script          | Command                                                                                 | Description                                               |
| --------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| start           | nodemon dist/server.js                                                                  | Runs the built server with auto-reload                    |
| dev             | ts-node src/server.ts                                                                   | Runs the server in development mode (TypeScript directly) |
| format          | prettier . --write                                                                      | Formats the code base with prettier                       |
| build           | tsc                                                                                     | Compiles TypeScript to JavaScript                         |
| test            | node --experimental-vm-modules node_modules/jest/bin/jest.js                            | Runs Jest tests once                                      |
| test:watch      | node --experimental-vm-modules node_modules/jest/bin/jest.js --watch                    | Continuous test mode                                      |
| db:migrate:up   | db-migrate up --config database.cjs --env dev --verbose --migrations-dir ./migrations   | Applies migrations                                        |
| db:migrate:down | db-migrate down --config database.cjs --env dev --verbose --migrations-dir ./migrations | Rolls back last migration                                 |
| db:seed         | node dist/database/seed.js | Seeds the database  |

---

### ▶️ Running the API

`npm run build`  
`npm start`

Once running, the API will be available at:

http://localhost:3000

---

### 🧪 Running Tests

_Test everything. Trust nothing._

**Run tests:**  
`npm test`

**Watch tests:**  
`npm run test:watch`

---

### 🧬 Project Structure
├── migrations/  
├── package.json  
├── tsconfic.json  
├── README.md  
├── REQUIREMENTS.md  
├── src/    
├──── routes/  
├──── handlers/  
├──── models/  
├──── middlewares/  
├──── database/  
├──── utils/  
├──── config/  
├──── specs/  
├──── app.ts  
├──── server.ts    

---

> **_If you get lost, don’t worry — even the source code gets lost sometimes._**

---

### ❤️ Final Notes

> this API was built with too much caffeine, so if anything goes wrong, it's on the caffeine not me :)

_Enjoy building with Sorpresa, and may your bugs be tiny and your console.logs helpful 🙌🏻_
