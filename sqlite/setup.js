// database.js
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('workManager.db');

// テーブル作成 
db.exec(`
PRAGMA foreign_keys = ON; 

-- 1. Subjects（教科）テーブル
CREATE TABLE IF NOT EXISTS Subjects(
  SubjectsId INTEGER PRIMARY KEY AUTOINCREMENT,
  SubjectsName TEXT NOT NULL,
  TeacherName TEXT NOT NULL
);

-- 2. Users（生徒）テーブル
CREATE TABLE IF NOT EXISTS Users(
  UserId INTEGER PRIMARY KEY AUTOINCREMENT,
  StudentId INTEGER NOT NULL UNIQUE, 
  StudentName TEXT NOT NULL
);

-- 3. Homework（宿題）テーブル
CREATE TABLE IF NOT EXISTS Homework(
  HomeWorkId INTEGER PRIMARY KEY AUTOINCREMENT,
  HomeWorkName TEXT NOT NULL,
  Deadline TEXT NOT NULL,
  SubjectsId INTEGER,                
  UserId INTEGER,                    
  
  -- 外部キーの設定（つづりを正確に合わせる）
  FOREIGN KEY(SubjectsId) REFERENCES Subjects(SubjectsId),
  FOREIGN KEY(UserId) REFERENCES Users(UserId)
);
`);

// データの追加
const insert = db.prepare('INSERT INTO Users ( StudentId, StudentName) VALUES (?, ?)');
insert.run(114514, 'Martin');

// データの取得
const query = db.prepare('SELECT * FROM users');
console.log(query.all());