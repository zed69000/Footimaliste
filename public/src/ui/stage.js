(function(global){
  'use strict';

  // Plateau unique en paysage. Tout le jeu (canvas, HUD, menus, overlays, contrôles) vit dans #stage.
  // En portrait, c'est le plateau entier qui pivote de 90° : aucun élément ne tourne tout seul,
  // et les coordonnées tactiles passent par une seule conversion (toStage).
  const doc = global.document;
  const stage = doc.createElement('div');
  stage.id = 'stage';
  // Les éléments existants du body (hors scripts) rejoignent le plateau.
  Array.from(doc.body.children).forEach(el => { if(el.tagName !== 'SCRIPT') stage.appendChild(el); });
  doc.body.insertBefore(stage, doc.body.firstChild);

  const state = { rotated: false, w: 0, h: 0, screenW: 0 };

  function viewport(){
    const vv = global.visualViewport;
    return {
      w: Math.round((vv && vv.width) || global.innerWidth || doc.documentElement.clientWidth),
      h: Math.round((vv && vv.height) || global.innerHeight || doc.documentElement.clientHeight)
    };
  }

  function layout(){
    const v = viewport();
    const rotated = v.h > v.w;
    state.rotated = rotated;
    state.screenW = v.w;
    state.w = rotated ? v.h : v.w;
    state.h = rotated ? v.w : v.h;
    stage.style.width = state.w + 'px';
    stage.style.height = state.h + 'px';
    stage.style.transform = rotated ? `translate(${v.w}px,0) rotate(90deg)` : 'none';
    stage.style.setProperty('--sw', state.w + 'px');
    stage.style.setProperty('--sh', state.h + 'px');
    // Unité de base : 1u = 1 % de la hauteur du plateau, plancher pour rester lisible sur petits écrans.
    stage.style.setProperty('--u', Math.max(3.4, state.h / 100) + 'px');
    doc.documentElement.classList.toggle('bfRot', rotated);
    doc.documentElement.classList.toggle('bfSmall', state.h < 520);
  }

  // Coordonnées écran -> coordonnées plateau (rotation de 90° dans le sens horaire en portrait).
  function toStage(clientX, clientY){
    if(!state.rotated) return { x: clientX, y: clientY };
    return { x: clientY, y: state.screenW - clientX };
  }

  // Tactile détecté : on affiche les contrôles du pouce, même sur un écran qui annonce aussi une souris.
  function markTouch(){ doc.documentElement.classList.add('bfTouch'); }
  if(global.matchMedia && matchMedia('(pointer:coarse)').matches) markTouch();
  global.addEventListener('touchstart', markTouch, { passive: true, once: true });

  // Plein écran + verrouillage paysage au premier geste (Android). iOS refuse : la rotation du plateau prend le relais.
  let triedLock = false;
  function lockLandscape(){
    if(triedLock || !doc.documentElement.classList.contains('bfTouch')) return;
    triedLock = true;
    const root = doc.documentElement;
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    try{
      const p = req && !doc.fullscreenElement ? req.call(root, { navigationUI: 'hide' }) : null;
      Promise.resolve(p).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape')).catch(() => {}).finally(() => setTimeout(layout, 120));
    }catch(_){ }
  }
  global.addEventListener('pointerup', lockLandscape, { passive: true });

  layout();
  global.addEventListener('resize', layout, { passive: true });
  global.addEventListener('orientationchange', () => setTimeout(layout, 80), { passive: true });
  if(global.visualViewport) global.visualViewport.addEventListener('resize', layout, { passive: true });

  global.BFCStage = {
    el: stage,
    toStage,
    layout,
    lockLandscape,
    get rotated(){ return state.rotated; },
    get width(){ return state.w; },
    get height(){ return state.h; }
  };
})(window);
