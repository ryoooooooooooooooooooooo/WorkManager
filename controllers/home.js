import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getEnrollingSubjectsByStudentId } from '../sqlite/setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homePagePath = path.join(__dirname, '..', 'ui', 'home.html');

export const getHome = async (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }
  
  try {
    // DBから履修中の科目と担当教員を取得
    const enrollingSubjects = getEnrollingSubjectsByStudentId(String(req.session.student_id));
    
    // 科目と担当教員リストをHTMLに変換
    const subjectsHtml = enrollingSubjects
      .map(({ subject, teacher }) => {
        const teacherLabel = teacher ? `担当教員: ${teacher}` : '担当教員: 取得できませんでした';
        // include data attributes for subject and teacher for later navigation
        const safeSubject = subject.replace(/"/g, '&quot;');
        const safeTeacher = (teacher || '').replace(/"/g, '&quot;');
        return `<li class="list-group-item" data-subject="${safeSubject}" data-teacher="${safeTeacher}">${subject} <br><small>${teacherLabel}</small></li>`;
      })
      .join('');
    
    let html = readFileSync(homePagePath, 'utf8');
    html = html.replace('{{STUDENT_ID}}', req.session.student_id);
    html = html.replace('{{SUBJECTS_LIST}}', subjectsHtml);
    
    res.type('html').send(html);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    let html = readFileSync(homePagePath, 'utf8');
    html = html.replace('{{STUDENT_ID}}', req.session.student_id);
    html = html.replace('{{SUBJECTS_LIST}}', '<li class="list-group-item text-danger">科目の取得に失敗しました</li>');
    res.type('html').send(html);
  }
};