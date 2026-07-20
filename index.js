import express from 'express';
import session from 'express-session';
import routes from './routes/index.js';
import { getHomeworkList, initializeDatabase } from './sqlite/setup.js';

initializeDatabase();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.static('ui'));

app.get('/api/homework', (req, res) => {

try{
  const data= getHomeworkList();
  res.json(data);
}catch(error){
  res.status(500).json({ error: "DBエラー"});
}
});

app.use('/', routes);

app.listen(3000, () => {
  console.log("http://127.0.0.1:3000");
});