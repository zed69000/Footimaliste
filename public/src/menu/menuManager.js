(function (global) {
  'use strict';

  const VERSION = 'v0.9.11-step11';

  const PAGES = Object.freeze({
    MAIN: 'main',
    TEAM: 'team',
    OPPONENT: 'opponent',
    OPTIONS: 'options',
    BEGIN: 'begin'
  });

  const STEPS = Object.freeze({
    main: 'MENU',
    team: 'SELECT TEAM',
    opponent: 'SELECT ADVERSAIRE',
    options: 'OPTION',
    begin: 'GAME BEGIN'
  });

  function normalizeTeamIndex(value, countries, fallback) {
    const count = countries && countries.length ? countries.length : 1;
    const n = Number.isFinite(+value) ? Math.round(+value) : (fallback || 0);
    return ((n % count) + count) % count;
  }

  function createState(seed) {
    seed = seed || {};
    const countries = seed.countries || [];
    const teamA = normalizeTeamIndex(seed.teamA, countries, 0);
    let teamB = normalizeTeamIndex(seed.teamB, countries, teamA + 1);
    if (countries.length > 1 && teamB === teamA) teamB = nextDifferentTeam(teamB, 1, teamA, countries.length);

    return {
      page: seed.page || PAGES.MAIN,
      mode: seed.mode || 'friendly',
      teamA,
      teamB,
      size: Number.isFinite(+seed.size) ? Math.max(2, Math.min(5, Math.round(+seed.size))) : 5,
      busy: false,
      plan: seed.plan || 'balanced'
    };
  }

  function isValidPage(page) {
    return Object.values(PAGES).includes(page);
  }

  function setPage(state, page) {
    if (!state || !isValidPage(page)) return false;
    state.page = page;
    return true;
  }

  function nextDifferentTeam(id, dir, forbiddenId, count) {
    const total = Math.max(1, count || 1);
    let n = normalizeTeamIndex(id, { length: total }, 0);
    let guard = 0;
    do {
      n = normalizeTeamIndex(n + (dir || 1), { length: total }, 0);
      guard += 1;
    } while (total > 1 && n === forbiddenId && guard < total + 1);
    return n;
  }

  function syncVersionBadge() {
    const badge = global.document && global.document.getElementById('bfcVersionBadge');
    if (!badge) return;
    badge.textContent = VERSION;
    badge.setAttribute('aria-label', 'Version ' + VERSION);
  }

  global.BFCMenuManager = Object.freeze({
    VERSION,
    PAGES,
    STEPS,
    createState,
    setPage,
    isValidPage,
    nextDifferentTeam,
    syncVersionBadge
  });

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', syncVersionBadge, { once: true });
    } else {
      syncVersionBadge();
    }
  }
})(window);
