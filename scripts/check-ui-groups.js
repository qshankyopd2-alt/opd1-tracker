// Run against a running DEV Design Mode: playwright-cli run-code --filename=scripts/check-ui-groups.js
async (page) => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  await page.getByTestId('design-mode-toggle').click();
  await page.getByRole('button', { name: 'Groups · open NovaFlux, then PixelRift (1 → 3 matches)', exact: true }).click();
  await page.getByTestId('design-mode-toggle').click();
  await page.waitForTimeout(300);
  check(await page.locator('.inferred-group-badge').count() === 0, 'Groups must start empty');
  const weapons = page.getByTestId('loadout-toggle-puuid-ally-0');
  await weapons.click();
  check(await weapons.getAttribute('aria-expanded') === 'true', 'Weapons expand');
  check(await page.getByTestId('player-drawer').count() === 0, 'Weapons must not open profile');
  check(await page.locator('#loadout-puuid-ally-0').isVisible(), 'Loadout must be visible');
  await weapons.click();
  await page.getByTestId('player-row-open-puuid-ally-0').click();
  await page.getByTestId('drawer-tab-matches').waitFor();
  await page.waitForFunction(() => document.querySelector('.inferred-group-badge')?.getAttribute('aria-label')?.includes('1 shared matches'));
  check(await page.getByTestId('player-drawer').isVisible(), 'Evidence updates while profile stays open');
  check(await page.getByTestId('drawer-loadout').getAttribute('open') === null, 'Drawer loadout starts collapsed');
  await page.getByTestId('drawer-tab-matches').click();
  check(await page.getByTestId('drawer-tab-matches').getAttribute('aria-selected') === 'true', 'Selected tab semantics');
  await page.keyboard.press('ArrowLeft');
  check(await page.getByTestId('drawer-tab-overview').getAttribute('aria-selected') === 'true', 'Arrow key changes tab');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    check(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), 'Focus escaped modal');
  }
  await page.keyboard.press('Escape');
  check(await page.getByTestId('player-row-open-puuid-ally-0').evaluate((el) => el === document.activeElement), 'Focus not restored');
  await page.getByTestId('player-row-open-puuid-ally-3').click();
  await page.waitForFunction(() => document.querySelector('.inferred-group-badge')?.getAttribute('aria-label')?.includes('3 shared matches'));
  await page.keyboard.press('Escape');
  check(await page.locator('.inferred-group-badge').count() === 2, 'Both group members marked');
  await page.locator('.inferred-group-badge').first().focus();
  check(await page.getByRole('tooltip').filter({ hasText: 'Current party not confirmed' }).first().isVisible(), 'Keyboard tooltip unavailable');
  await page.screenshot({ path: 'output/playwright/groups.png' });
  const clipped = await page.locator('.player-row').evaluateAll((rows) => rows.some((row) => row.scrollWidth > row.clientWidth + 1));
  check(!clipped, 'Roster has horizontal overflow');
  console.log('PASS: dynamic 0 → 1 → 3 evidence, weapons, tabs, focus trap/restore, keyboard tooltip, roster layout');
}
