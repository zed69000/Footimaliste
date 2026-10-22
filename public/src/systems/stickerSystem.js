(function(global){
  'use strict';

  // Album "BRUTAL CARDS" façon Panini : logique pure (pas de DOM).
  // Chaque pays = une page de 6 stickers (GK, DEF, MID, ATT, JOKER, CAP).
  const VERSION = 'v1.0.0-album';
  const SAVE_KEY = 'brutal_fc_album_v1';
  const PER_TEAM = 6;
  const PACK_SIZE = 5;
  const PACK_COST = 100;          // points pour un paquet
  const TRADE_COST = 5;           // doubles pour un paquet au troc
  const LEGEND_PITY = 8;          // légende garantie au plus tard tous les N paquets
  const ROLES = Object.freeze(['GK','DEF','MID','ATT','JOKER','CAP']);

  // Rareté fixe par emplacement, comme les "spéciales" d'un vrai album.
  const RARITY_BY_SLOT = Object.freeze(['common','common','common','rare','legend','rare']);
  const RARITY = Object.freeze({
    common: { label:'COMMUNE', weight:70 },
    rare:   { label:'RARE',    weight:24 },
    legend: { label:'LÉGENDE', weight:6 }
  });

  function rarityOf(stickerId){ return RARITY_BY_SLOT[stickerId % PER_TEAM]; }
  function teamOf(stickerId){ return Math.floor(stickerId / PER_TEAM); }
  function slotOf(stickerId){ return stickerId % PER_TEAM; }
  function stickerNumber(stickerId){ return String(stickerId + 1).padStart(3,'0'); }

  function todayKey(d){
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function createState(){
    return {
      version: 1,
      owned: {},          // id -> nombre d'exemplaires (doubles inclus)
      bloody: {},         // id -> true si version SANGLANTE obtenue
      points: 0,
      packs: 1,           // un paquet de bienvenue
      packsOpened: 0,
      sinceLegend: 0,
      completedTeams: {},
      lastDaily: '',
      streak: 0,
      lastMatch: null
    };
  }

  function load(){
    try{
      const raw = global.localStorage && global.localStorage.getItem(SAVE_KEY);
      if(raw){
        const data = JSON.parse(raw);
        return Object.assign(createState(), data);
      }
    }catch(_){}
    return createState();
  }

  function save(state){
    try{ global.localStorage && global.localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(_){}
  }

  function totalStickers(teamCount){ return teamCount * PER_TEAM; }

  function uniqueCount(state){ return Object.keys(state.owned).filter(k => state.owned[k] > 0).length; }

  function doublesCount(state){
    let n = 0;
    for(const k in state.owned) n += Math.max(0, state.owned[k] - 1);
    return n;
  }

  function teamProgress(state, teamId){
    let n = 0;
    for(let s = 0; s < PER_TEAM; s++) if(state.owned[teamId*PER_TEAM + s] > 0) n++;
    return n;
  }

  // Bonus quotidien : 1 paquet par jour, 2 à partir de 3 jours d'affilée.
  function claimDaily(state, now){
    const today = todayKey(now);
    if(state.lastDaily === today) return 0;
    const y = new Date(now || Date.now()); y.setDate(y.getDate() - 1);
    state.streak = state.lastDaily === todayKey(y) ? state.streak + 1 : 1;
    state.lastDaily = today;
    const gift = state.streak >= 3 ? 2 : 1;
    state.packs += gift;
    save(state);
    return gift;
  }

  // Barème de fin de match. Retourne le détail pour l'animation de l'écran de fin.
  function scoreMatch(info){
    const lines = [];
    const won = info.scoreA > info.scoreB, draw = info.scoreA === info.scoreB;
    lines.push({ label: won ? 'Victoire' : draw ? 'Match nul' : 'Défaite (lot de consolation)', pts: won ? 70 : draw ? 40 : 25 });
    if(info.scoreA > 0) lines.push({ label: 'Buts ×' + info.scoreA, pts: info.scoreA * 12 });
    if(info.kos > 0) lines.push({ label: 'KO sanglants ×' + info.kos, pts: info.kos * 6 });
    if(info.scoreB === 0) lines.push({ label: 'Clean sheet', pts: 15 });
    if(info.campaignWin) lines.push({ label: 'Tour de coupe passé', pts: 40 });
    return { lines, total: lines.reduce((a, l) => a + l.pts, 0) };
  }

  function addPoints(state, pts){
    const before = state.points;
    state.points += pts;
    let earned = 0;
    while(state.points >= PACK_COST){ state.points -= PACK_COST; earned++; }
    state.packs += earned;
    save(state);
    return { before, after: state.points, earned };
  }

  function pickWeighted(rand){
    const r = rand() * 100;
    if(r < RARITY.legend.weight) return 'legend';
    if(r < RARITY.legend.weight + RARITY.rare.weight) return 'rare';
    return 'common';
  }

  function idsOfRarity(teamCount, rarity){
    const out = [];
    for(let id = 0; id < teamCount * PER_TEAM; id++) if(rarityOf(id) === rarity) out.push(id);
    return out;
  }

  // Ouvre un paquet : 5 stickers, le 5e au moins RARE, au moins 1 nouveau garanti
  // tant que l'album n'est pas fini, légende garantie par pitié. bloodyChance augmente avec les KO.
  function openPack(state, teamCount, opts){
    opts = opts || {};
    const rand = opts.rand || Math.random;
    if(state.packs <= 0) return null;
    state.packs--;
    state.packsOpened++;
    state.sinceLegend++;
    const bloodyChance = Math.min(0.25, 0.05 + (opts.koBonus || 0) * 0.01);
    const pulled = [];
    for(let i = 0; i < PACK_SIZE; i++){
      let rarity = pickWeighted(rand);
      if(i === PACK_SIZE - 1 && rarity === 'common') rarity = 'rare';
      if(i === PACK_SIZE - 1 && state.sinceLegend >= LEGEND_PITY) rarity = 'legend';
      const pool = idsOfRarity(teamCount, rarity);
      pulled.push(pool[Math.floor(rand() * pool.length)]);
    }
    const total = teamCount * PER_TEAM;
    const isNew = id => !(state.owned[id] > 0) && pulled.indexOf(id) === pulled.lastIndexOf(id);
    if(uniqueCount(state) < total && !pulled.some(isNew)){
      const missing = [];
      for(let id = 0; id < total; id++) if(!(state.owned[id] > 0) && pulled.indexOf(id) < 0) missing.push(id);
      if(missing.length) pulled[Math.floor(rand() * 4)] = missing[Math.floor(rand() * missing.length)];
    }
    const cards = pulled.map(id => {
      const fresh = !(state.owned[id] > 0);
      state.owned[id] = (state.owned[id] || 0) + 1;
      const rarity = rarityOf(id);
      if(rarity === 'legend') state.sinceLegend = 0;
      const bloody = rand() < bloodyChance;
      const bloodyNew = bloody && !state.bloody[id];
      if(bloody) state.bloody[id] = true;
      return { id, rarity, isNew: fresh, copies: state.owned[id], bloody, bloodyNew };
    });
    // Pages complétées par ce paquet -> récompense
    const completed = [];
    for(const c of cards){
      const t = teamOf(c.id);
      if(!state.completedTeams[t] && teamProgress(state, t) === PER_TEAM){
        state.completedTeams[t] = true;
        state.packs += 2;
        completed.push(t);
      }
    }
    save(state);
    return { cards, completed };
  }

  // Troc de cour de récré : 5 doubles -> 1 paquet. On sacrifie d'abord les doubles les plus communs.
  function trade(state){
    if(doublesCount(state) < TRADE_COST) return false;
    const order = Object.keys(state.owned).map(Number)
      .filter(id => state.owned[id] > 1)
      .sort((a, b) => (RARITY_BY_SLOT.indexOf(rarityOf(a)) - RARITY_BY_SLOT.indexOf(rarityOf(b))) || (state.owned[b] - state.owned[a]));
    let left = TRADE_COST;
    for(const id of order){
      while(left > 0 && state.owned[id] > 1){ state.owned[id]--; left--; }
      if(!left) break;
    }
    state.packs++;
    save(state);
    return true;
  }

  global.BFC_STICKERS = Object.freeze({
    VERSION, PER_TEAM, PACK_SIZE, PACK_COST, TRADE_COST, ROLES, RARITY,
    rarityOf, teamOf, slotOf, stickerNumber,
    createState, load, save, totalStickers, uniqueCount, doublesCount, teamProgress,
    claimDaily, scoreMatch, addPoints, openPack, trade
  });
})(window);
