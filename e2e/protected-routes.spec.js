const { test, expect } = require('@playwright/test');

test.describe('End-to-End Protected Routes Security & Guards', () => {
  test('redirects unauthenticated visitor from /dashboard to /login', async ({ page }) => {
    // Clear any existing localStorage session
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated visitor from /admin to /login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated visitor from /dashboard/teacher to /login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/dashboard/teacher');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects user with mustChangePassword flag to /change-password', async ({ page }) => {
    const tempUser = {
      _id: 'usr-temp-password',
      name: 'Temp Password User',
      email: 'temp@college.edu',
      role: 'user',
      roles: ['user'],
      mustChangePassword: true,
      accountStatus: 'ACTIVE',
      emailVerified: true,
    };

    await page.addInitScript(({ user }) => {
      localStorage.setItem('token', 'mock-temp-token');
      localStorage.setItem('user', JSON.stringify(user));
    }, { user: tempUser });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { user: tempUser } }),
      });
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/change-password/);
  });
});
