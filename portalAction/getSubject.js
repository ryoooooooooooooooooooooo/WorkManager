import { chromium } from 'playwright';
import { TARGET_URL } from '../url.js';
import { initializeDatabase, saveSubjects, saveUserSubjects, getSubjectId, getUserIdByStudentId } from '../sqlite/setup.js';

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

    await page.waitForTimeout(2000);
    const enrollingSubjects = await page.evaluate(() => {
      const subjects = [];

      const allElements = document.querySelectorAll('[title*="成績:履修中"]');

      allElements.forEach(element => {
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

    const subjectCells = page.locator('[title*="成績:履修中"]');
    const subjectCellCount = await subjectCells.count();
    const processedSubjectNames = new Set();
    const subjectsWithTeachers = [];

    initializeDatabase();
    console.log(`履修中科目セル数: ${subjectCellCount}`);

    for (let i = 0; i < subjectCellCount; i++) {
      const subjectCell = subjectCells.nth(i);
      const title = await subjectCell.getAttribute('title').catch(() => null);
      const subjectName = title ? title.split('<br>')[0].trim() : 'unknown';

      if (processedSubjectNames.has(subjectName)) {
        console.log(`同じ科目名のため処理を終了します: ${subjectName}`);
        break;
      }

      processedSubjectNames.add(subjectName);
      const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);

      try {
        await subjectCell.click();
      } catch (error) {
        console.log(`クリック失敗: ${subjectName}`, error);
        subjectsWithTeachers.push({ subject: subjectName, teacher: null });
        continue;
      }

      const popup = await popupPromise;
      let teacher = null;

      if (popup) {
        console.log(`新しいタブが開きました: ${subjectName}`);

        // 1. 担当教員情報を含むセクション（#basicinfo1 またはテーブル）が読み込まれるのを最大10秒待つ
        try {
          await popup.waitForSelector('#basicinfo1 table.SyllabusTable', { timeout: 10000 });
        } catch (e) {
          console.log(`タイムアウト: 教員情報の要素が見つかりませんでした: ${subjectName}`);
        }

        // 2. ページ内で確実に教員名を取得する
        teacher = await popup.evaluate(() => {
          // #basicinfo1 の中にあるテーブルから教員名（1行目の最初のtd）をピンポイントで探す
          const basicInfoDiv = document.querySelector('#basicinfo1');
          if (!basicInfoDiv) return null;

          // テーブルの行を取得
          const rows = basicInfoDiv.querySelectorAll('tr');
          // 見出し行を飛ばして、データが入っている最初の行の最初のセルを見る
          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            // 担当教員の行には「研究室」や「内線番号」などのデータが含まれているため、
            // 最初のtd（教員名と予想されるもの）をチェック
            if (cells.length >= 3) {
              const nameText = cells[0].innerText.trim();
              // 数字やメールアドレスっぽくない、かつ空ではないものを教員名とみなす
              if (nameText && !nameText.includes('@') && !/^\d+$/.test(nameText)) {
                return nameText;
              }
            }
          }

          // 万が一上のループで見つからない場合のフォールバック（最初のtdを返す）
          const firstTd = basicInfoDiv.querySelector('td');
          return firstTd ? firstTd.innerText.trim() : null;
        });

        await popup.close();
        await page.bringToFront();
      } else {
        console.log(`新しいタブは開きませんでした: ${subjectName}`);
      }

      subjectsWithTeachers.push({ subject: subjectName, teacher });
    }

    const saveResults = saveSubjects(subjectsWithTeachers);
    console.log('subjectsWithTeachers:', subjectsWithTeachers);
    console.log('saveResults:', saveResults);

    const userId = getUserIdByStudentId(String(student_id));
    if (userId) {
      const subjectIds = subjectsWithTeachers
        .map(({ subject, teacher }) => getSubjectId(subject, teacher))
        .filter(Boolean);
      const userSubjectResults = saveUserSubjects(userId, subjectIds);
      console.log('userSubjectResults:', userSubjectResults);
    } else {
      console.log(`Users テーブルに studentId=${student_id} のレコードが存在しません。UserSubjects に保存できませんでした。`);
    }

    return subjectsWithTeachers;
  } catch (error) {
    console.error('Student subject get failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
