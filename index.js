import express from 'express';
import routes from './routes/index.js';
import { initializeDatabase } from './sqlite/setup.js';

initializeDatabase();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use('/', routes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
})