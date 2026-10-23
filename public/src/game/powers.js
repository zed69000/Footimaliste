(function(global){
  'use strict';

  // Pouvoirs. Chaque équipe a une jauge de RAGE (0..100) qui se remplit en jouant : passes réussies,
  // ballons gagnés, tirs, arrêts, KO, et buts encaissés (pour permettre la remontée). Pleine, elle tire
  // un pouvoir au hasard ; le joueur le déclenche quand il veut (E / I, RB manette, bouton POUVOIR).
  // L'IA a la même jauge et déclenche au bon moment. Les effets sont lus par le jeu via powerOn(team,id).
  const POWERS = {
    fire:   { icon:'🔥', name:'Frappe de feu',  dur:8,   desc:'prochain tir en boule de feu' },
    turbo:  { icon:'⚡', name:'Turbo',          dur:5,   desc:'sprint infini qui renverse tout' },
    glue:   { icon:'🧲', name:'Colle-balle',    dur:6,   desc:'impossible de te prendre le ballon' },
    bomb:   { icon:'💣', name:'Ballon piégé',   dur:6,   desc:'explose sur l\'adversaire qui le touche' },
    freeze: { icon:'🧊', name:'Gel',            dur:2.6, desc:'adversaires gelés' },
    giant:  { icon:'🧱', name:'Gardien géant',  dur:8,   desc:'ton gardien devient énorme' }
  };
  const IDS = Object.keys(POWERS);
  const state = [ { rage:0, ready:null, active:null, t:0, aiWait:0 }, { rage:0, ready:null, active:null, t:0, aiWait:0 } ];

  function resetPowers(){ state.forEach(s => { s.rage = 0; s.ready = null; s.active = null; s.t = 0; s.aiWait = 0; }); }
  function powerOn(team, id){ const s = state[team]; return !!(s && s.active === id && s.t > 0); }
  function powerState(team){ return state[team]; }

  function addRage(team, n){
    const s = state[team];
    if(!s || s.ready || mode === 'training') return;
    s.rage = Math.min(100, s.rage + n);
    if(s.rage >= 100){
      s.ready = IDS[Math.floor(Math.random() * IDS.length)];
      s.aiWait = 1 + Math.random() * 2.2;
      if(team === TA){ show(POWERS[s.ready].icon + ' POUVOIR PRÊT : ' + POWERS[s.ready].name.toUpperCase(), true); try{ tone(880, .1, 'triangle', .07, 1.3); setTimeout(() => tone(1320, .14, 'triangle', .07, 1), 90); }catch(_){} }
    }
  }

  function activatePower(team){
    const s = state[team];
    if(!s || !s.ready || s.active) return false;
    const id = s.ready, P = POWERS[id];
    s.ready = null; s.rage = 0; s.active = id; s.t = P.dur;
    showMatchBanner((team === TA ? '' : 'ADVERSAIRE : ') + P.icon + ' ' + P.name.toUpperCase() + ' !');
    hitStop(.08); shake += 6;
    try{ tone(team === TA ? 520 : 300, .25, 'sawtooth', .06, 2.2); fnoise(.4, .12, 'bandpass', 900, .8, 2400); }catch(_){}
    const foe = team === TA ? TB : TA;
    if(id === 'freeze'){
      players.forEach(p => { if(p.team === foe && p.role !== 'keeper' && !p.dead){ p.stun = Math.max(p.stun, Math.round(P.dur * 60)); p.frozenT = P.dur; p.vel.set(0, 0); if(p.hasBall){ p.hasBall = false; ball.owner = null; } } });
    }
    if(id === 'bomb' && ball.owner && ball.owner.team === foe) explodeBomb(team);
    if(id === 'giant'){ const k = players.find(p => p.team === team && p.role === 'keeper'); if(k) k.giantT = P.dur; }
    return true;
  }

  // Ballon piégé : explosion au contact d'un adversaire, KO de tous les adversaires proches.
  function explodeBomb(team){
    const s = state[team]; s.active = null; s.t = 0;
    const foe = team === TA ? TB : TA, at = ball.pos.clone();
    gore(at.x, at.y, 40); pop(at.x, at.y, '#ffd23f', 40); pop(at.x, at.y, '#ff6a00', 30);
    shake += 16; hitStop(.12);
    try{ thump(70, 28, .7, .9); fnoise(.9, .4, 'lowpass', 1200, .6, 120); }catch(_){}
    const thrower = players.find(p => p.team === team && !p.dead) || null;
    players.forEach(p => { if(p.team === foe && p.role !== 'keeper' && !p.dead && V.dist(p.pos, at) < 105) brutalKO(p, thrower, 'BOUM !'); });
    if(ball.owner){ ball.owner.hasBall = false; ball.owner = null; }
    const a = Math.random() * Math.PI * 2; ball.vel.set(Math.cos(a) * 5, Math.sin(a) * 5); ball.z = 8; ball.vz = 6; ball.lastKicker = thrower;
    showMatchBanner('💣 BOUM !');
  }

  // À appeler à chaque image de jeu.
  function powersTick(dt){
    if(mode === 'training') return;
    for(let team = 0; team < 2; team++){
      const s = state[team];
      if(s.active){
        s.t -= dt;
        if(s.t <= 0){ s.active = null; s.t = 0; }
      }
      // IA : déclenche quand c'est utile, après un petit temps de réaction.
      const aiTeam = team === TB || mode === 'aiwatch';
      if(aiTeam && s.ready && !s.active){
        s.aiWait -= dt;
        if(s.aiWait <= 0 && aiWantsPower(team, s.ready)) activatePower(team);
      }
    }
    // Turbo : le porteur / joueur contrôlé de l'équipe sprinte sans fin et bouscule
    for(let team = 0; team < 2; team++){
      if(!powerOn(team, 'turbo')) continue;
      const runners = players.filter(p => p.team === team && !p.dead && (p.control || p.control2 || p.hasBall));
      for(const r of runners){
        r.energy = 1; r.tired = 0;
        r.sprintActive = Math.max(r.sprintActive || 0, 40); r.sprintActiveMax = Math.max(r.sprintActiveMax || 1, 60);
        for(const o of players){
          if(o.team === team || o.dead || o.role === 'keeper' || o.stun > 30) continue;
          if(V.dist(o.pos, r.pos) < r.r + o.r + 4){
            o.stun = Math.max(o.stun, 50);
            o.vel.add(o.pos.clone().sub(r.pos).norm().mul(6));
            pop(o.pos.x, o.pos.y, '#ffd23f', 10); shake += 3; sfxTackle(false);
            if(o.hasBall){ o.hasBall = false; ball.owner = null; attach(r); }
          }
        }
        if(Math.random() < .5) particles.push({ x:r.pos.x + rand(-6, 6), y:r.pos.y + rand(-6, 6), vx:-r.vel.x * .2, vy:-r.vel.y * .2, life:16, c:'#ffd23f', s:4 });
      }
    }
    players.forEach(p => { if(p.frozenT > 0) p.frozenT -= dt; if(p.giantT > 0) p.giantT -= dt; });
  }

  function aiWantsPower(team, id){
    const own = ball.owner, ours = own && own.team === team, theirs = own && own.team !== team;
    const goalX = team === TA ? field.x + field.w : field.x, ownGoalX = team === TA ? field.x : field.x + field.w;
    if(id === 'fire') return ours && Math.abs(own.pos.x - goalX) < 380;
    if(id === 'turbo' || id === 'glue') return ours;
    if(id === 'bomb') return theirs;
    if(id === 'freeze') return theirs && Math.abs(own.pos.x - ownGoalX) < 420 || ours && Math.abs(own.pos.x - goalX) < 420;
    if(id === 'giant') return theirs && Math.abs(own.pos.x - ownGoalX) < 480;
    return true;
  }

  global.POWERS = POWERS;
  global.resetPowers = resetPowers;
  global.powerOn = powerOn;
  global.powerState = powerState;
  global.addRage = addRage;
  global.activatePower = activatePower;
  global.explodeBomb = explodeBomb;
  global.powersTick = powersTick;
})(window);
