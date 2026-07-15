// database.js
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('workManager.db');

// テーブル作成 
db.exec(`
PRAGMA foreign_keys = ON; 

-- 1. Subjects
CREATE TABLE IF NOT EXISTS Subjects(
  subjectId INTEGER PRIMARY KEY AUTOINCREMENT,
  subjectName TEXT NOT NULL,
  teacherName TEXT NOT NULL
);

-- 2. Users
CREATE TABLE IF NOT EXISTS Users(
  UserId INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER NOT NULL UNIQUE, 
  studentName TEXT NOT NULL
);

-- 3. Homework
CREATE TABLE IF NOT EXISTS Homework(
  HomeWorkId INTEGER PRIMARY KEY AUTOINCREMENT,
  HomeWorkName TEXT NOT NULL,
  limit TEXT NOT NULL,
  subjectId INTEGER,                
  UserId INTEGER,                    
  
  -- Foreign key
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
