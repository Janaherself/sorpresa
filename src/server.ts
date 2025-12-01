import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();
const port = process.env.SERVER_PORT;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
