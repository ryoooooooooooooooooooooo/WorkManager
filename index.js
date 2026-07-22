import express from 'express';
import session from 'express-session';
import routes from './routes/index.js';
import { getHomeworkList, initializeDatabase, getHomeworkListFiltered, saveHomework } from './sqlite/setup.js';

initializeDatabase();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.static('ui'));

app.get('/api/homework', (req, res) => {
  try{
    const subject = req.query.subject;
    const teacher = req.query.teacher;
    const data = getHomeworkListFiltered(subject, teacher);
    res.json(data);
  }catch(error){
    res.status(500).json({ error: "DBエラー"});
  }
});

app.post('/api/homework', (req, res) => {
  try{
    const { homeWorkName, deadline, subject, teacher } = req.body;
    // require authenticated session and student id
    const studentId = req.session?.student_id || null;
    if(!studentId){
      return res.status(401).json({ error: '認証が必要です' });
    }

    if(!homeWorkName || !deadline || !subject){
      return res.status(400).json({ error: '必要なフィールドが不足しています' });
    }

    // server-side deadline validation: must be future
    const dl = new Date(deadline);
    if(isNaN(dl.getTime()) || dl.getTime() <= Date.now()){
      return res.status(400).json({ error: '提出期限は現在より未来を指定してください' });
    }

    const result = saveHomework(homeWorkName, deadline, subject, teacher || '', studentId);
    if(result.success){
      return res.json({ success: true, id: result.lastInsertRowid });
    }
    return res.status(500).json({ error: result.message || 'DBに保存できませんでした' });
  }catch(error){
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.use('/', routes);

app.listen(3000, () => {
  console.log("http://127.0.0.1:3000");
});