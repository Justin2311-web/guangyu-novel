// E2E test harness for Phase 2 auth & role gating.
//
// Usage:
//   node tests/auth-e2e.mjs reader        # register → login → admin-blocked → logout
//   node tests/auth-e2e.mjs sidebar ROLE  # log in as existing user, dump admin sidebar HTML
//                                         # ROLE is informational only (used in pass/fail labels)
//
// Reads Supabase URL + anon key from apps/web/.env.local (gitignored, public-safe).
// Persists the test-user email/password to tests/.state.json across runs.

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const STATE_PATH = resolve(__dirname, '.state.json');

const WEB = 'http://localhost:3000';
const ADMIN = 'http://localhost:3001';

function loadEnv(file) {
  const txt = readFileSync(resolve(REPO, file), 'utf8');
  const out = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = loadEnv('apps/web/.env.local');
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('Missing Supabase env vars.');
  process.exit(1);
}

function loadState() {
  if (existsSync(STATE_PATH)) return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  return null;
}
function saveState(s) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
}

const results = [];
function expect(label, cond, detail = '') {
  results.push({ label, ok: !!cond, detail });
  const tag = cond ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${label}${detail ? ' — ' + detail : ''}`);
}
function summary() {
  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

async function readerFlow() {
  const ts = Date.now();
  const email = `e2e-${ts}@example.com`;
  const password = 'Test-Password-1234';
  const displayName = `E2E ${ts}`;

  console.log(`\n=== Reader flow ===\ntest user: ${email}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // -------- Register --------
  await page.goto(`${WEB}/register`);
  await page.fill('input[name="display_name"]', displayName);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.click('button[type="submit"]'),
  ]);
  const afterRegisterUrl = page.url();
  const onPageMsg = await page.locator('form').innerText().catch(() => '');
  expect(
    'register redirects to home (email confirmation disabled)',
    afterRegisterUrl === `${WEB}/` || afterRegisterUrl === WEB || afterRegisterUrl.startsWith(WEB + '/?'),
    `url=${afterRegisterUrl} formText="${onPageMsg.replace(/\s+/g, ' ').slice(0, 160)}"`,
  );

  // Verify header shows display name (proves session cookie works on web).
  const headerText = await page.locator('header').innerText();
  expect(
    'web header reflects signed-in state',
    headerText.includes(displayName) || headerText.includes('登出'),
    `header="${headerText.replace(/\n/g, ' | ').slice(0, 120)}"`,
  );

  // -------- Reader blocked from admin --------
  const r1 = await page.request.get(`${ADMIN}/`, { maxRedirects: 0 });
  expect('reader hits admin / → 307', r1.status() === 307, `status=${r1.status()}`);
  expect(
    'redirect location includes error=forbidden OR sends to /login',
    (r1.headers().location || '').includes('/login'),
    `location=${r1.headers().location}`,
  );

  await page.goto(`${ADMIN}/`);
  const adminUrlAfter = page.url();
  expect(
    'reader navigation to admin lands on /login',
    adminUrlAfter.startsWith(`${ADMIN}/login`),
    `url=${adminUrlAfter}`,
  );

  // -------- Logout --------
  await page.goto(`${WEB}/`);
  // submit logout form
  await page.evaluate(async () => {
    await fetch('/logout', { method: 'POST' });
  });
  await page.goto(`${WEB}/`);
  const headerAfterLogout = await page.locator('header').innerText();
  expect(
    'web header shows login/register after logout',
    headerAfterLogout.includes('登录') && headerAfterLogout.includes('注册'),
    `header="${headerAfterLogout.replace(/\n/g, ' | ').slice(0, 120)}"`,
  );

  await browser.close();

  saveState({ email, password, displayName });
  console.log(`\nSaved state to ${STATE_PATH}`);
  console.log('\nNext step: in Supabase SQL Editor run:');
  console.log(`  update public.profiles set role = 'superadmin' where id = (select id from auth.users where email = '${email}');`);
}

