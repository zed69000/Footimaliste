/*
 * MUSCLOR DUCK — splashscreen studio, réutilisable dans tous les projets.
 * Fichier autonome : aucune dépendance, aucun asset externe (pixel art SVG + son WebAudio).
 *
 * Usage :
 *   <script src="musclorDuckSplash.js"></script>
 *   MusclorDuck.show({ tagline: 'GAMES', onDone: () => startMyGame() });
 *   // ou : await MusclorDuck.show();
 *
 * Options : tagline (texte sous le logo), duration (ms, défaut 3400), skippable (défaut true),
 *           sound (défaut true), zIndex (défaut 99999), onDone (callback).
 * MusclorDuck.active() -> true tant que le splash est affiché (pour mettre le jeu en attente).
 * Interaction : 1er appui = active le son (QUACK + flex), appui suivant = passer.
 */
(function(global){
  'use strict';

  const PAL = {
    K:'#111111', Y:'#ffd23f', y:'#e0a000', O:'#ff7a00', o:'#c24e00', W:'#ffffff',
    R:'#e3262b', r:'#9c1015', T:'#d01820', t:'#8a0d12', N:'#1d3a8a', n:'#112459', G:'#ffd34a'
  };

  // Pixel art 40x40 : liste de rectangles [x, y, w, h, couleur].
  const BODY = [
    // jambes + pattes
    [11,28,9,6,'K'],[20,28,9,6,'K'],[12,28,7,5,'N'],[21,28,7,5,'N'],[12,31,7,2,'n'],[21,31,7,2,'n'],
    [9,33,11,3,'K'],[20,33,11,3,'K'],[10,34,9,1,'O'],[21,34,9,1,'O'],[10,33,3,1,'O'],[27,33,3,1,'O'],
    // torse (débardeur)
    [10,15,20,13,'K'],[11,15,18,12,'T'],[11,15,4,3,'Y'],[25,15,4,3,'Y'],[17,15,6,2,'Y'],[18,17,4,1,'Y'],
    [14,20,12,1,'t'],[14,23,12,1,'t'],[20,19,1,7,'t'],[11,25,18,2,'t'],
    [16,18,2,1,'W'],[22,18,2,1,'W'],
    [11,27,18,1,'K'],[19,27,2,1,'G'],
    // cou
    [17,13,6,2,'Y'],
    // tête
    [14,1,12,1,'K'],[13,2,14,12,'K'],[14,2,12,11,'Y'],[14,11,12,2,'y'],
    [19,0,2,1,'K'],[20,-1,1,1,'K'],
    // bandeau
    [13,3,14,2,'R'],[13,4,14,1,'r'],[10,4,3,1,'R'],[9,5,3,1,'R'],[8,6,2,1,'r'],
    // sourcils énervés + yeux
    [15,5,2,1,'K'],[17,6,2,1,'K'],[23,5,2,1,'K'],[21,6,2,1,'K'],
    [16,7,3,2,'W'],[21,7,3,2,'W'],[18,7,1,2,'K'],[21,7,1,2,'K'],
    // bec
    [13,9,14,1,'K'],[11,10,18,3,'K'],[12,10,16,1,'O'],[12,11,16,1,'o'],[14,12,12,1,'O'],[14,13,12,1,'K'],[17,10,1,1,'o'],[22,10,1,1,'o'],
    [18,7,1,1,'W'],[21,7,1,1,'W']
  ];
  // Bras gauche (double biceps). Le droit est son miroir.
  const ARM = [
    [2,14,10,6,'K'],[3,15,8,4,'Y'],[3,18,8,1,'y'],
    [4,12,6,3,'K'],[5,13,4,2,'Y'],            // biceps
    [1,6,6,10,'K'],[2,7,4,8,'Y'],[2,13,4,1,'y'],
    [0,3,8,5,'K'],[1,4,6,3,'Y'],[1,6,6,1,'y'],[2,4,1,1,'K'],[4,4,1,1,'K']   // poing
  ];

  function rects(list, mirror){
    return list.map(([x,y,w,h,c]) => {
      const X = mirror ? 40 - x - w : x;
      return `<rect x="${X}" y="${y}" width="${w}" height="${h}" fill="${PAL[c]}"/>`;
    }).join('');
  }

  const CSS = `
.mdk{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2vmin;background:radial-gradient(circle at 50% 42%,#3a1306 0%,#120606 55%,#050303 100%);overflow:hidden;font-family:Impact,'Arial Black',Arial,sans-serif;user-select:none;-webkit-user-select:none;touch-action:none;cursor:pointer;transition:opacity .4s ease}
.mdk.out{opacity:0}
.mdk *{box-sizing:border-box}
.mdk-rays{position:absolute;left:50%;top:42%;width:220vmax;height:220vmax;transform:translate(-50%,-50%);background:repeating-conic-gradient(rgba(255,210,63,.10) 0 8deg,transparent 8deg 20deg);animation:mdkSpin 14s linear infinite;opacity:0;transition:opacity .3s .35s}
.mdk.go .mdk-rays{opacity:1}
.mdk-stage{position:relative;width:min(42vmin,340px);aspect-ratio:1;animation:mdkDrop .38s cubic-bezier(.5,0,1,.6) both}
.mdk.shake .mdk-stage{animation:mdkDrop .38s cubic-bezier(.5,0,1,.6) both,mdkShake .32s linear}
.mdk-duck{width:100%;height:100%;overflow:visible;shape-rendering:crispEdges;filter:drop-shadow(0 1.6vmin 0 rgba(0,0,0,.45))}
.mdk-body{transform-origin:20px 36px;animation:mdkPump .55s ease-in-out .45s 4 alternate}
.mdk-arm{transform-box:view-box;animation:mdkFlex .55s ease-in-out .45s 4 alternate}
.mdk-arm.l{transform-origin:11px 17px}.mdk-arm.r{transform-origin:29px 17px;animation-name:mdkFlexR}
.mdk-sweat{position:absolute;width:3%;height:5%;background:#7fd6ff;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;opacity:0;animation:mdkSweat .9s ease-out infinite}
.mdk-shadow{position:absolute;left:18%;right:18%;bottom:-3%;height:6%;border-radius:50%;background:rgba(0,0,0,.55);filter:blur(4px)}
.mdk-dust{position:absolute;bottom:2%;width:10%;aspect-ratio:1;border-radius:50%;background:rgba(220,180,120,.55);opacity:0}
.mdk.go .mdk-dust{animation:mdkDust .6s ease-out .36s both}
.mdk-title{position:relative;display:flex;gap:.06em;font-size:min(11vmin,96px);line-height:.9;letter-spacing:.02em;color:#ffd23f;text-shadow:0 .06em 0 #b06d00,0 .12em 0 #111,0 0 .4em rgba(255,140,0,.35);-webkit-text-stroke:.025em #111}
.mdk-title span{display:inline-block;opacity:0;transform:scale(3) rotate(-12deg)}
.mdk.go .mdk-title span{animation:mdkSlam .32s cubic-bezier(.15,1.6,.3,1) both}
.mdk-title.duck{color:#fff;text-shadow:0 .06em 0 #c24e00,0 .12em 0 #111,0 0 .4em rgba(255,122,0,.4)}
.mdk-tag{font-family:Arial,Helvetica,sans-serif;font-weight:900;letter-spacing:.6em;padding-left:.6em;font-size:min(2.6vmin,20px);color:#ff7a00;opacity:0;transition:opacity .4s 1.5s}
.mdk.go .mdk-tag{opacity:1}
.mdk-hint{position:absolute;bottom:3vmin;font-family:Arial,sans-serif;font-size:min(2vmin,13px);color:rgba(255,248,223,.45);letter-spacing:.2em}
.mdk-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
.mdk.shake .mdk-flash{animation:mdkFlash .25s ease-out}
@keyframes mdkSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes mdkDrop{from{transform:translateY(-120vh) scaleY(1.2)}85%{transform:translateY(0) scaleY(1.1)}to{transform:translateY(0)}}
@keyframes mdkShake{0%,100%{translate:0 0}20%{translate:-1.4vmin .8vmin}40%{translate:1.2vmin -.6vmin}60%{translate:-.8vmin .4vmin}80%{translate:.5vmin -.2vmin}}
@keyframes mdkPump{from{transform:scale(1,1)}to{transform:scale(1.05,.96)}}
@keyframes mdkFlex{from{transform:rotate(0)}to{transform:rotate(-14deg) scale(1.08)}}
@keyframes mdkFlexR{from{transform:rotate(0)}to{transform:rotate(14deg) scale(1.08)}}
@keyframes mdkSweat{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),40%)}}
@keyframes mdkDust{from{opacity:.9;transform:translateX(0) scale(.4)}to{opacity:0;transform:translateX(var(--dx)) scale(2.2)}}
@keyframes mdkSlam{0%{opacity:0;transform:scale(3) rotate(-12deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes mdkFlash{from{opacity:.55}to{opacity:0}}
@media (prefers-reduced-motion:reduce){.mdk *{animation-duration:.01s!important;animation-iteration-count:1!important}}
`;

  // ---------- Son (WebAudio, synthétisé) ----------
  let ac = null;
  function audio(){
    if(ac) return ac;
    const AC = global.AudioContext || global.webkitAudioContext;
    if(!AC) return null;
    try{ ac = new AC(); }catch(_){ ac = null; }
    return ac;
  }
  function quack(t0, pitch){
    const a = audio(); if(!a) return;
    const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(420 * pitch, t0);
    o.frequency.exponentialRampToValueAtTime(230 * pitch, t0 + .16);
    f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 2.2;
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(.5, t0 + .015);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + .19);
    o.connect(f); f.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + .2);
  }
  function thump(t0){
    const a = audio(); if(!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t0);
    o.frequency.exponentialRampToValueAtTime(38, t0 + .3);
    g.gain.setValueAtTime(.9, t0);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + .35);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + .36);
    const n = a.createBufferSource(), buf = a.createBuffer(1, a.sampleRate * .2, a.sampleRate), d = buf.getChannelData(0);
    for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const ng = a.createGain(); ng.gain.value = .35;
    n.buffer = buf; n.connect(ng); ng.connect(a.destination); n.start(t0);
  }
  function fanfare(){
    const a = audio(); if(!a) return;
    if(a.state === 'suspended') a.resume();
    const t = a.currentTime + .02;
    thump(t);
    quack(t + .12, 1); quack(t + .34, 1.12);
    [392, 523, 659].forEach((fr, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'square'; o.frequency.value = fr;
      g.gain.setValueAtTime(.0001, t + .6 + i * .09);
      g.gain.exponentialRampToValueAtTime(.12, t + .62 + i * .09);
      g.gain.exponentialRampToValueAtTime(.0001, t + .9 + i * .09);
      o.connect(g); g.connect(a.destination);
      o.start(t + .6 + i * .09); o.stop(t + .95 + i * .09);
    });
  }

  // ---------- Splash ----------
  let current = null;

  function show(opts){
    opts = opts || {};
    if(current) return current.promise;
    const duration = opts.duration || 3400;
    const skippable = opts.skippable !== false;
    const tagline = opts.tagline == null ? 'STUDIO' : String(opts.tagline);

    if(!document.getElementById('mdk-style')){
      const st = document.createElement('style');
      st.id = 'mdk-style'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    const root = document.createElement('div');
    root.className = 'mdk';
    root.style.zIndex = opts.zIndex || 99999;
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', 'Musclor Duck ' + tagline);
    const letters = (w, d0) => w.split('').map((ch, i) => `<span style="animation-delay:${d0 + i * 55}ms">${ch}</span>`).join('');
    const sweat = [[16,22,'-60%',.5],[80,18,'60%',.9],[30,8,'-40%',1.3],[70,6,'50%',1.7]]
      .map(([l, t, dx, d]) => `<i class="mdk-sweat" style="left:${l}%;top:${t}%;--dx:${dx};animation-delay:${d}s"></i>`).join('');
    root.innerHTML = `
      <div class="mdk-rays"></div>
      <div class="mdk-stage">
        <div class="mdk-shadow"></div>
        <i class="mdk-dust" style="left:20%;--dx:-160%"></i><i class="mdk-dust" style="right:20%;--dx:160%"></i>
        <svg class="mdk-duck" viewBox="0 -1 40 38" aria-hidden="true">
          <g class="mdk-body">${rects(BODY)}
            <g class="mdk-arm l">${rects(ARM)}</g>
            <g class="mdk-arm r">${rects(ARM, true)}</g>
          </g>
        </svg>
        ${sweat}
      </div>
      <div class="mdk-title">${letters('MUSCLOR', 420)}</div>
      <div class="mdk-title duck">${letters('DUCK', 820)}</div>
      <div class="mdk-tag">${tagline}</div>
      <div class="mdk-hint">${skippable ? 'TOUCHE POUR LE SON · ENCORE POUR PASSER' : ''}</div>
      <div class="mdk-flash"></div>`;
    document.body.appendChild(root);

    let resolve, done = false, soundOn = false, timer = 0;
    const promise = new Promise(r => resolve = r);

    const finish = () => {
      if(done) return;
      done = true;
      clearTimeout(timer);
      root.classList.add('out');
      global.removeEventListener('keydown', onInput, true);
      setTimeout(() => {
        root.remove();
        current = null;
        try{ opts.onDone && opts.onDone(); }catch(e){ console.error(e); }
        resolve();
      }, 400);
    };
    // Le 1er geste débloque l'audio (règle des navigateurs) et rejoue le QUACK ; le suivant passe.
    function onInput(e){
      if(e){ e.preventDefault(); e.stopImmediatePropagation(); }
      if(opts.sound !== false && !soundOn){ soundOn = true; fanfare(); root.querySelector('.mdk-hint').textContent = skippable ? 'ENCORE POUR PASSER' : ''; return; }
      if(skippable) finish();
    }
    root.addEventListener('pointerdown', onInput);
    root.addEventListener('pointerup', e => { e.preventDefault(); e.stopImmediatePropagation(); });
    root.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); });
    global.addEventListener('keydown', onInput, true);

    requestAnimationFrame(() => {
      root.classList.add('go');
      setTimeout(() => {
        root.classList.add('shake');
        // Son auto seulement si l'audio est déjà autorisé (sinon il viendra au 1er geste).
        const a = opts.sound !== false && audio();
        if(a && a.state === 'running'){ soundOn = true; fanfare(); }
      }, 360);
    });
    timer = setTimeout(finish, duration);

    current = { promise, finish };
    return promise;
  }

  global.MusclorDuck = Object.freeze({
    show,
    skip(){ current && current.finish(); },
    active(){ return !!current; },
    version: '1.0.0'
  });
})(window);
