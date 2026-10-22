// Banc de test : matchs IA contre IA simulés en accéléré, avec statistiques.
// Hors du site publié. Pour l'utiliser : coller ce fichier dans la console du navigateur sur la page du jeu,
// puis : await BFCSim.run({ matches: 6, size: 5, seconds: 120 })
(function(){
  'use strict';
  const wrapCount = (name, stats, key, pre) => {
    const orig = window[name];
    window[name] = function(){ try{ pre && pre.apply(null, arguments); }catch(_){ } stats[key] = (stats[key] || 0) + 1; return orig.apply(this, arguments); };
    return () => { window[name] = orig; };
  };

  async function run(opts){
    opts = Object.assign({ matches: 6, size: 5, seconds: 120, pairs: null, log: false }, opts || {});
    if(window.MusclorDuck) MusclorDuck.skip();
    if(!introDone) skipIntro();
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = () => 0;            // coupe la boucle réelle
    await new Promise(r => setTimeout(r, 50));
    const all = [];
    try{
      for(let m = 0; m < opts.matches; m++){
        const pair = opts.pairs ? opts.pairs[m % opts.pairs.length] : [Math.floor(Math.random() * countries.length), Math.floor(Math.random() * countries.length)];
        all.push(simMatch(pair[0], pair[1] === pair[0] ? (pair[1] + 1) % countries.length : pair[1], opts));
      }
    }finally{
      window.requestAnimationFrame = raf;
      last = performance.now();
      raf(loop);
    }
    return summarize(all);
  }

  function simMatch(a, b, opts){
    const st = { teams: countries[a].name + ' v ' + countries[b].name, goalsA: 0, goalsB: 0, goalKinds: {}, kicks: {}, ko: 0, slides: 0, turnovers: 0,
      ballIdle: 0, ballCorner: 0, saves: {}, slowF: 0, hitStopF: 0, frames: 0, humanCtl: 0, cluster: 0, stuckAI: 0, possA: 0, possB: 0, longHold: 0, keeperTouch: 0, shotsOnFrame: 0 };
    const undo = [];
    undo.push(wrapCount('brutalKO', st, 'ko'));
    const origSlide = window.slideTackle;
    window.slideTackle = function(pl){ const before = pl && pl.slideT; const r = origSlide.apply(this, arguments); if(pl && !before && pl.slideT > 0) st.slides++; return r; };
    undo.push(() => { window.slideTackle = origSlide; });
    const origRelease = window.release;
    window.release = function(dir, pow, lob, kind){ const k = kind || (lob > 0 ? 'lobPass' : 'pass'); st.kicks[k] = (st.kicks[k] || 0) + 1; return origRelease.apply(this, arguments); };
    undo.push(() => { window.release = origRelease; });
    ['volleyShoot','headerShoot'].forEach(n => undo.push(wrapCount(n, st.kicks, n)));
    const origSave = window.keeperSave;
    if(origSave){ window.keeperSave = function(){ const r = origSave.apply(this, arguments); st.saves[r] = (st.saves[r] || 0) + 1; return r; }; undo.push(() => { window.keeperSave = origSave; }); }
    const origGoal = window.goal;
    window.goal = function(team){ if(goalHoldT <= 0 && !goalReplay){ const k = ball.kickKind || '?'; st.goalKinds[k] = (st.goalKinds[k] || 0) + 1; const kp = players.find(o => o.team !== team && o.role === 'keeper'); st.gk = st.gk || []; st.gk.push(kp ? { d: Math.round(V.dist(kp.pos, ball.pos)), kx: Math.round(Math.abs(kp.pos.x - (team === TA ? field.x + field.w : field.x))), ky: Math.round(kp.pos.y - H/2), by: Math.round(ball.pos.y - H/2), sp: +ball.vel.len().toFixed(1), stun: kp.stun, intent: kp.intent, ctl: kp.control } : 'nokeeper'); } return origGoal.apply(this, arguments); };
    undo.push(() => { window.goal = origGoal; });

    selected = a; selectedOpponent = b; matchSize = opts.size; menuState.size = opts.size;
    startGame('aiwatch');
    timer = opts.seconds;
    let lastOwnerTeam = null, holdT = 0, lastOwner = null, lastKind = 'carry';
    const maxFrames = opts.seconds * 60 * 3;
    for(let f = 0; f < maxFrames && !gameOver; f++){
      if(preMatchT > 0) preMatchT = 1e-4;
      if(goalReplay) goalReplay = null;
      if(goalHoldT > 0) goalHoldT = 1e-4;
      players.forEach(p => { if(p.control || p.control2) st.humanCtl++; });
      if(hitStopT > 0) st.hitStopF++;
      update(1/60);
      if(timeScale() < .9) st.slowF++;
      if(kickoffSetupT > 0 || goalHoldT > 0) continue;
      st.frames++;
      const o = ball.owner;
      if(!o) lastKind = ball.kickKind; else if(o !== lastOwner && o.team === lastOwnerTeam) lastKind = 'carry';
      if(o){ if(o.team === TA) st.possA++; else st.possB++;
        if(lastOwnerTeam !== null && o.team !== lastOwnerTeam){ st.turnovers++; st.toKind = st.toKind || {}; const k = (lastKind || '?') + (o.role === 'keeper' ? '>gk' : ''); st.toKind[k] = (st.toKind[k] || 0) + 1; }
        lastOwnerTeam = o.team;
        if(o === lastOwner){ holdT++; if(holdT === 360) st.longHold++; } else { holdT = 0; lastOwner = o; }
        if(o.role === 'keeper' && o !== lastOwner) st.keeperTouch++;
      }else{ holdT = 0; lastOwner = null; if(ball.vel.len() < .25 && ball.z < 2) st.ballIdle++; }
      const nearX = Math.min(ball.pos.x - field.x, field.x + field.w - ball.pos.x), nearY = Math.min(ball.pos.y - field.y, field.y + field.h - ball.pos.y);
      if(nearX < 40 && nearY < 40) st.ballCorner++;
      let dsum = 0, n = 0;
      players.forEach(p => { if(p.role === 'keeper') return; dsum += V.dist(p.pos, ball.pos); n++; if(p.vel.len() < .08 && !p.hasBall && p.stun <= 0 && V.dist(p.pos, ball.pos) < 120) st.stuckAI++; });
      st.cluster += n ? dsum / n : 0;
    }
    st.goalsA = scoreA; st.goalsB = scoreB;
    undo.reverse().forEach(u => u());
    gameOver = true;
    return st;
  }

  function summarize(list){
    const sum = k => list.reduce((a, s) => a + (typeof s[k] === 'number' ? s[k] : 0), 0);
    const merge = k => list.reduce((acc, s) => { for(const x in s[k]) acc[x] = (acc[x] || 0) + s[k][x]; return acc; }, {});
    const frames = sum('frames') || 1, n = list.length;
    return {
      matches: n,
      goalsPerMatch: +((sum('goalsA') + sum('goalsB')) / n).toFixed(2),
      scores: list.map(s => `${s.teams} ${s.goalsA}-${s.goalsB}`),
      goalKinds: merge('goalKinds'),
      turnoverFrom: merge('toKind'),
      gk: list.flatMap(s => s.gk || []).slice(0, 30),
      keeper: merge('saves'),
      slowPct: +(sum('slowF') / frames * 100).toFixed(1),
      hitStopPct: +(sum('hitStopF') / frames * 100).toFixed(1),
      kicksPerMatch: Object.fromEntries(Object.entries(merge('kicks')).map(([k, v]) => [k, +(v / n).toFixed(1)])),
      koPerMatch: +(sum('ko') / n).toFixed(1),
      slidesPerMatch: +(sum('slides') / n).toFixed(1),
      turnoversPerMin: +(sum('turnovers') / (frames / 3600)).toFixed(1),
      ballIdlePct: +(sum('ballIdle') / frames * 100).toFixed(1),
      ballCornerPct: +(sum('ballCorner') / frames * 100).toFixed(1),
      longHoldsPerMatch: +(sum('longHold') / n).toFixed(1),
      possessionA: +(sum('possA') / Math.max(1, sum('possA') + sum('possB')) * 100).toFixed(0),
      avgDistToBall: +(sum('cluster') / frames).toFixed(0),
      stuckNearBallPct: +(sum('stuckAI') / frames * 100).toFixed(1),
      humanCtlFrames: sum('humanCtl')
    };
  }

  window.BFCSim = { run };
})();
