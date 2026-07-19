import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { accountCreateAuthorized } from './studentportal.js';
import { db, initializeDatabase } from '../sqlite/setup.js';

function createSalt() {
  return randomBytes(16).toString('hex');
}

function hashValueWithSalt(value, salt) {
  return bcrypt.hashSync(`${salt}${value}`, 10);
}

export async function studentCreateJudge(student_id, password) {
  try {
    initializeDatabase();
    const authResult = await accountCreateAuthorized(student_id, password);

    if (authResult?.result === 'success') {
      const studentSalt = createSalt();
      const passwordSalt = createSalt();
      const studentHash = hashValueWithSalt(student_id, studentSalt);
      const passwordHash = hashValueWithSalt(password, passwordSalt);

      const insert = db.prepare(
        'INSERT INTO AuthorizedCredentials (studentIdHash, studentSalt, passwordHash, passwordSalt) VALUES (?, ?, ?, ?)'
      );
      insert.run(studentHash, studentSalt, passwordHash, passwordSalt);

      return 'Success';
    }

    return 'Fail';
  } catch (error) {
    console.error('studentJudge failed:', error);
    return 'Fail';
  }
}
