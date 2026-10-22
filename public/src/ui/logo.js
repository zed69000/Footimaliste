(function(global){
  'use strict';

  // Logo BRUTAL FC en SVG : éclaboussure de sang à pointes, BRUTAL massif (crème -> or, contour noir,
  // ombre sang), coulures sous les lettres, écusson FC doré penché et ballon fissuré.
  // textLength garde la même largeur même si la police n'est pas encore chargée.
  function splat(cx, cy, rx, ry, spikes, seed){
    let s = seed, pts = [];
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for(let i = 0; i < spikes * 2; i++){
      const a = i / (spikes * 2) * Math.PI * 2;
      const k = i % 2 ? .78 + rnd() * .1 : 1 + rnd() * .22;
      pts.push((cx + Math.cos(a) * rx * k).toFixed(1) + ' ' + (cy + Math.sin(a) * ry * k).toFixed(1));
    }
    return 'M' + pts.join('L') + 'Z';
  }
  function drip(x, top, len, w){
    return `<path class="lgDrip" d="M${x - w} ${top}h${w * 2}v${len}a${w} ${w} 0 0 1 ${-w * 2} 0z" fill="#d8141c" stroke="#000" stroke-width="5"/>`;
  }

  let uid = 0;
  function svg(){
    const id = 'lg' + (++uid);
    return `<svg class="bfLogo" viewBox="0 0 640 310" role="img" aria-label="Brutal FC">
<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset=".15" stop-color="#fff6dc"/><stop offset=".62" stop-color="#ffd23f"/><stop offset="1" stop-color="#e08a00"/></linearGradient></defs>
<g class="lgSplat">
 <path d="${splat(320, 150, 300, 118, 17, 7)}" fill="#5a0006" stroke="#000" stroke-width="8" stroke-linejoin="round"/>
 <path d="${splat(312, 146, 262, 98, 15, 3)}" fill="#e01b22"/>
 <circle cx="40" cy="70" r="11" fill="#e01b22" stroke="#000" stroke-width="5"/><circle cx="604" cy="232" r="8" fill="#e01b22" stroke="#000" stroke-width="5"/><circle cx="586" cy="40" r="6" fill="#e01b22"/>
</g>
${drip(132, 196, 46, 9)}${drip(236, 200, 74, 11)}${drip(356, 198, 36, 8)}${drip(446, 200, 60, 10)}
<g class="lgWord" font-family="'Bowlby One','Arial Black',Impact,sans-serif" font-size="118" text-anchor="middle">
 <text x="330" y="196" textLength="540" lengthAdjust="spacingAndGlyphs" fill="#2a0003" stroke="#000" stroke-width="22" stroke-linejoin="round">BRUTAL</text>
 <text x="320" y="186" textLength="540" lengthAdjust="spacingAndGlyphs" fill="url(#${id}g)" stroke="#000" stroke-width="18" stroke-linejoin="round" paint-order="stroke fill">BRUTAL</text>
 <text x="320" y="186" textLength="540" lengthAdjust="spacingAndGlyphs" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" transform="translate(-3 -4)">BRUTAL</text>
</g>
<g transform="translate(498 248)">
 <g class="lgBadge">
  <rect x="-78" y="-40" width="156" height="80" rx="16" fill="#000" transform="translate(8 8)"/>
  <rect x="-78" y="-40" width="156" height="80" rx="16" fill="#ffd23f" stroke="#000" stroke-width="8"/>
  <text x="0" y="24" text-anchor="middle" font-family="'Bowlby One','Arial Black',Impact,sans-serif" font-size="64" textLength="92" lengthAdjust="spacingAndGlyphs" fill="#0d0b0c">FC</text>
 </g>
</g>
<g transform="translate(118 252) rotate(-14)">
 <circle r="34" fill="#fff6dc" stroke="#000" stroke-width="7"/>
 <path d="M0 -12L11 -4L7 9L-7 9L-11 -4Z" fill="#0d0b0c"/>
 <path d="M0 -12V-32M11 -4L30 -10M7 9L18 27M-7 9L-18 27M-11 -4L-30 -10" stroke="#0d0b0c" stroke-width="4"/>
 <path d="M-22 -24L-8 -14L-14 -2L2 6" fill="none" stroke="#d8141c" stroke-width="4" stroke-linecap="round"/>
</g>
</svg>`;
  }

  global.bfLogoSVG = svg;
})(window);
