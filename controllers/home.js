import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getSubject } from '../portalAction/getSubject.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homePagePath = path.join(__dirname, '..', 'ui', 'home.html');

export const getHome = async (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }
  
  try {
    // getSubject 関数を呼び出して履修中の科目を取得
    const enrollingSubjects = await getSubject(req.session.student_id, req.session.password);
    
    // 科目リストをHTMLに変換
    const subjectsHtml = enrollingSubjects
      .map(subject => `<li class="list-group-item">${subject}</li>`)
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