(function(global){
  'use strict';

  const MATCH_STATES = Object.freeze({
    MENU: 'menu',
    PRE_MATCH: 'pre_match',
    KICKOFF: 'kickoff',
    PLAYING: 'playing',
    GOAL_PAUSE: 'goal_pause',
    PAUSED: 'paused',
    FINISHED: 'finished',
    CAMPAIGN_BOARD: 'campaign_board',
    AI_WATCH: 'ai_watch'
  });

  const VERSION = 'v0.9.11-step11';

  function createMatchState(initial){
    return Object.assign({
      state: MATCH_STATES.MENU,
      mode: 'friendly',
      previousState: null,
      lastTransitionAt: 0,
      reason: 'boot'
    }, initial || {});
  }

  function now(){
    try{return performance.now()}catch(_){return Date.now()}
  }

  function setState(store, nextState, reason){
    if(!store || !nextState)return store;
    if(store.state === nextState){
      store.reason = reason || store.reason || '';
      return store;
    }
    store.previousState = store.state;
    store.state = nextState;
    store.reason = reason || '';
    store.lastTransitionAt = now();
    return store;
  }

  function isMenuLike(store){
    if(!store)return false;
    return store.state === MATCH_STATES.MENU || store.state === MATCH_STATES.CAMPAIGN_BOARD;
  }

  function isGameplayLike(store){
    if(!store)return false;
    return store.state === MATCH_STATES.PRE_MATCH ||
      store.state === MATCH_STATES.KICKOFF ||
      store.state === MATCH_STATES.PLAYING ||
      store.state === MATCH_STATES.AI_WATCH;
  }

  function isBlockingOverlay(store){
    if(!store)return false;
    return store.state === MATCH_STATES.PAUSED ||
      store.state === MATCH_STATES.GOAL_PAUSE ||
      store.state === MATCH_STATES.FINISHED ||
      store.state === MATCH_STATES.CAMPAIGN_BOARD;
  }

  function setVersionBadge(text){
    const badge = global.document && global.document.getElementById('bfcVersionBadge');
    if(badge)badge.textContent = text || VERSION;
  }

  global.BFC_MATCH = Object.freeze({
    VERSION,
    MATCH_STATES,
    createMatchState,
    setState,
    isMenuLike,
    isGameplayLike,
    isBlockingOverlay,
    setVersionBadge
  });
})(window);
