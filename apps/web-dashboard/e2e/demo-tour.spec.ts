import { expect, test } from '@playwright/test';

const e2eEnabled = process.env['RUN_E2E_TESTS'] === 'true';

test.describe('Demo tour', () => {
  test.skip(!e2eEnabled, 'Set RUN_E2E_TESTS=true to run Playwright e2e tests.');

  test('start simulator from control panel then fleet overview shows metrics', async ({
    page,
  }) => {
    await page.goto('/control');
    await page.getByRole('button', { name: 'Start simulator' }).click();
    await expect(
      page.getByText('Simulator start command accepted'),
    ).toBeVisible();

    await page.goto('/');

    await expect(async () => {
      const co2Card = page
        .getByText('CO₂', { exact: true })
        .locator('xpath=ancestor::div[contains(@class,"rounded-xl")]');
      const value = co2Card.locator('p.tabular-nums').first();
      await expect(value).not.toHaveText(/^0(?:\.0+)?\s*kg$/);
    }).toPass({ timeout: 120_000 });

    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  });
});
