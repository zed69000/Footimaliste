'use strict';
(function(global){
  const XBOX_BTN=Object.freeze({
    A:0,
    B:1,
    X:2,
    Y:3,
    LB:4,
    RB:5,
    LT:6,
    RT:7,
    BACK:8,
    START:9,
    DU:12,
    DD:13,
    DL:14,
    DR:15
  });

  const GAMEPLAY_MAP=Object.freeze({
    pass:[XBOX_BTN.A],
    shoot:[XBOX_BTN.X],
    sprint:[XBOX_BTN.B],
    switch:[XBOX_BTN.Y,XBOX_BTN.LB],
    restart:[XBOX_BTN.START],
    back:[XBOX_BTN.B,XBOX_BTN.BACK],
    navUp:[XBOX_BTN.DU],
    navDown:[XBOX_BTN.DD],
    navLeft:[XBOX_BTN.DL],
    navRight:[XBOX_BTN.DR]
  });

  function clamp01(v){return Math.max(0,Math.min(1,v));}
  function buttonDown(gamepad,index){
    return !!(gamepad&&gamepad.buttons&&gamepad.buttons[index]&&gamepad.buttons[index].pressed);
  }
  function axis(gamepad,index){
    return (gamepad&&gamepad.axes&&Number.isFinite(gamepad.axes[index]))?gamepad.axes[index]:0;
  }
  function axis9Dpad(gamepad){
    const a=axis(gamepad,9);
    if(Math.abs(a)<.01)return null;
    const dirs=[null,{x:0,y:-1},{x:1,y:-1},{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:-1,y:1},{x:-1,y:0},{x:-1,y:-1}];
    const idx=Math.max(0,Math.min(8,Math.round(((a+1)/2)*8)));
    return dirs[idx]||null;
  }
  function dpadButtons(gamepad){
    const x=(buttonDown(gamepad,XBOX_BTN.DR)?1:0)-(buttonDown(gamepad,XBOX_BTN.DL)?1:0);
    const y=(buttonDown(gamepad,XBOX_BTN.DD)?1:0)-(buttonDown(gamepad,XBOX_BTN.DU)?1:0);
    return {x,y,l:Math.hypot(x,y)};
  }
  function bestMove(gamepad,options){
    const deadZone=options&&Number.isFinite(options.deadZone)?options.deadZone:.16;
    const normalizePower=!!(options&&options.normalizePower);
    let best={x:0,y:0,l:0};
    const pairs=[[0,1],[2,3],[4,5],[6,7]];
    for(const pair of pairs){
      const x=axis(gamepad,pair[0]);
      const y=axis(gamepad,pair[1]);
      const l=Math.hypot(x,y);
      if(l>best.l&&l>deadZone)best={x,y,l};
    }
    const a9=axis9Dpad(gamepad);
    if(a9&&best.l<.38)best={x:a9.x,y:a9.y,l:1};
    const dp=dpadButtons(gamepad);
    if(dp.l>.1)best=dp;
    if(best.l<=deadZone)return {x:0,y:0};
    const n=Math.max(1,best.l);
    if(normalizePower){
      const power=clamp01((best.l-deadZone)/(1-deadZone));
      return {x:best.x/best.l*power,y:best.y/best.l*power};
    }
    return {x:best.x/n,y:best.y/n};
  }
  function isMenuConfirm(gamepad){return buttonDown(gamepad,XBOX_BTN.A)||buttonDown(gamepad,XBOX_BTN.START)||buttonDown(gamepad,10);}
  function isMenuBack(gamepad){return buttonDown(gamepad,XBOX_BTN.B)||buttonDown(gamepad,XBOX_BTN.BACK);}
  function readGameplayDown(gamepad){
    return {
      pass:buttonDown(gamepad,XBOX_BTN.A),
      shoot:buttonDown(gamepad,XBOX_BTN.X),
      sprint:buttonDown(gamepad,XBOX_BTN.RT)||buttonDown(gamepad,XBOX_BTN.B),
      switch:buttonDown(gamepad,XBOX_BTN.Y)||buttonDown(gamepad,XBOX_BTN.LB),
      restart:buttonDown(gamepad,XBOX_BTN.START),
      back:buttonDown(gamepad,XBOX_BTN.B)||buttonDown(gamepad,XBOX_BTN.BACK),
      navUp:buttonDown(gamepad,XBOX_BTN.DU),
      navDown:buttonDown(gamepad,XBOX_BTN.DD),
      navLeft:buttonDown(gamepad,XBOX_BTN.DL),
      navRight:buttonDown(gamepad,XBOX_BTN.DR)
    };
  }
  function connectedGamepads(){
    const pads=global.navigator&&global.navigator.getGamepads?global.navigator.getGamepads():[];
    return Array.from(pads).filter(p=>p&&p.connected);
  }
  global.BFCInput=Object.freeze({
    version:'step8-input-module-1',
    XBOX_BTN,
    GAMEPLAY_MAP,
    buttonDown,
    axis,
    axis9Dpad,
    bestMove,
    isMenuConfirm,
    isMenuBack,
    readGameplayDown,
    connectedGamepads
  });
})(window);
