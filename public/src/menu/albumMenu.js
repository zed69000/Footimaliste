(function(global){
  'use strict';

  // UI de l'album BRUTAL CARDS : album, ouverture de paquets, récompenses de fin de match.
  // Dépend de BFC_STICKERS et, à l'exécution, des globales du jeu (countries, profileFor, flagFor, tone, noise).
  const S = global.BFC_STICKERS;
  if(!S) return;

  const CSS = `
#albumOverlay{position:absolute;inset:0;z-index:70;display:none;flex-direction:column;align-items:center;justify-content:flex-start;padding:10px;overflow:hidden;background:radial-gradient(circle at 50% 0%,rgba(255,211,74,.22),transparent 30%),linear-gradient(180deg,#2a0909 0%,#120d14 60%,#07090c 100%);color:#fff8df;font-family:Arial,Helvetica,sans-serif;touch-action:pan-y}
#albumOverlay.open{display:flex}
.alb-wrap{width:min(980px,100%);display:flex;flex-direction:column;gap:10px}
.alb-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.alb-title{font-family:'Bowlby One',Impact,'Arial Black',sans-serif;font-size:28px;letter-spacing:1px;color:#ff3838;text-shadow:0 3px 0 #4b0000;flex:1;min-width:180px}
.alb-title small{display:block;font-family:Arial,sans-serif;font-size:11px;color:#ffd34a;letter-spacing:2px;text-shadow:none}
.alb-btn{border:1px solid rgba(255,255,255,.14);border-radius:12px;min-height:42px;padding:0 14px;font-weight:900;color:#fff8df;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.03));cursor:pointer;touch-action:manipulation;font-size:13px}
.alb-btn.primary{background:linear-gradient(180deg,#ffcf40,#b77800);color:#160d00;border-color:#ffe08a;box-shadow:0 4px 0 #5b3000}
.alb-btn.hot{animation:albPulse 1s ease-in-out infinite}
.alb-btn:disabled{opacity:.4;cursor:default;animation:none}
.alb-btn.focused{outline:3px solid rgba(255,211,74,.55)}
@keyframes albPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.alb-bars{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.alb-bar{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(0,0,0,.28);padding:7px 10px;font-size:11px;font-weight:900}
.alb-bar .lbl{display:flex;justify-content:space-between;color:var(--muted,#d9d2bd);margin-bottom:5px}
.alb-track{height:10px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.alb-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#ff3333,#ffd34a);transition:width .8s cubic-bezier(.2,.9,.3,1)}
.alb-pager{display:grid;grid-template-columns:48px 1fr 48px;gap:8px;align-items:center}
.alb-pageName{text-align:center;font-weight:900;font-size:20px}
.alb-pageName small{display:block;font-size:11px;color:#ffd34a;letter-spacing:1px}
.alb-page{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;padding:14px;border-radius:18px;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 2px,transparent 2px 22px),linear-gradient(180deg,#f3ead2,#d9ccaa);box-shadow:inset 0 0 0 6px rgba(0,0,0,.08),0 20px 50px rgba(0,0,0,.45);position:relative}
.alb-page.complete::after{content:'COMPLET ★ +2 PAQUETS';position:absolute;right:14px;top:-12px;padding:5px 10px;border-radius:8px;background:#c40000;color:#fff;font-weight:900;font-size:11px;transform:rotate(3deg);box-shadow:0 3px 0 #500}
.alb-flags{display:flex;justify-content:center;gap:6px;overflow:hidden;padding:4px 2px 8px}
.alb-flag{flex:0 0 auto;min-width:46px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;padding:4px 4px 3px;cursor:pointer;text-align:center;font-size:20px;line-height:1}
.alb-flag small{display:block;font-size:9px;font-weight:900;margin-top:2px;color:#d9d2bd}
.alb-flag.cur{border-color:#ffd34a;background:rgba(255,211,74,.22)}
.alb-flag.done small{color:#ffd34a}
.alb-hint{text-align:center;font-size:11px;color:#d9d2bd}

/* Stickers */
/* Sticker BRUTAL CARDS : fond rayonnant aux couleurs du pays (façon Tazo) + trame, grand numéro de maillot
   en fond (façon Panini), joueur cube détouré blanc/noir au centre, logo BFC en coin, bandeau nom en bas. */
.stk{position:relative;aspect-ratio:4/5;border-radius:8%/6.4%;overflow:hidden;container-type:inline-size;color:#fff;font-weight:900;user-select:none;
  --ray:color-mix(in srgb,var(--kit) 72%,var(--stripe));
  background:radial-gradient(circle at 50% 44%,rgba(255,255,255,.5),transparent 40%),
    radial-gradient(rgba(0,0,0,.18) 24%,transparent 28%) 0 0/6px 6px,
    repeating-conic-gradient(from -6deg at 50% 44%,var(--kit) 0 9deg,var(--ray) 9deg 18deg);
  box-shadow:0 0 0 3px #fff,0 0 0 5px #0d0b0c,3px 5px 0 5px rgba(0,0,0,.4)}
.stk .jn{position:absolute;right:-2%;top:-4%;z-index:1;font-family:'Bowlby One',Impact,sans-serif;font-size:62cqw;line-height:1;color:rgba(255,255,255,.18);-webkit-text-stroke:1.4cqw rgba(255,255,255,.85)}
.stk .lg{position:absolute;left:5%;top:5%;z-index:4;padding:1.5cqw 3cqw;background:#ffd23f;color:#120c0a;font-family:'Bowlby One',Impact,sans-serif;font-size:8cqw;line-height:1;
  clip-path:polygon(4% 10%,100% 0,94% 92%,0 100%);transform:rotate(-8deg);filter:drop-shadow(1px 1px 0 #000)}
.stk .flg{position:absolute;right:5%;top:5%;z-index:4;font-size:10cqw;line-height:1;color:#fff;text-shadow:0 0 2px #000,0 0 2px #000}
.stk .pl{position:absolute;left:50%;top:15%;width:44%;aspect-ratio:1;transform:translateX(-50%) rotate(-4deg);z-index:2;background:var(--skin);
  box-shadow:0 0 0 1.4cqw #0d0b0c,0 0 0 3.4cqw #fff,0 0 0 4.6cqw #0d0b0c,3cqw 4cqw 0 4.6cqw rgba(0,0,0,.35)}
.stk .pl .ar{position:absolute;top:55%;width:26%;height:2.6cqw;background:#0d0b0c;filter:drop-shadow(0 0 .8cqw #fff) drop-shadow(0 0 .4cqw #fff)}
.stk .pl .ar.l{right:calc(100% + 4.4cqw);transform-origin:right center;transform:rotate(-24deg)}
.stk .pl .ar.r{left:calc(100% + 4.4cqw);transform-origin:left center;transform:rotate(24deg)}
.stk .pl .lgs{position:absolute;left:24%;right:24%;top:calc(100% + 4cqw);height:22%;border-left:2.6cqw solid #0d0b0c;border-right:2.6cqw solid #0d0b0c;filter:drop-shadow(0 0 .8cqw #fff) drop-shadow(0 0 .4cqw #fff)}
.stk .pl .hr{position:absolute;left:0;top:0;width:100%;height:13%;background:var(--hair)}
.stk .pl.h-shaved .hr{height:5%}.stk .pl.h-long .hr,.stk .pl.h-curly .hr{height:21%}.stk .pl.h-mohawk .hr{left:38%;width:24%;height:19%}
.stk .pl .ey{position:absolute;left:46%;top:21%;width:8%;height:24%;background:#1a1414}
.stk .pl .bd{position:absolute;left:0;bottom:0;width:100%;height:50%;background:var(--kit)}
.stk .pl .bd::after{content:'';position:absolute;left:0;right:0;bottom:0;height:22%;background:var(--stripe)}
.stk .pl.h-beard .bd::before{content:'';position:absolute;left:0;right:0;top:-14%;height:14%;background:var(--hair)}
.stk .band{position:absolute;left:4%;right:4%;bottom:4.5%;z-index:4;padding:2.4cqw 4cqw 2.8cqw;background:#0d0b0c;clip-path:polygon(0 12%,100% 0,98% 100%,2% 92%);text-align:left}
.stk .no{display:inline-block;margin-right:2cqw;padding:0 2cqw;background:#ffd23f;color:#120c0a;font-size:7.5cqw;line-height:1.3;vertical-align:middle}
.stk .nm{display:inline;font-family:'Bowlby One',Impact,sans-serif;font-weight:400;font-size:10cqw;line-height:1.05;text-transform:uppercase;vertical-align:middle}
.stk .rt{display:block;margin-top:1cqw;font-size:6.6cqw;letter-spacing:.06em;color:#ffd23f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stk .cnt{position:absolute;right:5%;top:20%;z-index:5;padding:.5cqw 3cqw;background:#e01b22;color:#fff;font-size:9cqw;line-height:1.2;clip-path:polygon(6% 0,100% 8%,94% 100%,0 92%)}
/* rare : reflet argenté qui passe */
.stk.rare{box-shadow:0 0 0 3px #e8f1fa,0 0 0 5px #0d0b0c,3px 5px 0 5px rgba(0,0,0,.4)}
.stk.rare::before{content:'';position:absolute;inset:0;z-index:5;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.55) 45%,transparent 60%);background-size:250% 100%;animation:stkShine 2.8s linear infinite}
/* légende : rayons dorés, cadre or, holo arc-en-ciel */
.stk.legend{--kit-l:#ffd23f;background:radial-gradient(circle at 50% 44%,rgba(255,255,255,.7),transparent 40%),radial-gradient(rgba(0,0,0,.18) 24%,transparent 28%) 0 0/6px 6px,repeating-conic-gradient(from -6deg at 50% 44%,#ffd23f 0 9deg,#ff8a00 9deg 18deg);
  box-shadow:0 0 0 3px #ffd23f,0 0 0 5px #0d0b0c,0 0 16px 6px rgba(255,210,63,.6)}
.stk.legend::before{content:'';position:absolute;inset:0;z-index:5;pointer-events:none;mix-blend-mode:overlay;background:linear-gradient(115deg,#ff3333,#ffd34a,#53d7ff,#35e86b,#ff3333);background-size:300% 300%;opacity:.5;animation:stkHolo 3s linear infinite}
.stk.legend .lg{background:#e01b22;color:#fff}
/* sanglant : éclaboussures */
.stk.bloody::after{content:'';position:absolute;inset:0;z-index:4;pointer-events:none;background:radial-gradient(circle at 22% 34%,rgba(196,0,0,.92) 0 8%,transparent 9%),radial-gradient(circle at 76% 58%,rgba(140,0,0,.9) 0 11%,transparent 12%),radial-gradient(circle at 62% 24%,rgba(196,0,0,.85) 0 4%,transparent 5%),radial-gradient(circle at 33% 66%,rgba(196,0,0,.8) 0 5%,transparent 6%),radial-gradient(circle at 86% 36%,rgba(120,0,0,.85) 0 3%,transparent 4%)}
/* emplacement vide : silhouette + numéro, sur papier tramé */
.stk.empty{background:radial-gradient(rgba(60,40,10,.16) 24%,transparent 28%) 0 0/6px 6px,#d8cba6;box-shadow:inset 0 0 0 2px rgba(60,40,10,.35),inset 0 3px 10px rgba(0,0,0,.18);color:rgba(60,40,10,.75)}
.stk.empty .sil{position:absolute;left:50%;top:24%;width:44%;aspect-ratio:1;transform:translateX(-50%);background:rgba(60,40,10,.22)}
.stk.empty .sil::after{content:'?';position:absolute;inset:0;display:grid;place-items:center;font-family:'Bowlby One',Impact,sans-serif;font-size:24cqw;color:rgba(255,255,255,.55)}
.stk.empty .num{position:absolute;left:0;right:0;bottom:16%;text-align:center;font-family:'Bowlby One',Impact,sans-serif;font-size:13cqw;line-height:1}
.stk.empty .role{position:absolute;left:0;right:0;bottom:7%;text-align:center;font-size:7cqw;letter-spacing:.14em}
@keyframes stkShine{from{background-position:150% 0}to{background-position:-100% 0}}
@keyframes stkHolo{from{background-position:0% 50%}to{background-position:300% 50%}}

/* Paquet */
.pk-stage{min-height:min(70vh,520px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.pk{position:relative;width:min(220px,46vw);aspect-ratio:3/4.3;border-radius:14px;cursor:pointer;background:linear-gradient(135deg,#c40000 0%,#ff3333 30%,#ffd34a 50%,#ff3333 70%,#7a0000 100%);background-size:220% 220%;animation:stkHolo 4s linear infinite,pkIdle 1.6s ease-in-out infinite;box-shadow:0 20px 50px rgba(0,0,0,.6),inset 0 0 0 4px rgba(255,255,255,.35);display:grid;place-items:center;text-align:center}
.pk::before{content:'';position:absolute;left:0;right:0;top:9%;height:3px;background:repeating-linear-gradient(90deg,#fff 0 6px,transparent 6px 10px);opacity:.7}
.pk .pk-logo{font-family:'Bowlby One',Impact,'Arial Black',sans-serif;font-size:30px;line-height:.9;color:#fff;text-shadow:0 3px 0 #500,0 0 18px rgba(0,0,0,.5)}
.pk .pk-logo small{display:block;font-size:12px;letter-spacing:3px;margin-top:6px;color:#160d00;text-shadow:none}
.pk.shake{animation:pkShake .12s linear infinite}
.pk.torn{animation:pkTear .45s ease-in forwards}
@keyframes pkIdle{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-8px) rotate(2deg)}}
@keyframes pkShake{0%{transform:translate(-3px,1px) rotate(-3deg)}50%{transform:translate(3px,-1px) rotate(3deg)}100%{transform:translate(-3px,1px) rotate(-3deg)}}
@keyframes pkTear{to{transform:scale(1.4) rotate(8deg);opacity:0;filter:brightness(2)}}
.pk-row{display:grid;grid-template-columns:repeat(5,minmax(0,150px));gap:12px;justify-content:center;width:100%}
.fl{perspective:800px;cursor:pointer;animation:flIn .35s cubic-bezier(.2,1.4,.4,1) backwards}
@keyframes flIn{from{transform:translateY(60px) scale(.6);opacity:0}}
.fl-in{position:relative;transition:transform .5s cubic-bezier(.3,1.3,.5,1);transform-style:preserve-3d}
.fl.up .fl-in{transform:rotateY(180deg)}
.fl-back,.fl-front{backface-visibility:hidden;-webkit-backface-visibility:hidden}
.fl-back{position:absolute;inset:0;border-radius:10px;border:3px solid #fff;background:repeating-linear-gradient(45deg,#c40000 0 10px,#8a0000 10px 20px);display:grid;place-items:center;font-family:'Bowlby One',Impact,sans-serif;font-size:22px;color:#ffd34a;box-shadow:0 8px 18px rgba(0,0,0,.4)}
.fl-back.glow-rare{box-shadow:0 0 18px 4px rgba(200,230,255,.75)}
.fl-back.glow-legend{box-shadow:0 0 28px 8px rgba(255,211,74,.95);animation:pkShake .2s linear infinite}
.fl-front{transform:rotateY(180deg)}
.fl-tag{text-align:center;font-size:12px;font-weight:900;margin-top:6px;min-height:16px;opacity:0;transition:opacity .2s .35s}
.fl.up .fl-tag{opacity:1}
.fl-tag .new{color:#35e86b}.fl-tag .dup{color:#d9d2bd}.fl-tag .bl{color:#ff4545}
.alb-flash{position:fixed;inset:0;z-index:80;pointer-events:none;background:radial-gradient(circle,rgba(255,230,140,.9),rgba(255,211,74,0) 70%);animation:albFlash .6s ease-out forwards}
@keyframes albFlash{from{opacity:1}to{opacity:0}}
.pk-done{font-size:14px;font-weight:900;text-align:center;color:#ffd34a}

/* Récompense fin de match */
#albumReward{margin:12px auto 0;max-width:420px;text-align:left;border:1px solid rgba(255,211,74,.25);border-radius:14px;background:rgba(0,0,0,.35);padding:10px 12px;font-size:12px}
#albumReward .rw-line{display:flex;justify-content:space-between;animation:rwIn .3s backwards}
#albumReward .rw-line b{color:#ffd34a}
#albumReward .rw-total{margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.12);font-weight:900;display:flex;justify-content:space-between}
#albumReward .rw-earn{margin-top:8px;text-align:center;font-weight:900;font-size:16px;color:#35e86b;animation:rwIn .3s backwards,albPulse 1s ease-in-out .4s infinite}
#albumReward .rw-next{margin-top:4px;text-align:center;color:#d9d2bd;font-size:11px}
@keyframes rwIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
#albumToast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(calc(100% + 40px));z-index:90;padding:10px 16px;border-radius:14px;background:linear-gradient(180deg,#ffcf40,#b77800);color:#160d00;font-weight:900;font-size:14px;box-shadow:0 6px 0 #5b3000,0 16px 30px rgba(0,0,0,.4);transition:transform .35s cubic-bezier(.2,1.4,.4,1);pointer-events:none;text-align:center}
#albumToast.on{transform:translateX(-50%) translateY(0)}
.albMenuBadge{margin-left:6px;padding:2px 7px;border-radius:99px;background:#ff3333;color:#fff;font-size:11px;box-shadow:0 2px 0 #500;animation:albPulse 1s ease-in-out infinite;display:inline-block}

@media (max-width:820px),(max-height:560px){
  #albumOverlay{padding:6px}
  .alb-title{font-size:20px;min-width:120px}
  .alb-btn{min-height:34px;padding:0 9px;font-size:11px}
  .alb-page{gap:6px;padding:8px}
  .alb-bars{gap:5px}
  .pk-row{gap:6px}
  .pk-stage{min-height:auto}
}
/* Téléphone (paysage réel ou paysage forcé en portrait) : tout tient dans la hauteur, rien ne défile. */
#albumOverlay{container-type:size}
@media all{html.bfSmall #albumOverlay{padding:6px 10px;overflow:hidden}}
@media all{
  html.bfSmall .alb-wrap{gap:5px;height:100%}
  html.bfSmall .alb-title{font-size:18px;min-width:0}
  html.bfSmall .alb-title small{display:none}
  html.bfSmall .alb-btn{min-height:38px;padding:0 12px;font-size:13px;border-radius:10px}
  html.bfSmall .alb-bars{gap:5px}
  html.bfSmall .alb-bar{padding:4px 8px;font-size:11px}
  html.bfSmall .alb-bar .lbl{margin-bottom:3px}
  html.bfSmall .alb-track{height:7px}
  html.bfSmall .alb-pager{grid-template-columns:40px 1fr 40px}
  html.bfSmall .alb-pageName{font-size:18px}
  html.bfSmall .alb-pageName small{font-size:11px}
  html.bfSmall .alb-page{grid-template-columns:repeat(6,minmax(0,min(130px,28cqh)));justify-content:center;gap:6px;padding:7px}
  html.bfSmall .alb-page.complete::after{top:-8px;font-size:9px;padding:3px 7px}
  html.bfSmall .alb-flags{padding:2px 0 4px}
  html.bfSmall .alb-flag{min-width:40px;font-size:17px}
  html.bfSmall .alb-flag small{font-size:10px}
  html.bfSmall .alb-hint{display:none}
  html.bfSmall .pk-stage{min-height:0;gap:8px;flex:1}
  html.bfSmall .pk{width:min(200px,30cqh)}
  html.bfSmall .pk .pk-logo{font-size:min(30px,7cqh)}
  html.bfSmall .pk-row{grid-template-columns:repeat(5,minmax(0,min(140px,31cqh)));gap:8px}
  html.bfSmall .fl-tag{font-size:12px;margin-top:3px}
  html.bfSmall .pk-done{font-size:14px}
  html.bfSmall #albumReward{margin-top:6px;padding:6px 10px;font-size:13px}
  html.bfSmall #albumReward .rw-line{display:none}
  html.bfSmall #albumReward .rw-total{margin-top:0;padding-top:0;border-top:0}
  html.bfSmall #albumReward .rw-earn{margin-top:4px;font-size:13px}
  html.bfSmall #endOverlay .overlayTopIcon{display:none}
  html.bfSmall #endOverlay .endCard{padding:12px 14px!important}
  html.bfSmall #endOverlay .endCard h2{font-size:30px!important}
  html.bfSmall #endOverlay .endBtns{margin-top:8px!important}
  html.bfSmall #endOverlay .endBtns button{padding:9px 12px!important;font-size:12px!important}
}
`;

  let state = S.load();
  let overlay = null, toastEl = null;
  let view = 'album', page = 0, returnTo = null;
  let pack = null;                 // {cards, completed, flipped:Set, phase:'sealed'|'cards'}
  let match = { active:false, kos:0 };
  let closedAt = 0, focus = 0, padPrev = {}, padRaf = 0;
  const dailyGift = S.claimDaily(state);

  function teams(){ return (typeof countries !== 'undefined' && countries) ? countries : []; }
  function teamCount(){ return teams().length; }
  function flag(c){ return typeof flagFor === 'function' ? flagFor(c) : '🏳️'; }
  function profile(c, slot){
    if(typeof profileFor === 'function') return profileFor(c, slot);
    return { name:'Joueur', skin:'#d8a06f', hairStyle:'short', hairColor:'#22150e' };
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]); }
  function sfx(kind){
    try{
      if(typeof resumeAudio === 'function') resumeAudio();
      if(typeof tone !== 'function') return;
      if(kind === 'tear'){ if(typeof noise === 'function') noise(.35, .2, 1800); tone(220, .2, 'sawtooth', .08, 2.2); }
      else if(kind === 'flip') tone(620, .06, 'triangle', .07, 1.3);
      else if(kind === 'new'){ tone(660, .08, 'triangle', .07, 1.2); setTimeout(() => tone(990, .1, 'triangle', .06, 1.1), 70); }
      else if(kind === 'rare'){ [700, 880, 1100].forEach((f, i) => setTimeout(() => tone(f, .1, 'triangle', .08, 1.1), i * 70)); }
      else if(kind === 'legend'){ [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, .16, 'triangle', .09, 1.05), i * 90)); if(typeof noise === 'function') noise(.6, .18, 900); }
      else if(kind === 'coin') tone(1200, .05, 'triangle', .05, 1.4);
    }catch(_){}
  }

  // Numéros de maillot par poste (GK, DEF, MID, ATT, JOKER, CAP), affichés en grand derrière le joueur.
  const JERSEY = [1, 4, 8, 9, 10, 7];
  function stickerHtml(id, opts){
    opts = opts || {};
    const c = teams()[S.teamOf(id)];
    const slot = S.slotOf(id);
    const owned = opts.force || state.owned[id] > 0;
    if(!c) return '';
    if(!owned){
      return `<div class="stk empty"><span class="sil"></span><span class="num">#${S.stickerNumber(id)}</span><span class="role">${S.ROLES[slot]}</span></div>`;
    }
    const p = profile(c, slot);
    const rarity = S.rarityOf(id);
    const bloody = opts.bloody !== undefined ? opts.bloody : !!state.bloody[id];
    const hair = 'h-' + String(p.hairStyle || 'short').replace(/[^a-z]/gi, '');
    const copies = state.owned[id] || 0;
    const cnt = opts.showCount && copies > 1 ? `<span class="cnt">×${copies}</span>` : '';
    const code = typeof hudAbbr === 'function' ? hudAbbr(c) : c.name.slice(0, 3).toUpperCase();
    return `<div class="stk ${rarity} ${bloody ? 'bloody' : ''}" style="--kit:${c.color};--stripe:${c.stripe};--skin:${p.skin};--hair:${p.hairColor}">
      <span class="jn">${JERSEY[slot]}</span><span class="lg">BFC</span><span class="flg">${flag(c)}</span>
      <div class="pl ${hair}"><span class="ar l"></span><span class="ar r"></span><span class="lgs"></span><span class="hr"></span><span class="ey"></span><span class="bd"></span></div>
      ${cnt}<div class="band"><span class="no">${S.stickerNumber(id)}</span><span class="nm">${esc(p.name)}</span><span class="rt">${code} · ${S.ROLES[slot]}${rarity !== 'common' ? ' · ' + S.RARITY[rarity].label : ''}${bloody ? ' · SANGLANT' : ''}</span></div></div>`;
  }

  function ensureDom(){
    if(overlay) return;
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    overlay = document.createElement('div');
    overlay.id = 'albumOverlay';
    (document.getElementById('stage')||document.body).appendChild(overlay);
    toastEl = document.createElement('div');
    toastEl.id = 'albumToast';
    (document.getElementById('stage')||document.body).appendChild(toastEl);
    overlay.addEventListener('click', onClick);
    overlay.addEventListener('pointerdown', e => e.stopPropagation());
    overlay.addEventListener('pointerup', e => e.stopPropagation());
    global.addEventListener('keydown', onKey, true);
  }

  function toast(msg){
    ensureDom();
    toastEl.innerHTML = msg;
    toastEl.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('on'), 2600);
  }

  function bars(){
    const total = S.totalStickers(teamCount()), have = S.uniqueCount(state);
    return `<div class="alb-bars">
      <div class="alb-bar"><div class="lbl"><span>ALBUM</span><span>${have}/${total} · ${Math.floor(have / Math.max(1, total) * 100)}%</span></div><div class="alb-track"><div class="alb-fill" style="width:${have / Math.max(1, total) * 100}%"></div></div></div>
      <div class="alb-bar"><div class="lbl"><span>PROCHAIN PAQUET</span><span>${state.points}/${S.PACK_COST} pts</span></div><div class="alb-track"><div class="alb-fill" style="width:${state.points / S.PACK_COST * 100}%"></div></div></div>
    </div>`;
  }

  function header(sub){
    const doubles = S.doublesCount(state);
    return `<div class="alb-head">
      <div class="alb-title">📒 BRUTAL CARDS<small>${sub}</small></div>
      <button class="alb-btn primary ${state.packs > 0 ? 'hot' : ''}" data-act="pack" ${state.packs > 0 ? '' : 'disabled'}>🎁 OUVRIR (${state.packs})</button>
      <button class="alb-btn" data-act="trade" ${doubles >= S.TRADE_COST ? '' : 'disabled'} title="${S.TRADE_COST} doubles = 1 paquet">♻ TROC ${doubles}/${S.TRADE_COST}</button>
      <button class="alb-btn" data-act="close">✕ ${returnTo === 'end' ? 'RETOUR' : 'MENU'}</button>
    </div>`;
  }

  function renderAlbum(){
    const list = teams();
    page = ((page % list.length) + list.length) % list.length;
    const c = list[page];
    const have = S.teamProgress(state, page);
    let cells = '';
    for(let s = 0; s < S.PER_TEAM; s++) cells += stickerHtml(page * S.PER_TEAM + s, { showCount:true });
    const flags = list.map((t, i) => [t, i]).filter(([t, i]) => { const d = Math.abs(i - page); return Math.min(d, list.length - d) <= 7; }).sort((a, b) => ((a[1] - page + list.length + 7) % list.length) - ((b[1] - page + list.length + 7) % list.length)).map(([t, i]) => {
      const n = S.teamProgress(state, i);
      return `<button class="alb-flag ${i === page ? 'cur' : ''} ${n === S.PER_TEAM ? 'done' : ''}" data-page="${i}">${flag(t)}<small>${n === S.PER_TEAM ? '★' : n + '/6'}</small></button>`;
    }).join('');
    const streak = state.streak >= 2 ? ` · 🔥 ${state.streak} jours d'affilée` : '';
    overlay.innerHTML = `<div class="alb-wrap">
      ${header('Collectionne les ' + S.totalStickers(list.length) + ' joueurs' + streak)}
      ${bars()}
      <div class="alb-pager"><button class="alb-btn" data-act="prev">‹</button><div class="alb-pageName">${flag(c)} ${esc(c.name)}<small>PAGE ${page + 1}/${list.length} · ${have}/6 ${have === S.PER_TEAM ? '· COMPLÈTE' : '· complète la page = +2 paquets'}</small></div><button class="alb-btn" data-act="next">›</button></div>
      <div class="alb-page ${have === S.PER_TEAM ? 'complete' : ''}">${cells}</div>
      <div class="alb-flags">${flags}</div>
      <div class="alb-hint">Gagne des points en match (victoire, buts, KO sanglants) · 1 paquet offert par jour · Chaque KO augmente tes chances de sticker SANGLANT</div>
    </div>`;
    focus = 0;
  }

  function renderPack(){
    if(!pack){
      overlay.innerHTML = `<div class="alb-wrap">${header(state.packs + ' paquet(s) à ouvrir')}<div class="pk-stage">
        <div class="pk" data-act="tear"><div class="pk-logo">BRUTAL<br>CARDS<small>5 STICKERS</small></div></div>
        <div class="alb-hint">Touche le paquet (A / Espace) pour le déchirer</div></div></div>`;
      return;
    }
    const cards = pack.cards.map((c, i) => {
      const up = pack.flipped.has(i);
      const tag = c.isNew ? '<span class="new">★ NOUVEAU !</span>' : `<span class="dup">DOUBLE ×${c.copies}</span>`;
      const bl = c.bloody ? ' <span class="bl">🩸</span>' : '';
      return `<div class="fl ${up ? 'up' : ''}" data-flip="${i}" style="animation-delay:${i * 90}ms">
        <div class="fl-in"><div class="fl-back glow-${c.rarity}">BFC</div><div class="fl-front">${stickerHtml(c.id, { force:true, bloody:c.bloody })}</div></div>
        <div class="fl-tag">${tag}${bl}</div></div>`;
    }).join('');
    const allUp = pack.flipped.size === pack.cards.length;
    const newCount = pack.cards.filter(c => c.isNew).length;
    const completed = pack.completed.map(t => `${flag(teams()[t])} ${esc(teams()[t].name)}`).join(', ');
    const footer = allUp
      ? `<div class="pk-done">${newCount} nouveau(x) sticker(s)${completed ? ' · PAGE COMPLÈTE : ' + completed + ' → +2 paquets !' : ''}</div>
         <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
           ${state.packs > 0 ? `<button class="alb-btn primary hot" data-act="pack">🎁 PAQUET SUIVANT (${state.packs})</button>` : ''}
           <button class="alb-btn ${state.packs > 0 ? '' : 'primary'}" data-act="album">📒 COLLER DANS L'ALBUM</button></div>`
      : `<div style="display:flex;gap:8px;justify-content:center"><button class="alb-btn primary" data-act="flipall">TOUT RETOURNER</button></div>
         <div class="alb-hint">Touche une carte pour la retourner</div>`;
    overlay.innerHTML = `<div class="alb-wrap">${header('Ouverture de paquet')}<div class="pk-stage"><div class="pk-row">${cards}</div>${footer}</div></div>`;
  }

  function render(){
    ensureDom();
    if(view === 'pack') renderPack(); else renderAlbum();
    applyFocus();
  }

  function tear(){
    const el = overlay.querySelector('.pk');
    if(!el || el.classList.contains('shake')) return;
    sfx('tear');
    el.classList.add('shake');
    setTimeout(() => {
      el.classList.remove('shake');
      el.classList.add('torn');
      setTimeout(() => {
        const res = S.openPack(state, teamCount(), { koBonus: state.koBonus || 0 });
        if(!res){ view = 'album'; render(); return; }
        pack = { cards: res.cards, completed: res.completed, flipped: new Set() };
        // Les meilleures cartes à la fin : suspense jusqu'au bout.
        const order = { common:0, rare:1, legend:2 };
        pack.cards.sort((a, b) => order[a.rarity] - order[b.rarity] || (a.isNew - b.isNew));
        render();
      }, 420);
    }, 650);
  }

  function flip(i){
    if(!pack || pack.flipped.has(i)) return;
    pack.flipped.add(i);
    const c = pack.cards[i];
    const el = overlay.querySelector(`[data-flip="${i}"]`);
    if(el) el.classList.add('up');
    sfx('flip');
    setTimeout(() => {
      if(c.rarity === 'legend'){ sfx('legend'); const f = document.createElement('div'); f.className = 'alb-flash'; (document.getElementById('stage')||document.body).appendChild(f); setTimeout(() => f.remove(), 700); }
      else if(c.rarity === 'rare') sfx('rare');
      else if(c.isNew) sfx('new');
    }, 260);
    if(pack.flipped.size === pack.cards.length) setTimeout(render, 700);
  }

  function goToBestPage(){
    if(!pack) return;
    const best = pack.cards.filter(c => c.isNew).sort((a, b) => S.RARITY[a.rarity].weight - S.RARITY[b.rarity].weight)[0] || pack.cards[0];
    page = S.teamOf(best.id);
  }

  function act(name, el){
    if(name === 'close') return close();
    if(name === 'prev'){ page--; sfx('flip'); return render(); }
    if(name === 'next'){ page++; sfx('flip'); return render(); }
    if(name === 'pack'){ if(state.packs <= 0) return; pack = null; view = 'pack'; return render(); }
    if(name === 'tear') return tear();
    if(name === 'flipall'){ pack && pack.cards.forEach((_, i) => setTimeout(() => flip(i), i * 160)); return; }
    if(name === 'album'){ goToBestPage(); pack = null; view = 'album'; return render(); }
    if(name === 'trade'){ if(S.trade(state)){ sfx('coin'); toast('♻ Troc réussi : +1 paquet !'); render(); } return; }
  }

  function onClick(e){
    const a = e.target.closest('[data-act]');
    if(a && !a.disabled){ e.preventDefault(); return act(a.dataset.act, a); }
    const f = e.target.closest('[data-flip]');
    if(f) return flip(+f.dataset.flip);
    const p = e.target.closest('[data-page]');
    if(p){ page = +p.dataset.page; sfx('flip'); render(); }
  }

  // Navigation clavier/manette : gauche/droite = pages (album) ou focus, A = action principale, B = retour.
  function focusables(){ return Array.from(overlay.querySelectorAll('.alb-head [data-act]:not(:disabled), .pk-stage [data-act]:not(:disabled), .pk-stage [data-flip]:not(.up)')); }
  function applyFocus(){
    const items = focusables();
    items.forEach((el, i) => el.classList.toggle('focused', i === focus));
  }
  function primary(){
    if(view === 'pack'){
      if(!pack) return tear();
      const next = pack.cards.findIndex((_, i) => !pack.flipped.has(i));
      if(next >= 0) return flip(next);
      return act(state.packs > 0 ? 'pack' : 'album');
    }
    const items = focusables();
    if(items[focus]) items[focus].click();
  }
  function back(){
    if(view === 'pack' && (!pack || pack.flipped.size === pack.cards.length)){ pack = null; view = 'album'; return render(); }
    if(view === 'album') close();
  }
  function move(dir){
    if(view === 'album' && (dir === 'left' || dir === 'right')){ page += dir === 'left' ? -1 : 1; sfx('flip'); return render(); }
    const items = focusables();
    if(!items.length) return;
    focus = (focus + (dir === 'left' || dir === 'up' ? -1 : 1) + items.length) % items.length;
    applyFocus();
  }
  function onKey(e){
    if(!isOpen(true)) return;
    const k = e.key.toLowerCase();
    let used = true;
    if(k === 'escape' || k === 'backspace') back();
    else if(k === 'enter' || k === ' ') primary();
    else if(k === 'arrowleft' || k === 'q') move('left');
    else if(k === 'arrowright' || k === 'd') move('right');
    else if(k === 'arrowup' || k === 'z') move('up');
    else if(k === 'arrowdown' || k === 's') move('down');
    else if(k === 't') act('trade');
    else used = false;
    if(used){ e.preventDefault(); e.stopPropagation(); }
  }
  function padLoop(){
    padRaf = 0;
    if(!isOpen(true)) return;
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    const down = {};
    for(const p of pads){
      const b = i => !!(p.buttons[i] && p.buttons[i].pressed);
      if(b(0)) down.a = 1; if(b(1)) down.b = 1; if(b(2)) down.x = 1;
      if(b(4) || b(14) || p.axes[0] < -.6) down.l = 1;
      if(b(5) || b(15) || p.axes[0] > .6) down.r = 1;
      if(b(12) || p.axes[1] < -.6) down.u = 1;
      if(b(13) || p.axes[1] > .6) down.d = 1;
    }
    const hit = k => down[k] && !padPrev[k];
    if(hit('a')) primary(); else if(hit('b')) back(); else if(hit('x')) act('trade');
    else if(hit('l')) move('left'); else if(hit('r')) move('right');
    else if(hit('u')) move('up'); else if(hit('d')) move('down');
    padPrev = down;
    padRaf = requestAnimationFrame(padLoop);
  }

  function open(startView, from){
    ensureDom();
    view = startView === 'pack' && state.packs > 0 ? 'pack' : 'album';
    returnTo = from || null;
    pack = null;
    if(view === 'album' && typeof menuState !== 'undefined' && menuState && from !== 'end') page = menuState.teamA || 0;
    overlay.classList.add('open');
    render();
    // On ignore le bouton qui vient d'ouvrir l'album.
    padPrev = { a:1, b:1 };
    if(!padRaf) padRaf = requestAnimationFrame(padLoop);
  }

  function close(){
    if(!overlay) return;
    overlay.classList.remove('open');
    closedAt = performance.now();
    if(padRaf){ cancelAnimationFrame(padRaf); padRaf = 0; }
    if(returnTo === 'end') refreshEndButton();
    else if(typeof renderMenu === 'function' && typeof menu !== 'undefined' && menu && menu.style.display !== 'none') renderMenu();
  }

  // Ouvert, ou fermé il y a moins de 300 ms (le même appui ne doit pas déclencher le menu dessous).
  function isOpen(strict){
    if(overlay && overlay.classList.contains('open')) return true;
    return !strict && performance.now() - closedAt < 300;
  }

  function menuBadge(){
    const n = state.packs;
    return n > 0 ? `<span class="albMenuBadge">🎁 ${n}</span>` : '';
  }

  function teamBadge(teamId){
    const n = S.teamProgress(state, teamId);
    return n === S.PER_TEAM ? ' · 📒 ★' : ` · 📒 ${n}/6`;
  }

  // ---- Hooks match ----
  function matchStart(){ match = { active:true, kos:0 }; }

  function noteKO(victim, killer){
    if(!match.active || !victim || !killer) return;
    if(killer.team === 0 && victim.team !== 0) match.kos++;
  }

  function refreshEndButton(){
    const btns = document.querySelector('#endOverlay .endBtns');
    if(!btns) return;
    let b = document.getElementById('albumOpenBtn');
    if(state.packs <= 0){ if(b) b.remove(); return; }
    if(!b){
      b = document.createElement('button');
      b.id = 'albumOpenBtn';
      b.onclick = () => open('pack', 'end');
      btns.insertBefore(b, btns.firstChild);
    }
    b.textContent = `🎁 OUVRIR (${state.packs})`;
  }

  // info: {mode, scoreA, scoreB, campaignWin, campaignDone}
  function matchEnd(info){
    if(!match.active) return null;
    match.active = false;
    ensureDom();
    if(info.mode !== 'friendly' && info.mode !== 'campaign') return null;
    const res = S.scoreMatch({ scoreA:info.scoreA, scoreB:info.scoreB, kos:match.kos, campaignWin:info.campaignWin });
    state.koBonus = match.kos;
    const gain = S.addPoints(state, res.total);
    let bonusPacks = 0;
    if(info.campaignDone){ bonusPacks = 3; state.packs += bonusPacks; S.save(state); }
    const earned = gain.earned + bonusPacks;

    const card = document.querySelector('#endOverlay .endCard');
    if(card && !info.campaignWin){
      let box = document.getElementById('albumReward');
      if(!box){ box = document.createElement('div'); box.id = 'albumReward'; card.insertBefore(box, card.querySelector('.endBtns')); }
      const lines = res.lines.map((l, i) => `<div class="rw-line" style="animation-delay:${i * 250}ms"><span>${l.label}</span><b>+${l.pts}</b></div>`).join('');
      const delay = res.lines.length * 250;
      box.innerHTML = `${lines}
        <div class="rw-total"><span>TOTAL</span><span>+${res.total} pts</span></div>
        <div class="alb-track" style="margin-top:6px"><div class="alb-fill" id="rwFill" style="width:${gain.before / S.PACK_COST * 100}%"></div></div>
        ${earned ? `<div class="rw-earn" style="animation-delay:${delay}ms">🎁 +${earned} PAQUET${earned > 1 ? 'S' : ''} !</div>` : ''}
        <div class="rw-next">Encore ${S.PACK_COST - state.points} pts pour le prochain paquet${match.kos ? ' · 🩸 chance SANGLANT +' + match.kos + '%' : ''}</div>`;
      setTimeout(() => {
        const fill = document.getElementById('rwFill');
        if(fill) fill.style.width = (earned ? 100 : state.points / S.PACK_COST * 100) + '%';
        if(earned) sfx('rare');
        if(earned && fill) setTimeout(() => { fill.style.transition = 'none'; fill.style.width = '0%'; requestAnimationFrame(() => { fill.style.transition = ''; fill.style.width = state.points / S.PACK_COST * 100 + '%'; }); }, 900);
      }, delay);
      refreshEndButton();
    }else{
      toast(`+${res.total} pts${earned ? ` · 🎁 +${earned} paquet${earned > 1 ? 's' : ''} !` : ''}`);
    }
    return { res, earned };
  }

  if(dailyGift) setTimeout(() => toast(`🎁 Cadeau du jour : +${dailyGift} paquet${dailyGift > 1 ? 's' : ''}${state.streak >= 2 ? ' · 🔥 ' + state.streak + ' jours' : ''}`), 4500);

  global.BFC_ALBUM = Object.freeze({
    open, close, isOpen, menuBadge, teamBadge, matchStart, noteKO, matchEnd, toast,
    get state(){ return state; }
  });
})(window);
