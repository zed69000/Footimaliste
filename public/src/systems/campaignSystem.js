(function(global){
  'use strict';

  const VERSION = 'v0.9.11-step11';
  const CAMPAIGN_SEEDS = Object.freeze([18,17,16,14,3,24,20,21,22,13]);

  function clampIndex(value, min, max){
    const n = Number.isFinite(+value) ? Math.round(+value) : min;
    return Math.max(min, Math.min(max, n));
  }

  function buildOpponents(teamId, countries, count){
    const total = countries && countries.length ? countries.length : 0;
    const limit = Math.max(1, Math.min(count || 5, Math.max(1, total - 1)));
    const seen = new Set([teamId]);
    const out = [];

    for(const id of CAMPAIGN_SEEDS){
      if(out.length >= limit)break;
      if(id >= 0 && id < total && !seen.has(id)){
        out.push(id);
        seen.add(id);
      }
    }

    for(let i = 0; i < total && out.length < limit; i++){
      const c = countries[i];
      const id = c && Number.isFinite(+c.id) ? Math.round(+c.id) : i;
      if(!seen.has(id)){
        out.push(id);
        seen.add(id);
      }
    }

    return out;
  }

  function createState(seed){
    seed = seed || {};
    return {
      teamId: Number.isFinite(+seed.teamId) ? Math.round(+seed.teamId) : 0,
      step: Math.max(0, Math.round(+seed.step || 0)),
      opponents: Array.isArray(seed.opponents) ? seed.opponents.slice() : []
    };
  }

  function reset(state, teamId, countries, count){
    const next = state || createState();
    next.teamId = Number.isFinite(+teamId) ? Math.round(+teamId) : 0;
    next.step = 0;
    next.opponents = buildOpponents(next.teamId, countries, count || 5);
    return next;
  }

  function ensureOpponents(state, countries, count){
    if(!state)return createState({ opponents: buildOpponents(0, countries, count || 5) });
    if(!Array.isArray(state.opponents) || !state.opponents.length){
      state.opponents = buildOpponents(state.teamId, countries, count || 5);
    }
    return state;
  }

  function currentOpponent(state, countries){
    state = ensureOpponents(state, countries, 5);
    const max = Math.max(0, state.opponents.length - 1);
    return state.opponents[clampIndex(state.step, 0, max)];
  }

  function isComplete(state){
    return !!(state && Array.isArray(state.opponents) && state.opponents.length && state.step >= state.opponents.length);
  }

  function advance(state){
    if(!state)return createState();
    state.step = Math.max(0, Math.round((state.step || 0) + 1));
    return state;
  }

  function setVersionBadge(text){
    const badge = global.document && global.document.getElementById('bfcVersionBadge');
    if(badge){
      badge.textContent = text || VERSION;
      badge.setAttribute('aria-label', 'Version ' + (text || VERSION));
    }
  }

  global.BFCCampaignSystem = Object.freeze({
    VERSION,
    CAMPAIGN_SEEDS,
    createState,
    buildOpponents,
    reset,
    ensureOpponents,
    currentOpponent,
    isComplete,
    advance,
    setVersionBadge
  });
})(window);
