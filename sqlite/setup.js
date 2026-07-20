import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('workManager.db');

function initializeDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Subjects (
      subjectId INTEGER PRIMARY KEY AUTOINCREMENT,
      subjectName TEXT NOT NULL,
      teacherName TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Users (
      userId INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL UNIQUE,
      studentName TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Homework (
      HomeWorkId INTEGER PRIMARY KEY AUTOINCREMENT,
      HomeWorkName TEXT NOT NULL,
      deadline TEXT NOT NULL,
      subjectId INTEGER,
      userId INTEGER,
      FOREIGN KEY(subjectId) REFERENCES Subjects(subjectId),
      FOREIGN KEY(userId) REFERENCES Users(userId)
    );

    CREATE TABLE IF NOT EXISTS AuthorizedCredentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      passwordSalt TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export { db, initializeDatabase };
