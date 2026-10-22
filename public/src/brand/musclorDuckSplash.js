/*
 * MUSCLOR DUCK — écran d'ouverture du studio, identique à celui de Date Gravity (CubeGravity/index.html).
 * Linogravure rouge : un petit canard noir, et sur le mur son ombre, un colosse gravé au trait clair.
 * Copie du splash de CubeGravity : ne pas retoucher la DA ici, la modifier à la source.
 *
 * Usage : <script src="musclorDuckSplash.js"></script>  puis  MusclorDuck.show({ onDone })
 * MusclorDuck.active() -> true tant qu'il est affiché. Un toucher le passe.
 */
(function(global){
  'use strict';
  const CSS = "#mdkSplash{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#f0e6cf;animation:spOut .35s ease 2.45s forwards;touch-action:none;cursor:pointer}\n.mdkBox{position:relative;height:100%;max-width:100%;aspect-ratio:9/16;container-type:size;overflow:hidden}\n.spBlock{position:absolute;left:7%;right:7%;top:6%;bottom:6%;border-radius:1rem;background:#d8232f;transform:rotate(-1.5deg);animation:spPress .4s cubic-bezier(.2,1.5,.4,1) both}\n.mdkBox svg{position:absolute;left:0;top:12%;width:100%;overflow:visible}\n.spFloor,.spSmall{animation:spFade .3s ease .3s both}\n.spTrail{animation:spFade .3s ease .55s both}\n.spBig{transform-box:fill-box;transform-origin:50% 100%;animation:spGrow .55s cubic-bezier(.2,1.5,.4,1) .6s both}\n.spName{position:absolute;left:0;right:0;top:62%;text-align:center;font:400 15cqw/.9 \"Bowlby One\",Rubik,Arial,sans-serif;text-transform:uppercase;color:#17130f;animation:spPop .35s cubic-bezier(.2,1.7,.4,1) 1.15s both}\n.spTag{position:absolute;left:0;right:0;top:calc(62% + 33cqw);text-align:center;font:900 5.5cqw/1 Rubik,Arial,sans-serif;letter-spacing:.34em;text-indent:.34em;text-transform:uppercase;color:#f0e6cf;animation:spFade .3s ease 1.4s both}\n@keyframes spPress{from{transform:rotate(-1.5deg) scale(1.14);opacity:0}to{transform:rotate(-1.5deg);opacity:1}}\n@keyframes spFade{from{opacity:0}to{opacity:1}}\n@keyframes spGrow{from{transform:scale(.6,0);opacity:0}to{transform:none;opacity:1}}\n@keyframes spPop{from{transform:scale(1.6);opacity:0}to{transform:none;opacity:1}}\n@keyframes spOut{to{opacity:0;visibility:hidden}}";
  const SVG = "<svg viewBox=\"-74 -44 468 400\" aria-hidden=\"true\"><defs><filter id=\"spWob1\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feTurbulence type=\"fractalNoise\" baseFrequency=\".03\" numOctaves=\"2\" seed=\"2\" result=\"n\"/><feDisplacementMap in=\"SourceGraphic\" in2=\"n\" scale=\"9\"/></filter><filter id=\"spWob2\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feTurbulence type=\"fractalNoise\" baseFrequency=\".03\" numOctaves=\"2\" seed=\"11\" result=\"n\"/><feDisplacementMap in=\"SourceGraphic\" in2=\"n\" scale=\"9\"/></filter><filter id=\"spWob3\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feTurbulence type=\"fractalNoise\" baseFrequency=\".03\" numOctaves=\"2\" seed=\"23\" result=\"n\"/><feDisplacementMap in=\"SourceGraphic\" in2=\"n\" scale=\"9\"/></filter></defs><g id=\"spArt\" filter=\"url(#spWob1)\" stroke=\"#f0e6cf\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path class=\"spFloor\" d=\"M-40 246H360\" fill=\"none\" stroke-width=\"4\"/><g transform=\"translate(192 246) scale(.95) translate(-150 -286)\"><g class=\"spBig\" fill=\"#d8232f\" stroke-width=\"6\"><path d=\"M128 232V274M128 274L110 284M128 274L128 288M128 274L144 284M176 232V274M176 274L158 284M176 274L176 288M176 274L192 284\" fill=\"none\"/><path d=\"M214 120Q250 126 268 104Q250 88 256 64Q262 40 286 46Q306 54 300 82Q312 120 282 146Q250 168 212 150Z\"/><path d=\"M266 100Q276 92 288 98\" fill=\"none\"/><g transform=\"translate(300 0) scale(-1 1)\"><path d=\"M214 120Q250 126 268 104Q250 88 256 64Q262 40 286 46Q306 54 300 82Q312 120 282 146Q250 168 212 150Z\"/><path d=\"M266 100Q276 92 288 98\" fill=\"none\"/></g><path d=\"M150 34Q184 34 190 66Q232 70 232 122Q232 200 196 228Q150 246 104 228Q68 200 68 122Q68 70 110 66Q116 34 150 34Z\"/><path d=\"M100 150Q124 168 147 150M153 150Q176 168 200 150M150 170V214M134 184H166M136 202H164\" fill=\"none\"/><circle cx=\"134\" cy=\"70\" r=\"4.5\" fill=\"#f0e6cf\"/><circle cx=\"166\" cy=\"70\" r=\"4.5\" fill=\"#f0e6cf\"/><path d=\"M126 60L140 63M174 60L160 63\" fill=\"none\"/><path d=\"M141 74Q150 68 159 74Q150 86 141 74Z\"/></g></g><path class=\"spTrail\" d=\"M58 290L150 246L246 246L112 296Z\" fill=\"#17130f\" stroke=\"none\"/><g transform=\"translate(79 290) scale(.3) translate(-150 -286)\"><g class=\"spSmall\" fill=\"#17130f\" stroke-width=\"15\"><path d=\"M128 232V274M128 274L110 284M128 274L128 288M128 274L144 284M176 232V274M176 274L158 284M176 274L176 288M176 274L192 284\" fill=\"none\"/><path d=\"M220 128Q252 116 254 86Q246 74 236 84Q238 102 212 110Z\"/><g transform=\"translate(300 0) scale(-1 1)\"><path d=\"M220 128Q252 116 254 86Q246 74 236 84Q238 102 212 110Z\"/></g><path d=\"M150 34Q184 34 190 66Q232 70 232 122Q232 200 196 228Q150 246 104 228Q68 200 68 122Q68 70 110 66Q116 34 150 34Z\"/><circle cx=\"134\" cy=\"70\" r=\"4.5\" fill=\"#f0e6cf\"/><circle cx=\"166\" cy=\"70\" r=\"4.5\" fill=\"#f0e6cf\"/><path d=\"M126 60L140 63M174 60L160 63\" fill=\"none\"/><path d=\"M141 74Q150 68 159 74Q150 86 141 74Z\"/></g></g></g></svg>";
  const FONTS = 'https://fonts.googleapis.com/css2?family=Bowlby+One&family=Rubik:wght@500;800;900&display=swap';
  let current = null;

  function show(opts){
    opts = opts || {};
    if(current) return current.promise;
    if(!document.getElementById('mdk-style')){
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS; document.head.appendChild(l);
      const st = document.createElement('style'); st.id = 'mdk-style'; st.textContent = CSS; document.head.appendChild(st);
    }
    const el = document.createElement('div');
    el.id = 'mdkSplash';
    el.setAttribute('aria-hidden', 'true');
    el.style.zIndex = opts.zIndex || 99999;
    el.innerHTML = '<div class="mdkBox"><div class="spBlock"></div>' + SVG + '<div class="spName">Musclor<br>Duck</div><div class="spTag">' + (opts.tagline || 'games') + '</div></div>';
    (document.getElementById('stage')||document.body).appendChild(el);
    // le trait gravé tremble légèrement, comme une animation dessinée image par image
    const art = el.querySelector('#spArt');
    let step = 0;
    const boil = setInterval(() => { step = (step + 1) % 3; art.setAttribute('filter', 'url(#spWob' + (step + 1) + ')'); }, 170);
    let resolve;
    const promise = new Promise(r => resolve = r);
    const end = () => {
      if(!current) return;
      clearInterval(boil); clearTimeout(timer);
      el.remove(); current = null;
      try{ opts.onDone && opts.onDone(); }catch(e){ console.error(e); }
      resolve();
    };
    const timer = setTimeout(end, 2850);
    const stop = e => { e.preventDefault(); e.stopImmediatePropagation(); };
    el.addEventListener('pointerdown', e => { stop(e); end(); });
    el.addEventListener('pointerup', stop);
    el.addEventListener('click', stop);
    current = { promise, end };
    return promise;
  }

  global.MusclorDuck = Object.freeze({
    show,
    skip(){ current && current.end(); },
    active(){ return !!current; }
  });
})(window);
