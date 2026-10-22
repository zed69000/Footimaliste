(function(global){
  'use strict';

  // Tribunes de part et d'autre du terrain : supporters cubes (DA du jeu : bandeau, un œil) aux couleurs
  // de leur équipe, avec drapeaux et écharpes. Une tuile verticale est dessinée une fois par match,
  // puis répétée en fond des bandes latérales du plateau (#wrap::before / ::after).
  const SKINS = ['#f3d7bd', '#d8a06f', '#b9784a', '#8a5033', '#4a2b1d'];
  const HAIRS = ['#101010', '#22150e', '#4a2a17', '#d8b15a', '#8d2f19'];

  function tile(kit, seed){
    let s = seed;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const w = 96, h = 384, row = 24, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    for(let y = 0; y < h; y += row){
      g.fillStyle = (y / row) % 2 ? '#1d1517' : '#251b1e';
      g.fillRect(0, y, w, row);
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(0, y + row - 3, w, 3);
      for(let x = 2 + (y / row % 2) * 6; x < w - 8; x += 13 + Math.floor(rnd() * 3)){
        const fy = y + 6 + Math.floor(rnd() * 3), sk = SKINS[Math.floor(rnd() * SKINS.length)];
        g.fillStyle = '#000'; g.fillRect(x - 1, fy - 1, 12, 14);
        g.fillStyle = sk; g.fillRect(x, fy, 10, 12);
        g.fillStyle = HAIRS[Math.floor(rnd() * HAIRS.length)]; g.fillRect(x, fy, 10, 2);
        g.fillStyle = '#1a1414'; g.fillRect(x + 4, fy + 3, 2, 3);
        g.fillStyle = kit.color; g.fillRect(x, fy + 7, 10, 5);
        g.fillStyle = kit.stripe; g.fillRect(x, fy + 10, 10, 2);
        const r = rnd();
        if(r < .14){
          // drapeau tenu à bout de bras
          g.fillStyle = '#ddd'; g.fillRect(x + 9, fy - 9, 1, 10);
          g.fillStyle = '#000'; g.fillRect(x + 9, fy - 12, 13, 9);
          g.fillStyle = kit.color; g.fillRect(x + 10, fy - 11, 6, 7);
          g.fillStyle = kit.stripe; g.fillRect(x + 16, fy - 11, 5, 7);
        }else if(r < .3){
          // écharpe levée
          g.fillStyle = kit.stripe; g.fillRect(x - 2, fy - 4, 14, 3);
          g.fillStyle = kit.color; g.fillRect(x + 1, fy - 4, 3, 3); g.fillRect(x + 7, fy - 4, 3, 3);
        }
      }
    }
    return c.toDataURL();
  }

  global.bfPaintStands = function(kitA, kitB){
    const wrap = document.getElementById('wrap');
    if(!wrap || !kitA || !kitB) return;
    const key = kitA.color + kitA.stripe + kitB.color + kitB.stripe;
    if(wrap.dataset.stands === key) return;
    wrap.dataset.stands = key;
    wrap.style.setProperty('--standA', `url(${tile(kitA, 11)})`);
    wrap.style.setProperty('--standB', `url(${tile(kitB, 29)})`);
  };
})(window);
