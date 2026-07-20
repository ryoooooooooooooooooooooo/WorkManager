import { chromium } from 'playwright';
import { TARGET_URL } from '../url.js';

export async function getSubject(student_id, password) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const loginForm = page.locator('form').filter({
      has: page.locator('input[name="uid"]')
    }).first();
    await loginForm.waitFor({ timeout: 10000 });

    const studentField = loginForm.locator('input[name="uid"]');
    const passwordField = loginForm.locator('input[name="pw"]');
    const hiddenPasswordField = loginForm.locator('input[name="password"]');

    await studentField.waitFor({ timeout: 10000 });
    await passwordField.waitFor({ timeout: 10000 });
    await studentField.fill(String(student_id));
    await passwordField.fill(String(password));

    if (await hiddenPasswordField.count()) {
      await hiddenPasswordField.evaluate((element, value) => {
        element.value = value;
      }, String(password));
    }

    await loginForm.evaluate((form) => {
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        form.submit();
      }
    });

    // ログイン後、ページが読み込まれるのを待つ
    await page.waitForLoadState('domcontentloaded');

    // KITナビボタンをクリック
    const kitNaviButton = page.locator('a.crrclmFlow').first();
    await kitNaviButton.waitFor({ timeout: 10000 });

    await Promise.all([
      page.waitForLoadState('domcontentloaded'), // 遷移完了を待つ
      kitNaviButton.click()                      // クリックする
    ]);

    // ページの完全な読み込みを待つ
    await page.waitForTimeout(2000);

    // 「成績:履修中」を含むtitle属性を持つ要素から履修中の科目を抽出
    const enrollingSubjects = await page.evaluate(() => {
      const subjects = [];
      
      // title に「成績:履修中」を含む要素を探す
      const allElements = document.querySelectorAll('[title*="成績:履修中"]');
      
      allElements.forEach(element => {
        // title属性から科目名を抽出
        // title属性の形式: "科目名<br>成績:履修中<br>出席率:xx%"
        const title = element.getAttribute('title');
        if (title) {
          // <br> で分割して最初の要素が科目名
          const subjectName = title.split('<br>')[0].trim();
          if (subjectName && !subjects.includes(subjectName)) {
            subjects.push(subjectName);
          }
        }
      });
      
      return subjects;
    });

    console.log(enrollingSubjects);
    return enrollingSubjects;
  } catch (error) {
    console.error('Student subject get failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
