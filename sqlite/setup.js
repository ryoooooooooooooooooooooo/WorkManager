// database.js
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('workManager.db');

// テーブル作成
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )
`);

// データの追加
const insert = db.prepare('INSERT INTO users (name) VALUES (?)');
insert.run('山田太郎');

// データの取得
const query = db.prepare('SELECT * FROM users');
console.log(query.all());