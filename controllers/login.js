import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { studentJudge } from '../authorized/studentJudge.js';
import { ensureUserByStudentId, hasUserSubjects } from '../sqlite/setup.js';
import { getSubject } from '../portalAction/getSubject.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loginPagePath = path.join(__dirname, '..', 'ui', 'login.html');

function renderLoginPage(result = '') {
  const html = readFileSync(loginPagePath, 'utf8');

  if (!result) {
    return html;
  }

  const message = result === 'Success'
    ? '<div class="alert alert-success mt-3">Success</div>'
    : '<div class="alert alert-danger mt-3">Fail</div>';

  return html.replace('</body>', `${message}</body>`);
}

export const getLogin = (req, res) => {
  res.type('html').send(renderLoginPage());
};

export const postLogin = async (req, res) => {
  const student_id = req.body?.student_id ?? '';
  const password = req.body?.password ?? '';
  const result = await studentJudge(student_id, password);

  if (result === 'Success') {
    await ensureUserByStudentId(String(student_id));
    const shouldSyncSubjects = !hasUserSubjects(String(student_id));
    if (shouldSyncSubjects) {
      try {
        await getSubject(student_id, password);
      } catch (error) {
        console.error(`初回履修科目取得に失敗しました: ${error.message}`);
      }
    }
    req.session.authenticated = true;
    req.session.student_id = student_id;
    req.session.password = password;
    return res.redirect('/home');
  }

  res.type('html').send(renderLoginPage(result));
};
