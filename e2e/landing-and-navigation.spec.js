const { test, expect } = require('@playwright/test');

test.describe('Landing Page & Navigation Journey', () => {
  test('renders landing page with headline, pillars, and primary CTA buttons', async ({ page }) => {
    await page.goto('/');

    // Check title and branding
    await expect(page).toHaveTitle(/EduTalentX|Mavi-Linking/i);

    // Hero section checks
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Verify main desktop navigation
    const navbar = page.locator('nav.edutalentx-desktop-nav');
    await expect(navbar).toBeVisible();

    // Verify action buttons exist
    const loginLink = page.locator('a.edutalentx-login-btn');
    await expect(loginLink).toBeVisible();

    const getStartedLink = page.locator('a.edutalentx-get-started-btn').first();
    await expect(getStartedLink).toBeVisible();
  });

  test('navigates from landing page to /login via navigation bar link', async ({ page }) => {
    await page.goto('/');

    // Click Login link in header
    const loginBtn = page.locator('a.edutalentx-login-btn');
    await loginBtn.click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h2', { hasText: /sign in/i })).toBeVisible();
  });

  test('navigates from login to /register', async ({ page }) => {
    await page.goto('/login');

    const registerLink = page.getByRole('link', { name: /create account/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText(/institution code|academic onboarding|register/i).first()).toBeVisible();
  });
});
