import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homePagePath = path.join(__dirname, '..', 'ui', 'home.html');

export const getHome = (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }
  
  const html = readFileSync(homePagePath, 'utf8');
  res.type('html').send(html);
};