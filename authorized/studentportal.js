import { chromium } from 'playwright';

const TARGET_URL = 'https://navi.mars.kanazawa-it.ac.jp/portal/student';

export async function accountCreateAuthorized(student_id, password) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const loginContainerSelector = '#liginTbl, #loginTbl';
    await page.locator(loginContainerSelector).first().waitFor({ timeout: 10000 });

    const loginBox = page.locator(loginContainerSelector).first();
    const studentField = loginBox.locator('input:not([type="password"])').first();
    const passwordField = loginBox.locator('input[type="password"]').first();
    const loginButton = page.locator('#StudentLoginBtn').first();

    await studentField.waitFor({ timeout: 10000 });
    await passwordField.waitFor({ timeout: 10000 });
    await studentField.fill(student_id);
    await passwordField.fill(password);

    const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
    await loginButton.click();
    await navigationPromise;

    const currentUrl = page.url();
    console.log(JSON.stringify({
      targetUrl: TARGET_URL,
      currentUrl,
      changed: currentUrl !== TARGET_URL
    }, null, 2));
  } catch (error) {
    console.error('Student portal login check failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

accountCreateAuthorized('1234556', 'password');