async function sidebarFlow(label) {
  const state = loadState();
  if (!state) {
    console.error('No saved state — run reader flow first.');
    process.exit(1);
  }
  const { email, password, displayName } = state;

  console.log(`\n=== Admin sidebar flow (${label}) ===\nuser: ${email}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // log in via admin /login form
  await page.goto(`${ADMIN}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for either a redirect away from /login, or an inline error to render.
  await Promise.race([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 }).catch(() => {}),
    page.waitForSelector('p.text-red-600', { timeout: 15000 }).catch(() => {}),
  ]);
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  const afterLogin = page.url();

  if (label === 'reader') {
    // A reader submitting valid creds on the admin login form must be rejected.
    const stillOnLogin = afterLogin.startsWith(`${ADMIN}/login`);
    const errText = await page.locator('p.text-red-600').innerText().catch(() => '');
    expect(
      'reader rejected at admin login form',
      stillOnLogin && errText.length > 0,
      `url=${afterLogin} error="${errText}"`,
    );
    await browser.close();
    return;
  }

  if (afterLogin.startsWith(`${ADMIN}/login`)) {
    const errText = await page.locator('body').innerText();
    expect(`admin login (${label})`, false, `still on /login — body="${errText.slice(0, 200)}"`);
    await browser.close();
    return;
  }
  expect(`admin login succeeds (${label})`, true, `url=${afterLogin}`);

  // probe each section
  const sections = ['/users', '/settings', '/authors', '/categories', '/banners', '/novels', '/chapters', '/'];
  const access = {};
  for (const s of sections) {
    const resp = await page.request.get(`${ADMIN}${s}`, { maxRedirects: 0 });
    const loc = resp.headers().location || '';
    const code = resp.status();
    access[s] = { code, redirectedTo: loc };
  }
  console.log('\n  Section access map:');
  for (const [k, v] of Object.entries(access)) {
    console.log(`    ${k.padEnd(12)} ${v.code}${v.code !== 200 ? ' -> ' + v.redirectedTo : ''}`);
  }

  // sidebar nav text — scope to <nav> so the footer role label doesn't collide
  await page.goto(`${ADMIN}/`);
  const navText = await page.locator('aside nav').innerText().catch(() => '');
  const asideFull = await page.locator('aside').innerText().catch(() => '');
  console.log(`\n  Nav links:\n${navText.split('\n').map((l) => '    ' + l).join('\n')}`);
  console.log(`  (footer/full aside: ${asideFull.replace(/\n/g, ' | ')})`);

  const visible = (label) => navText.includes(label);
  switch (label) {
    case 'superadmin':
      expect('superadmin sees /users', visible('用户') && access['/users'].code === 200);
      expect('superadmin sees /settings', visible('站点设置') && access['/settings'].code === 200);
      expect('superadmin sees /authors', visible('作者') && access['/authors'].code === 200);
      expect('superadmin sees /categories', visible('分类') && access['/categories'].code === 200);
      expect('superadmin sees /banners', visible('横幅') && access['/banners'].code === 200);
      break;
    case 'admin':
      expect('admin does NOT see /users link', !visible('用户'));
      expect('admin does NOT see /settings link', !visible('站点设置'));
      expect('admin /users redirects', access['/users'].code === 307 && /\/\?error=forbidden/.test(access['/users'].redirectedTo));
      expect('admin /settings redirects', access['/settings'].code === 307);
      expect('admin still sees /authors', visible('作者') && access['/authors'].code === 200);
      expect('admin still sees /categories', visible('分类') && access['/categories'].code === 200);
      break;
    case 'author':
      expect('author does NOT see /users link', !visible('用户'));
      expect('author does NOT see /settings link', !visible('站点设置'));
      expect('author does NOT see /authors link', !visible('作者'));
      expect('author does NOT see /categories link', !visible('分类'));
      expect('author does NOT see /banners link', !visible('横幅'));
      expect('author /authors redirects', access['/authors'].code === 307);
      expect('author /users redirects', access['/users'].code === 307);
      expect('author sees /novels', visible('小说') && access['/novels'].code === 200);
      expect('author sees /chapters', visible('章节') && access['/chapters'].code === 200);
      break;
    case 'reader':
      // shouldn't even reach the sidebar
      expect('reader can NOT login to admin', afterLogin.startsWith(`${ADMIN}/login`) || access['/'].code === 307);
      break;
  }

  await browser.close();
}

const [, , cmd, arg] = process.argv;
(async () => {
  if (cmd === 'reader') {
    await readerFlow();
  } else if (cmd === 'sidebar') {
    await sidebarFlow(arg ?? 'unknown');
  } else {
    console.error('Usage: node tests/auth-e2e.mjs reader | sidebar <role>');
    process.exit(2);
  }
  summary();
})();
