// Run against the DEV Design Mode app with a headless Playwright page.
// This module has no package dependencies and never contacts the live backend.
export async function verifyPlayerNavigation(page) {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const id = (name) => page.getByTestId(name);
  const focus = (expected) => page.evaluate(async (expected) => {
    const deadline = performance.now() + 1000;
    while (document.activeElement?.getAttribute('data-testid') !== expected && performance.now() < deadline) {
      await new Promise(requestAnimationFrame);
    }
    return document.activeElement?.getAttribute('data-testid');
  }, expected);
  const title = async (expected) => {
    const state = await page.evaluate(() => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')];
      const label = dialogs[0]?.getAttribute('aria-labelledby');
      const heading = label && document.getElementById(label);
      return { count: dialogs.length, label, visible: Boolean(heading?.getBoundingClientRect().height) };
    });
    check(state.count === 1 && state.label === expected && state.visible, 'One dialog must reference its visible title');
  };
  await page.getByRole('button', { name: 'View profile for NovaFlux', exact: true }).click();
  await title('player-drawer-title');
  await id('drawer-tab-matches').click();
  await id('drawer-match-preview-match-7').click();
  await id('meta-note-input').waitFor({ state: 'visible' });
  await title('match-detail-title');
  await id('meta-note-input').fill('Navigation regression draft');
  await id('meta-tags-input').fill('review, focus');
  await id('meta-bookmark-toggle').click();
  await id('match-detail-back').click();
  check(await focus('drawer-match-preview-match-7') === 'drawer-match-preview-match-7', 'Back restores selected match focus');
  const scroll = await id('drawer-scroll-region').evaluate((el) => el.scrollTop);
  check(scroll > 0, 'Fixture must exercise a scrolled match list at 1200x700');
  await id('drawer-match-preview-match-1').click();
  await id('meta-note-input').waitFor({ state: 'visible' });
  await id('match-detail-back').press('Escape');
  check(await focus('drawer-match-preview-match-1') === 'drawer-match-preview-match-1', 'Escape returns to match list');
  await id('drawer-match-preview-match-7').click();
  await id('meta-note-input').waitFor({ state: 'visible' });
  check(await id('meta-note-input').evaluate((el) => el.value) === 'Navigation regression draft', 'Draft note survives another match');
  check(await id('meta-tags-input').evaluate((el) => el.value) === 'review, focus', 'Draft tags survive another match');
  check((await id('meta-bookmark-toggle').textContent()).includes('Bookmarked'), 'Draft bookmark survives another match');
  await id('meta-save-button').click();
  await id('meta-save-status').waitFor({ state: 'visible' });
  check(await id('meta-save-status').textContent() === 'Saved.', 'Save acknowledgement remains visible after parent update');
  await id('match-detail-back').press('Escape');
  check(Math.abs(await id('drawer-scroll-region').evaluate((el) => el.scrollTop) - scroll) < 2, 'Back retains scroll position');
  await title('player-drawer-title');
  await id('drawer-match-preview-match-7').press('Escape');
  check(await page.getByRole('dialog').count() === 0, 'Escape closes profile');
  check(await focus('player-row-open-puuid-ally-0') === 'player-row-open-puuid-ally-0', 'Profile close restores roster focus');
  return 'PASS: single dialog, accessible titles, Back/Escape, scroll/focus, cross-match drafts, save acknowledgement';
}

export async function verifyRosterLayout(page) {
  const state = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.player-row')];
    return {
      rows: rows.length,
      skins: document.querySelectorAll('.player-row [data-testid^="weapon-slot-"]').length,
      background: getComputedStyle(document.body).backgroundColor,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      visible: rows.every(row => { const box = row.getBoundingClientRect(); return box.bottom <= innerHeight && box.right <= innerWidth; }),
      contained: rows.every(row => {
        const box = row.getBoundingClientRect();
        const slots = [...row.querySelectorAll('[data-testid^="weapon-slot-"]')];
        const span = slots.at(-1).getBoundingClientRect().right - slots[0].getBoundingClientRect().left;
        return span >= box.width * 0.85 && slots.every(slot => {
          const skin = slot.getBoundingClientRect();
          return skin.top >= box.top && skin.bottom <= box.bottom + 1 && skin.right <= box.right;
        });
      }),
    };
  });
  if (state.rows !== 10 || state.skins !== 40 || !state.contained || !state.visible || state.horizontalOverflow || state.background !== 'rgb(17, 17, 17)') {
    throw new Error(`Roster regression: ${JSON.stringify(state)}`);
  }
  return 'PASS: approved neutral palette, ten cards, forty contained skin slots, no horizontal overflow';
}
