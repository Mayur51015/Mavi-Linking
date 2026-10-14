const { test, expect } = require('@playwright/test');
const { mockApiResponse } = require('./helpers/mockApi');

test.describe('End-to-End Registration & Onboarding Journey', () => {
  test('renders registration onboarding wizard and stepper', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByText(/verified student registration/i)).toBeVisible();
    await expect(page.getByText(/join your institution/i)).toBeVisible();
    await expect(page.getByPlaceholder('e.g. ZCER-PUNE-01')).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });

  test('validates institution code input with spaces or empty submission', async ({ page }) => {
    await page.goto('/register');

    // Fill with spaces
    await page.getByPlaceholder('e.g. ZCER-PUNE-01').fill('   ');
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText(/please enter your institution code/i)).toBeVisible();
  });

  test('displays error when institution code does not exist', async ({ page }) => {
    await mockApiResponse(page, /.*\/public\/institutions\/by-code\/.*/, {
      success: false,
      message: 'Invalid Institution Code. Please check with your campus administrator.',
    }, 404);

    await page.goto('/register');

    await page.getByPlaceholder('e.g. ZCER-PUNE-01').fill('UNKNOWN-01');
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText(/invalid institution code/i)).toBeVisible();
  });

  test('validates institution code, advances to Step 2 Department & PRN, and allows resetting choice', async ({ page }) => {
    const mockInstitution = {
      _id: 'inst-999',
      name: 'MIT College of Engineering',
      institutionCode: 'MIT-ENG-01',
      domain: 'mit.edu',
    };

    const mockDepartments = [
      { _id: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE' },
      { _id: 'dept-2', name: 'Information Technology', code: 'IT' },
    ];

    await mockApiResponse(page, /.*\/public\/institutions\/by-code\/.*/, {
      success: true,
      institution: mockInstitution,
      departments: mockDepartments,
    }, 200);

    await page.goto('/register');

    await page.getByPlaceholder('e.g. ZCER-PUNE-01').fill('MIT-ENG-01');
    await page.getByRole('button', { name: /continue/i }).click();

    // Verify progression to Step 2 with exact match
    await expect(page.getByText('MIT College of Engineering', { exact: true })).toBeVisible();
    await expect(page.getByText(/academic department/i)).toBeVisible();
    await expect(page.getByText(/permanent registration number/i)).toBeVisible();

    // Verify Reset/Change button returns to Step 1
    const changeBtn = page.getByRole('button', { name: /change code/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();

    // Should return to Step 1
    await expect(page.getByPlaceholder('e.g. ZCER-PUNE-01')).toBeVisible();
  });
});
