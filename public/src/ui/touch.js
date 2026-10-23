(function(global){
  'use strict';

  // Contrôles tactiles, en coordonnées du plateau (BFCStage.toStage) : marche pareil en paysage réel
  // et en portrait pivoté. Chaque doigt est suivi par son pointerId.
  //  - moitié gauche : joystick qui apparaît sous le pouce ; le pousser au-delà du cercle = SPRINT ;
  //  - à droite, trois boutons identiques : TIR (jauge de charge), PASSE/TACLE, RAGE (pouvoirs).
  //  Le changement de joueur est automatique en défense (voir autoSwitchDefense dans le jeu).
  // Écrit dans les entrées du jeu : mobileMove, mobPressed, mobDown, mobReleased.
  const S = global.BFCStage;
  const root = document.getElementById('mobileControls');
  if(!S || !root) return;

  // Même plaque pour les trois boutons : contour SVG (noir + couleur), intérieur transparent pour voir le jeu.
  const SHAPE = '6,0 100,6 94,100 0,94';
  const plate = `<svg class="pl" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="${SHAPE}" fill="rgba(13,11,12,.3)" stroke="#000" stroke-width="7" vector-effect="non-scaling-stroke"/><polygon points="${SHAPE}" fill="none" stroke="currentColor" stroke-width="3.5" vector-effect="non-scaling-stroke"/></svg>`;
  const btn = (a, ic, lbl) => `<div class="tBtn ${a}" data-a="${a}">${plate}<span class="ic">${ic}</span><span class="lbl">${lbl}</span></div>`;
  root.innerHTML = '<div class="tStick" id="tStick"><i></i></div>' + btn('shoot', '⚽', 'TIR') + btn('pass', '➜', 'PASSE') + btn('power', '💢', 'RAGE');
  const stickEl = root.querySelector('#tStick'), nub = stickEl.querySelector('i');
  const btns = Array.from(root.querySelectorAll('.tBtn')).map(el => ({ el, a: el.dataset.a, lbl: el.querySelector('.lbl'), ic: el.querySelector('.ic'), ids: new Set() }));
  const shootBtn = btns.find(b => b.a === 'shoot'), passBtn = btns.find(b => b.a === 'pass'), powerBtn = btns.find(b => b.a === 'power');

  let stickId = null, origin = null, sprinting = false;

  function u(){ return parseFloat(getComputedStyle(S.el).getPropertyValue('--u')) || 4; }
  function active(){
    const c = document.documentElement.classList, b = document.body.classList;
    return c.contains('bfTouch') && !b.contains('menuAttract') && !b.contains('introRunning');
  }
  // Les écrans posés par-dessus le terrain gardent leurs touches.
  function onOverlay(t){ return t && t.closest && t.closest('#pauseOverlay,#endOverlay,#hudBtns,#albumOverlay,#campaignOverlay,#menu,#matchIntro,#debugPanel,#introOverlay'); }

  function hitButton(p){
    let best = null, bestD = Infinity;
    for(const b of btns){
      // zone de toucher élargie de 15 %, le plus proche gagne
      const hw = b.el.offsetWidth / 2, hh = b.el.offsetHeight / 2, cx = b.el.offsetLeft + hw, cy = b.el.offsetTop + hh;
      const d = Math.max(Math.abs(p.x - cx) / (hw * 1.15), Math.abs(p.y - cy) / (hh * 1.15));
      if(d <= 1 && d < bestD){ best = b; bestD = d; }
    }
    return best;
  }

  function press(b, id){
    if(!b.ids.size){ mobPressed[b.a] = true; mobDown[b.a] = true; b.el.classList.add('down'); if(typeof buzz === 'function') buzz(6); }
    b.ids.add(id);
  }
  function release(b, id){
    if(!b.ids.delete(id) || b.ids.size) return;
    mobReleased[b.a] = true; mobDown[b.a] = false; b.el.classList.remove('down');
  }

  function setSprint(on){
    if(on === sprinting) return;
    sprinting = on;
    if(on){ mobPressed.sprint = true; mobDown.sprint = true; }
    else { mobReleased.sprint = true; mobDown.sprint = false; }
    stickEl.classList.toggle('sprint', on);
  }
  function placeStickAtRest(){
    const k = u();
    stickEl.style.left = (18 * k) + 'px';
    stickEl.style.top = (S.height - 22 * k) + 'px';
    nub.style.transform = 'translate(0,0)';
    stickEl.classList.remove('on');
  }
  function stickMove(p){
    const k = u(), max = 13 * k, dead = 1.6 * k;
    let dx = p.x - origin.x, dy = p.y - origin.y;
    const l = Math.hypot(dx, dy);
    if(l < dead){ mobileMove.x = 0; mobileMove.y = 0; nub.style.transform = 'translate(0,0)'; setSprint(false); return; }
    const cl = Math.min(l, max);
    dx = dx / l * cl; dy = dy / l * cl;
    const power = Math.min(1, (l - dead) / (max - dead));
    mobileMove.x = dx / cl * power;
    mobileMove.y = dy / cl * power;
    nub.style.transform = `translate(${dx}px,${dy}px)`;
    // Pouce poussé au-delà du cercle : sprint (avec hystérésis pour ne pas clignoter sur le bord).
    setSprint(sprinting ? l > max * 1.12 : l > max * 1.3);
  }
  function stickEnd(){ stickId = null; origin = null; mobileMove.x = 0; mobileMove.y = 0; setSprint(false); placeStickAtRest(); }

  function onDown(e){
    if(!active() || onOverlay(e.target)) return;
    const p = S.toStage(e.clientX, e.clientY);
    const b = hitButton(p);
    if(b){ e.preventDefault(); press(b, e.pointerId); return; }
    if(stickId === null && p.x < S.width * .55){
      e.preventDefault();
      stickId = e.pointerId;
      const k = u(), r = 15 * k;
      origin = { x: Math.max(r, Math.min(p.x, S.width * .55)), y: Math.max(r, Math.min(p.y, S.height - r)) };
      stickEl.style.left = origin.x + 'px'; stickEl.style.top = origin.y + 'px';
      stickEl.classList.add('on');
      stickMove(p);
    }
  }
  function onMove(e){ if(e.pointerId === stickId){ e.preventDefault(); stickMove(S.toStage(e.clientX, e.clientY)); } }
  function onUp(e){
    if(e.pointerId === stickId) stickEnd();
    btns.forEach(b => release(b, e.pointerId));
  }
  global.addEventListener('pointerdown', onDown, { capture: true, passive: false });
  global.addEventListener('pointermove', onMove, { capture: true, passive: false });
  global.addEventListener('pointerup', onUp, { capture: true });
  global.addEventListener('pointercancel', onUp, { capture: true });
  global.addEventListener('blur', () => { stickEnd(); btns.forEach(b => Array.from(b.ids).forEach(id => release(b, id))); });
  root.addEventListener('contextmenu', e => e.preventDefault());

  // Libellés, jauges et état du stick, mis à jour seulement quand ils changent.
  let lastPass = '', lastShoot = '', lastCharge = -1, lastPow = '', lastStam = '';
  function frame(){
    requestAnimationFrame(frame);
    if(!active()) return;
    if(stickId === null && !stickEl.classList.contains('on')) placeStickAtRest();
    const me = typeof controlled !== 'undefined' ? controlled : null;
    const hasBall = !!(me && me.hasBall);
    const theirs = typeof ball !== 'undefined' && ball && ball.owner && me && ball.owner.team !== me.team;
    const passLbl = hasBall ? 'PASSE' : theirs ? 'TACLE' : 'PASSE';
    const shootLbl = hasBall ? 'TIR' : 'REPRISE';
    if(passLbl !== lastPass){ passBtn.lbl.textContent = passLbl; passBtn.ic.textContent = passLbl === 'TACLE' ? '💥' : '➜'; passBtn.el.classList.toggle('tackle', passLbl === 'TACLE'); lastPass = passLbl; }
    if(shootLbl !== lastShoot){ shootBtn.lbl.textContent = shootLbl; lastShoot = shootLbl; }
    // endurance sur le stick : doré en sprint, rouge à bout de souffle, cercle qui se vide
    const stam = me ? (me.tired > 0 ? 'T' : String(Math.round(Math.max(0, Math.min(1, me.energy)) * 20))) : '20';
    if(stam !== lastStam){ lastStam = stam; stickEl.classList.toggle('tired', stam === 'T'); stickEl.style.setProperty('--stam', stam === 'T' ? 0 : +stam / 20); }
    // rage dans le bouton RAGE : icône du pouvoir quand il est prêt / actif
    if(typeof powerState === 'function'){
      const ps = powerState(TA), key = ps.active ? 'A' + ps.active : ps.ready ? 'R' + ps.ready : 'G' + Math.floor(ps.rage / 4);
      if(key !== lastPow){
        lastPow = key;
        const id = ps.active || ps.ready;
        powerBtn.ic.textContent = id ? POWERS[id].icon : '💢';
        powerBtn.lbl.textContent = ps.active ? 'ACTIF' : ps.ready ? 'GO !' : 'RAGE';
        powerBtn.el.classList.toggle('ready', !!ps.ready);
        powerBtn.el.classList.toggle('on', !!ps.active);
        powerBtn.el.style.setProperty('--rage', id ? 1 : ps.rage / 100);
      }
    }
    const ch = typeof shootCharge !== 'undefined' ? shootCharge : 0;
    if(Math.abs(ch - lastCharge) > .005){
      lastCharge = ch;
      shootBtn.el.classList.toggle('charging', ch > 0);
      shootBtn.el.style.setProperty('--charge', ch.toFixed(3));
      const perfect = typeof PERFECT_SHOT !== 'undefined' && ch >= PERFECT_SHOT[0] && ch <= PERFECT_SHOT[1];
      shootBtn.el.style.setProperty('--fill', perfect ? '#fff2a0' : (typeof PERFECT_SHOT !== 'undefined' && ch > PERFECT_SHOT[1]) ? '#ff2d2d' : '#3fd8ff');
    }
  }
  placeStickAtRest();
  requestAnimationFrame(frame);
})(window);
