import bcrypt from 'bcrypt';
import { db, initializeDatabase } from '../sqlite/setup.js';

function hashValueWithSalt(value, salt) {
  return bcrypt.hashSync(`${salt}${value}`, 10);
}

export async function studentJudge(student_id, password) {
  try {
    initializeDatabase();
    const rows = db.prepare('SELECT studentIdHash, studentSalt, passwordHash, passwordSalt FROM AuthorizedCredentials').all();

    for (const row of rows) {
      const studentHashMatches = bcrypt.compareSync(`${row.studentSalt}${student_id}`, row.studentIdHash);
      const passwordHashMatches = bcrypt.compareSync(`${row.passwordSalt}${password}`, row.passwordHash);

      if (studentHashMatches && passwordHashMatches) {
        return 'Success';
      }
    }

    return 'Fail';
  } catch (error) {
    console.error('studentJudge failed:', error);
    return 'Fail';
  }
}
