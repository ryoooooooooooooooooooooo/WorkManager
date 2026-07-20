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
      // 重複チェック: 同じstudent_idが既に登録されているか確認
      const checkDuplicate = db.prepare(
        'SELECT COUNT(*) as count FROM AuthorizedCredentials WHERE studentId = ?'
      );
      const duplicateCheck = checkDuplicate.get(student_id);

      // 既に登録されている場合はInsertしない
      if (duplicateCheck?.count > 0) {
        return 'Fail';
      }

      const passwordSalt = createSalt();
      const passwordHash = hashValueWithSalt(password, passwordSalt);

      const insert = db.prepare(
        'INSERT INTO AuthorizedCredentials (studentId, passwordHash, passwordSalt) VALUES (?, ?, ?)'
      );
      insert.run(student_id, passwordHash, passwordSalt);

      return 'Success';
    }

    return 'Fail';
  } catch (error) {
    console.error('studentJudge failed:', error);
    return 'Fail';
  }
}
