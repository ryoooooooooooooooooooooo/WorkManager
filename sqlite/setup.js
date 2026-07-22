import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('workManager.db');

function initializeDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Subjects (
      subjectId INTEGER PRIMARY KEY AUTOINCREMENT,
      subjectName TEXT NOT NULL,
      teacherName TEXT NOT NULL,
      UNIQUE(subjectName, teacherName)
    );

    CREATE TABLE IF NOT EXISTS AuthorizedCredentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      passwordSalt TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Users (
      userId INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL UNIQUE,
      studentName TEXT NOT NULL,
      FOREIGN KEY(studentId) REFERENCES AuthorizedCredentials(studentId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS UserSubjects (
      userSubjectId INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      subjectId INTEGER NOT NULL,
      syncedAt TEXT NOT NULL,
      UNIQUE(userId, subjectId),
      FOREIGN KEY(userId) REFERENCES Users(userId) ON DELETE CASCADE,
      FOREIGN KEY(subjectId) REFERENCES Subjects(subjectId) ON DELETE CASCADE
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
  `);

  const usersColumns = db.prepare("PRAGMA table_info('Users');").all();
  if (!usersColumns.some(col => col.name === 'studentName')) {
    db.exec("ALTER TABLE Users ADD COLUMN studentName TEXT NOT NULL DEFAULT '';");
  }
}

function getHomeworkList(){
  const query = db.prepare(`
    SELECT
      h.HomeWorkId, 
      h.HomeWorkName, 
      h.deadline, 
      s.subjectName, 
      s.teacherName, 
      u.studentName 
    FROM Homework h
    INNER JOIN Subjects s ON h.subjectId = s.subjectId
    INNER JOIN Users u ON h.userId = u.userId;
    `);

    return query.all();
}

function getHomeworkListFiltered(subjectName, teacherName){
  let query;
  if(subjectName && teacherName){
    query = db.prepare(`
      SELECT
        h.HomeWorkId,
        h.HomeWorkName,
        h.deadline,
        s.subjectName,
        s.teacherName,
        u.studentName
      FROM Homework h
      INNER JOIN Subjects s ON h.subjectId = s.subjectId
      INNER JOIN Users u ON h.userId = u.userId
      WHERE s.subjectName = ? AND s.teacherName = ?
      `);
    return query.all(subjectName, teacherName);
  }
  if(subjectName){
    query = db.prepare(`
      SELECT
        h.HomeWorkId,
        h.HomeWorkName,
        h.deadline,
        s.subjectName,
        s.teacherName,
        u.studentName
      FROM Homework h
      INNER JOIN Subjects s ON h.subjectId = s.subjectId
      INNER JOIN Users u ON h.userId = u.userId
      WHERE s.subjectName = ?
      `);
    return query.all(subjectName);
  }
  return getHomeworkList();
}

function saveHomework(homeWorkName, deadline, subjectName, teacherName, studentId){
  if(!homeWorkName || !deadline || !subjectName) return { success: false, message: 'invalid input' };

  // ensure subject exists
  saveSubject(subjectName, teacherName || '');
  const subjectId = getSubjectId(subjectName, teacherName || '');
  if(!subjectId) return { success: false, message: 'subject not found' };

  // ensure user exists
  let userId = getUserIdByStudentId(studentId);
  if(!userId){
    userId = ensureUserByStudentId(studentId);
  }

  const stmt = db.prepare(
    `INSERT INTO Homework (HomeWorkName, deadline, subjectId, userId) VALUES (?, ?, ?, ?)`
  );
  const result = stmt.run(homeWorkName, deadline, subjectId, userId);
  return { success: result.changes > 0, lastInsertRowid: result.lastInsertRowid };
}

function getEnrollingSubjectsByStudentId(studentId) {
  const query = db.prepare(`
    SELECT s.subjectName AS subject, s.teacherName AS teacher
    FROM UserSubjects us
    INNER JOIN Users u ON us.userId = u.userId
    INNER JOIN Subjects s ON us.subjectId = s.subjectId
    WHERE u.studentId = ?
    ORDER BY us.syncedAt DESC
  `);
  return query.all(studentId);
}

function saveSubject(subjectName, teacherName) {
  const stmt = db.prepare(
    `INSERT INTO Subjects (subjectName, teacherName)
     SELECT ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM Subjects WHERE subjectName = ? AND teacherName = ?
     );`
  );
  const result = stmt.run(subjectName, teacherName, subjectName, teacherName);
  return result.changes > 0;
}

function saveSubjects(subjectsWithTeachers) {
  const results = [];
  for (const { subject, teacher } of subjectsWithTeachers) {
    if (!subject || !teacher) {
      results.push({ subject, teacher, saved: false });
      continue;
    }
    const saved = saveSubject(subject, teacher);
    results.push({ subject, teacher, saved });
  }
  return results;
}

function saveUserSubject(userId, subjectId) {
  const stmt = db.prepare(
    `INSERT INTO UserSubjects (userId, subjectId, syncedAt)
     SELECT ?, ?, CURRENT_TIMESTAMP
     WHERE NOT EXISTS (
       SELECT 1 FROM UserSubjects WHERE userId = ? AND subjectId = ?
     );`
  );
  const result = stmt.run(userId, subjectId, userId, subjectId);
  return result.changes > 0;
}

function saveUserSubjects(userId, subjectIds) {
  const results = [];
  for (const subjectId of subjectIds) {
    const saved = saveUserSubject(userId, subjectId);
    results.push({ subjectId, saved });
  }
  return results;
}

function getSubjectId(subjectName, teacherName) {
  const row = db.prepare(
    'SELECT subjectId FROM Subjects WHERE subjectName = ? AND teacherName = ?'
  ).get(subjectName, teacherName);
  return row ? row.subjectId : null;
}

function getUserIdByStudentId(studentId) {
  const row = db.prepare('SELECT userId FROM Users WHERE studentId = ?').get(studentId);
  return row ? row.userId : null;
}

function hasUserSubjects(studentId) {
  const row = db.prepare(
    `SELECT COUNT(*) AS count
     FROM UserSubjects us
     INNER JOIN Users u ON us.userId = u.userId
     WHERE u.studentId = ?`
  ).get(studentId);
  return row?.count > 0;
}

function ensureUserByStudentId(studentId, studentName = studentId) {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO Users (studentId, studentName) VALUES (?, ?)`
  );
  insert.run(studentId, studentName);
  const row = db.prepare('SELECT userId FROM Users WHERE studentId = ?').get(studentId);
  return row ? row.userId : null;
}

export { 
  db, 
  initializeDatabase, 
  getHomeworkList, 
  getEnrollingSubjectsByStudentId, 
  saveSubjects, 
  saveUserSubjects, 
  getSubjectId, 
  getUserIdByStudentId, 
  ensureUserByStudentId, 
  hasUserSubjects,
  getHomeworkListFiltered,
  saveHomework
};
