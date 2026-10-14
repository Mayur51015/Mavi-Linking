import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Automated Accessibility (a11y) Audits - Axe Core', () => {
  test('landing page accessibility scan', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter for critical/severe accessibility blockers (e.g. keyboard traps, missing forms)
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical'
    );

    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        `Accessibility findings on '/': ${accessibilityScanResults.violations.length} total (${criticalViolations.length} critical)`
      );
      accessibilityScanResults.violations.forEach((v) => {
        console.log(` - [${v.impact.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.length} occurrences)`);
      });
    }

    expect(criticalViolations).toEqual([]);
  });

  test('login page accessibility scan', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical'
    );

    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        `Accessibility findings on '/login': ${accessibilityScanResults.violations.length} total (${criticalViolations.length} critical)`
      );
    }

    expect(criticalViolations).toEqual([]);
  });

  test('registration page accessibility scan', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical'
    );

    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        `Accessibility findings on '/register': ${accessibilityScanResults.violations.length} total (${criticalViolations.length} critical)`
      );
    }

    expect(criticalViolations).toEqual([]);
  });
});
