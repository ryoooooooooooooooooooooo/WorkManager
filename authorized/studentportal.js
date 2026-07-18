import { chromium } from 'playwright';

const TARGET_URL = 'https://navi.mars.kanazawa-it.ac.jp/portal/student';
const SUCCESS_URL = 'https://navi.mars.kanazawa-it.ac.jp/portal/student/KITP0010001';
const FAILURE_URL = 'https://navi.mars.kanazawa-it.ac.jp/portal/student/inKITP0000001LoginFailed';

export async function accountCreateAuthorized(student_id, password) {
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

    const navigationPromise = page.waitForURL(
      (url) => url.href === SUCCESS_URL || url.href === FAILURE_URL,
      { timeout: 15000 }
    ).catch(() => null);

    await loginForm.evaluate((form) => {
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        form.submit();
      }
    });
    await navigationPromise;

    const currentUrl = page.url();
    const result = currentUrl === SUCCESS_URL
      ? 'success'
      : currentUrl === FAILURE_URL
        ? 'failure'
        : 'unknown';

    console.log(JSON.stringify({
      targetUrl: TARGET_URL,
      successUrl: SUCCESS_URL,
      failureUrl: FAILURE_URL,
      currentUrl,
      result
    }, null, 2));

    return { result, currentUrl };
  } catch (error) {
    console.error('Student portal login check failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
