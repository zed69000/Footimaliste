(function(global){
  'use strict';

  // Contrôles tactiles, en coordonnées du plateau (BFCStage.toStage) : marche pareil en paysage réel
  // et en portrait pivoté. Chaque doigt est suivi par son pointerId.
  //  - moitié gauche : joystick qui apparaît sous le pouce ;
  //  - à droite : TIR (jauge de charge + zone de tir parfait), PASSE/TACLE, SPRINT, CHANGER.
  // Écrit dans les entrées du jeu : mobileMove, mobPressed, mobDown, mobReleased.
  const S = global.BFCStage;
  const root = document.getElementById('mobileControls');
  if(!S || !root) return;

  root.innerHTML = '<div class="tStick" id="tStick"><i></i></div>' +
    '<div class="tBtn shoot" data-a="shoot"><span class="ring"></span><span class="lbl">TIR</span></div>' +
    '<div class="tBtn pass" data-a="pass"><span class="lbl">PASSE</span></div>' +
    '<div class="tBtn sprint" data-a="sprint"><span class="lbl">SPRINT</span></div>' +
    '<div class="tBtn switch" data-a="switch"><span class="lbl">CHANGE</span></div>';
  const stickEl = root.querySelector('#tStick'), nub = stickEl.querySelector('i');
  const btns = Array.from(root.querySelectorAll('.tBtn')).map(el => ({ el, a: el.dataset.a, lbl: el.querySelector('.lbl'), ids: new Set() }));
  const shootBtn = btns.find(b => b.a === 'shoot'), passBtn = btns.find(b => b.a === 'pass');

  let stickId = null, origin = null;

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
      const r = b.el.offsetWidth / 2, cx = b.el.offsetLeft + r, cy = b.el.offsetTop + r;
      const d = Math.hypot(p.x - cx, p.y - cy);
      if(d < r * 1.18 && d < bestD){ best = b; bestD = d; }
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

  function placeStickAtRest(){
    const k = u();
    stickEl.style.left = (18 * k + 0) + 'px';
    stickEl.style.top = (S.height - 22 * k) + 'px';
    nub.style.transform = 'translate(0,0)';
    stickEl.classList.remove('on');
  }
  function stickMove(p){
    const k = u(), max = 13 * k, dead = 1.6 * k;
    let dx = p.x - origin.x, dy = p.y - origin.y;
    const l = Math.hypot(dx, dy);
    if(l < dead){ mobileMove.x = 0; mobileMove.y = 0; nub.style.transform = 'translate(0,0)'; return; }
    const cl = Math.min(l, max);
    dx = dx / l * cl; dy = dy / l * cl;
    const power = Math.min(1, (l - dead) / (max - dead));
    mobileMove.x = dx / cl * power;
    mobileMove.y = dy / cl * power;
    nub.style.transform = `translate(${dx}px,${dy}px)`;
  }
  function stickEnd(){ stickId = null; origin = null; mobileMove.x = 0; mobileMove.y = 0; placeStickAtRest(); }

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
  // Pas de menu contextuel / loupe sur appui long.
  root.addEventListener('contextmenu', e => e.preventDefault());

  // Libellés selon l'action possible et jauge de tir, mis à jour seulement quand ils changent.
  let lastPass = '', lastShoot = '', lastCharge = -1;
  function frame(){
    requestAnimationFrame(frame);
    if(!active()) return;
    if(stickId === null && !stickEl.classList.contains('on')) placeStickAtRest();
    const me = typeof controlled !== 'undefined' ? controlled : null;
    const hasBall = !!(me && me.hasBall);
    const theirs = typeof ball !== 'undefined' && ball && ball.owner && me && ball.owner.team !== me.team;
    const passLbl = hasBall ? 'PASSE' : theirs ? 'TACLE' : 'PASSE';
    const shootLbl = hasBall ? 'TIR' : 'REPRISE';
    if(passLbl !== lastPass){ passBtn.lbl.textContent = passLbl; passBtn.el.style.setProperty('--c', theirs && !hasBall ? 'var(--red)' : 'var(--cyan)'); lastPass = passLbl; }
    if(shootLbl !== lastShoot){ shootBtn.lbl.textContent = shootLbl; lastShoot = shootLbl; }
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
