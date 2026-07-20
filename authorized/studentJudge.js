import bcrypt from 'bcrypt';
import { db, initializeDatabase } from '../sqlite/setup.js';

function hashValueWithSalt(value, salt) {
  return bcrypt.hashSync(`${salt}${value}`, 10);
}

export async function studentJudge(student_id, password) {
  try {
    initializeDatabase();
    const row = db.prepare('SELECT passwordHash, passwordSalt FROM AuthorizedCredentials WHERE studentId = ?').get(student_id);

    if (!row) {
      return 'Fail';
    }

    const passwordHashMatches = bcrypt.compareSync(`${row.passwordSalt}${password}`, row.passwordHash);

    if (passwordHashMatches) {
      return 'Success';
    }

    return 'Fail';
  } catch (error) {
    console.error('studentJudge failed:', error);
    return 'Fail';
  }
}
