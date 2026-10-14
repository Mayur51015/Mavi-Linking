const { test, expect } = require('@playwright/test');
const { mockApiResponse } = require('./helpers/mockApi');

test.describe('End-to-End Authentication Journey', () => {
  test('validates required fields on empty login submission', async ({ page }) => {
    await page.goto('/login');

    // Fill with spaces to bypass HTML5 required attribute and trigger React-level validation
    await page.getByPlaceholder(/e\.g\. rollno@college\.edu or ETX-1024/i).fill('   ');
    await page.getByPlaceholder(/••••••••/).fill('   ');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify React error message is displayed
    await expect(page.getByText(/please enter your email, etx id, or prn/i)).toBeVisible();
  });

  test('displays error notice on invalid credentials (401)', async ({ page }) => {
    await mockApiResponse(page, /.*\/auth\/login.*/, {
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    }, 401);

    await page.goto('/login');

    await page.getByPlaceholder(/e\.g\. rollno@college\.edu or ETX-1024/i).fill('ETX-INVALID-999');
    await page.getByPlaceholder(/••••••••/).fill('WrongPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('completes full login journey for student and reaches dashboard', async ({ page }) => {
    const mockUser = {
      _id: 'usr-student-e2e',
      name: 'E2E Student Tester',
      email: 'student.e2e@college.edu',
      role: 'user',
      roles: ['user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
      mustChangePassword: false,
      etxId: 'ETX-E2E-001',
    };

    const mockToken = 'mock-jwt-token-e2e-valid';

    // Mock auth login endpoint
    await mockApiResponse(page, /.*\/auth\/login.*/, {
      success: true,
      message: 'Login successful',
      data: {
        user: mockUser,
        token: mockToken,
        refreshToken: 'mock-refresh-token',
      },
    }, 200);

    // Mock auth me endpoint
    await mockApiResponse(page, /.*\/auth\/me.*/, {
      success: true,
      data: { user: mockUser },
    }, 200);

    // Mock other dashboard endpoints with credentialed CORS
    await page.route(/.*\/api\/.*/, async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/login') || url.includes('/auth/me')) {
        await route.fallback();
        return;
      }
      const req = route.request();
      const origin = req.headers()['origin'] || 'http://127.0.0.1:5173';

      if (req.method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] || '*',
          },
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/login');

    // Use ETX ID for institutional student login
    await page.getByPlaceholder(/e\.g\. rollno@college\.edu or ETX-1024/i).fill('ETX-E2E-001');
    await page.getByPlaceholder(/••••••••/).fill('SecurePass123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify transition to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });
});
