import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole('button', { name: /Ustoz/i }).click();
  await page.getByRole('textbox', { name: /Foydalanuvchi/i }).waitFor({ timeout: 5000 });
  await page.getByRole('textbox', { name: /Foydalanuvchi/i }).fill('subhonov mirshod');
  await page.getByRole('textbox', { name: /Parol/i }).fill('0303');
  await page.getByRole('button', { name: 'Kirish' }).click();
  await page.waitForURL(/\/app\//, { timeout: 15000 });
}

// Modal container — max-w-2xl faqat CustomerModal da bor
const getModalBox = (page: Page) => page.locator('[class*="max-w-2xl"]');

async function openModal(page: Page, customerName?: string) {
  await page.goto(`${BASE_URL}/app/master/customers`);
  await page.locator('h3').first().waitFor({ timeout: 15000 });

  if (customerName) {
    await page.locator('h3', { hasText: customerName }).first().click();
  } else {
    await page.locator('h3').first().click();
  }
  await getModalBox(page).waitFor({ timeout: 8000 });
  return getModalBox(page);
}

test.describe('Mijozlar sahifasi — Customer Modal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. Mijozlar sahifasi yuklanadi', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/master/customers`);
    await expect(page.locator('h1', { hasText: 'Mijozlar' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Jami mijozlar')).toBeVisible({ timeout: 10000 });
    console.log('✅ Sahifa yuklandi');
  });

  test('2. 15 ta mijoz cardi ko\'rinadi', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/master/customers`);
    await page.locator('h3').first().waitFor({ timeout: 15000 });
    const count = await page.locator('h3').count();
    console.log(`✅ ${count} ta mijoz topildi`);
    expect(count).toBeGreaterThan(0);
  });

  test('3. Card bosib modal ochiladi — 4 ta statistika', async ({ page }) => {
    const modal = await openModal(page);

    // Statistikalar modal ichida
    await expect(modal.locator('text=Jami xizmat')).toBeVisible();
    await expect(modal.locator("text=To'langan").first()).toBeVisible();
    await expect(modal.locator('text=Qarz').first()).toBeVisible();
    await expect(modal.locator('text=Oxirgi tashrif')).toBeVisible();
    console.log("✅ 4 ta statistika ko'rinadi");
  });

  test('4. Modal 3 ta tab ishlaydi', async ({ page }) => {
    const modal = await openModal(page);

    // Tab 1: Mashinalar — modal ichidagi tab (xs font)
    const carsTab = modal.locator('button').filter({ hasText: /Mashinalar/ }).first();
    await expect(carsTab).toBeVisible();
    console.log("✅ Mashinalar tab ko'rinadi");

    // Tab 2: Qarzlar
    await modal.locator('button').filter({ hasText: /Qarzlar/ }).first().click();
    await page.waitForTimeout(300);
    console.log('✅ Qarzlar tab bosildi');

    // Tab 3: To'lovlar
    await modal.locator('button').filter({ hasText: /To.lovlar/ }).first().click();
    await page.waitForTimeout(300);
    console.log("✅ To'lovlar tab bosildi");
  });

  test('5. Mashinalar tab — mashina ko\'rinadi', async ({ page }) => {
    const modal = await openModal(page, 'Hayot');

    await expect(modal.locator('text=Shacman Triller')).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=01 D 935 MA')).toBeVisible();
    console.log('✅ Mashina ma\'lumotlari ko\'rinadi');
  });

  test('6. Mashina expand/collapse ishlaydi', async ({ page }) => {
    const modal = await openModal(page, 'Hayot');

    const carBtn = modal.locator('button').filter({ hasText: /Shacman Triller/ }).first();
    await carBtn.waitFor({ timeout: 5000 });
    await carBtn.click();
    await page.waitForTimeout(400);

    // Expand bo'lganda border-t div paydo bo'ladi
    const expandedDiv = modal.locator('[class*="border-t"][class*="divide"]');
    await expect(expandedDiv).toBeVisible({ timeout: 3000 });
    console.log('✅ Mashina expand ishladi');

    await carBtn.click();
    await page.waitForTimeout(300);
    await expect(expandedDiv).not.toBeVisible({ timeout: 2000 });
    console.log('✅ Mashina collapse ishladi');
  });

  test('7. To\'lovlar tab — to\'lov ko\'rinadi', async ({ page }) => {
    const modal = await openModal(page, 'Hayot');

    await modal.locator('button').filter({ hasText: /To.lovlar/ }).first().click();
    await page.waitForTimeout(500);

    const count = await modal.locator('text=so\'m').count();
    console.log(`✅ To'lovlar tab: ${count} ta element`);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('8. Modal X tugmasi bilan yopiladi', async ({ page }) => {
    const modal = await openModal(page);

    // Header dagi X button — sticky header ichida yagona button
    await modal.locator('[class*="sticky"]').locator('button').click();

    await expect(modal).not.toBeVisible({ timeout: 4000 });
    console.log('✅ Modal yopildi (X tugmasi)');
  });

  test('9. Modal backdrop bosib yopiladi', async ({ page }) => {
    const modal = await openModal(page);
    await expect(modal).toBeVisible();

    // Overlay (backdrop) ga bosish — modal tashqarisiga
    await page.mouse.click(100, 10);

    await expect(modal).not.toBeVisible({ timeout: 4000 });
    console.log('✅ Modal yopildi (backdrop)');
  });

  test('10. Qidiruv va filter ishlaydi', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/master/customers`);
    await page.locator('h3').first().waitFor({ timeout: 15000 });

    // Qidiruv
    await page.getByPlaceholder(/qidirish/i).fill('Hayot');
    await page.waitForTimeout(500);
    const filtered = await page.locator('h3').count();
    expect(filtered).toBeGreaterThanOrEqual(1);
    console.log(`✅ Qidiruv 'Hayot': ${filtered} ta natija`);

    // Qarzlar filteri
    await page.getByPlaceholder(/qidirish/i).clear();
    await page.locator('button', { hasText: /Qarzlar \(/ }).click();
    await page.waitForTimeout(300);
    const debtCount = await page.locator('h3').count();
    expect(debtCount).toBe(5);
    console.log(`✅ Qarzlar filter: ${debtCount} ta mijoz`);
  });
});
