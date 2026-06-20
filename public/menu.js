'use strict';

function menuTitle(title, sub=''){
  return `<div class="simpleMenuHead"><div class="simpleLogo">BRUTAL FC</div><div class="simpleTitle">${title}</div>${sub?`<div class="simpleSub">${sub}</div>`:''}</div>`;
}

function modeButton(icon, title, sub, value){
  return `<button data-menu-item data-mode-pick="${value}" class="simpleMenuBtn ${mode===value?'selected':''}"><span class="simpleIcon">${icon}</span><span><strong>${title}</strong><small>${sub}</small></span></button>`;
}

function teamSelector(){
  return `<div class="simpleTeamPicker">
    <button data-menu-item data-team-prev class="simpleArrow">‹</button>
    <div class="simpleTeamCard">
      <div class="simpleFlag">${flagFor(teamA)}</div>
      <div class="simpleTeamName">${teamA.name}</div>
      <div class="simpleTeamInfo">${mode==='training'?'Entraînement libre':'Adversaire aléatoire'}</div>
    </div>
    <button data-menu-item data-team-next class="simpleArrow">›</button>
  </div>`;
}

function renderMenu(){
  const sub=document.getElementById('menuSubtitle');
  sub.textContent='';
  startBtn.style.display='none';

  if(menuPage!=='team') menuPage='mode';

  if(menuPage==='mode'){
    countryList.innerHTML =
      `<div class="simpleMenuScreen">`+
      menuTitle('Choisis un mode')+
      `<div class="simpleModeList">`+
      modeButton('🤝','AMICAL','Match rapide contre une équipe aléatoire','friendly')+
      modeButton('🎯','ENTRAÎNEMENT','Tester les contrôles et le feeling','training')+
      `</div>`+
      `<div class="simpleHint">A / Entrée : valider · B / Échap : retour</div>`+
      `</div>`;
  } else {
    countryList.innerHTML =
      `<div class="simpleMenuScreen">`+
      menuTitle('Choisis ton équipe', mode==='training'?'Mode entraînement':'Match amical')+
      teamSelector()+
      `<button data-menu-item data-launch class="simplePlayBtn">⚽ JOUER</button>`+
      `<button data-menu-item data-back class="simpleBackBtn">↩ Retour</button>`+
      `</div>`;
  }
  setTimeout(()=>setMenuFocus(0),0);
}

function menuActivate(el){
  if(!el)return;
  if(el.dataset.modePick){
    mode=el.dataset.modePick;
    opponentRandom=true;
    controlMode='solo';
    matchSize=5;
    tacticA='balanced';
    tacticB='balanced';
    menuPage='team';
    return renderMenu();
  }
  if(el.dataset.teamPrev!==undefined){
    selected=(selected-1+countries.length)%countries.length;
    teamA=countries[selected];
    if(selectedOpponent===selected)selectedOpponent=(selectedOpponent+1)%countries.length;
    return renderMenu();
  }
  if(el.dataset.teamNext!==undefined){
    selected=(selected+1)%countries.length;
    teamA=countries[selected];
    if(selectedOpponent===selected)selectedOpponent=(selectedOpponent+1)%countries.length;
    return renderMenu();
  }
  if(el.dataset.back!==undefined){
    menuPage='mode';
    return renderMenu();
  }
  if(el.dataset.launch!==undefined){
    return requestLandscapeMode().then(()=>startGame(mode));
  }
}

countryList.addEventListener('pointerup',e=>{
  const el=e.target.closest('[data-menu-item]');
  if(!el)return;
  e.preventDefault();
  menuActivate(el);
});

function menuNavFrame(){
  if(menu.style.display==='none')return;
  const items=currentMenuItems();
  if(!items.length)return;
  menuNavCd=Math.max(0,menuNavCd-1/60);
  let move=0;
  const gp=navigator.getGamepads?navigator.getGamepads()[0]:null;
  const axY=gp&&gp.axes?gp.axes[1]:0, axX=gp&&gp.axes?gp.axes[0]:0;
  if(pressed.arrowdown||pressed.s||gpPressed.dpadDown)move=1;
  else if(pressed.arrowup||pressed.z||gpPressed.dpadUp)move=-1;
  else if(pressed.arrowright||pressed.d||gpPressed.dpadRight)move=1;
  else if(pressed.arrowleft||pressed.q||pressed.a||gpPressed.dpadLeft)move=-1;
  else if(menuNavCd<=0){
    if(axY>.72||axX>.72)move=1;
    else if(axY<-.72||axX<-.72)move=-1;
  }
  if(move){setMenuFocus(menuFocus+move);menuNavCd=.22}
  if(pressed.enter||pressed[' ']||gpPressed.pass)menuActivate(items[menuFocus]);
  if(pressed.escape||gpPressed.menuBack){
    if(menuPage==='team'){menuPage='mode';renderMenu()}
  }
}

startBtn.addEventListener('pointerup',async e=>{
  e.preventDefault();
  if(menuPage==='mode'){menuPage='team';renderMenu()}
  else await requestLandscapeMode().then(()=>startGame(mode));
});

pauseBtn.onclick=()=>openPause();
resumeBtn.onclick=()=>closePause();
pauseTrainingBtn.onclick=async()=>{await requestLandscapeMode();mode='training';startGame('training')};
pauseMatchBtn.onclick=async()=>{await requestLandscapeMode();mode='friendly';startGame('friendly')};
pauseDebugBtn.onclick=(e)=>{if(e)e.stopPropagation();debugPanel.classList.toggle('open')};
debugPanel.addEventListener('pointerdown',e=>e.stopPropagation());
debugPanel.addEventListener('pointerup',e=>e.stopPropagation());
pauseMenuBtn.onclick=()=>{gamePaused=false;pauseOverlay.style.display='none';debugPanel.classList.remove('open');menu.style.display='block';hudBtns.style.display='none';matchIntro.style.display='none';goalPause.style.display='none';endOverlay.style.display='none';menuPage='mode';renderMenu()};
restartBtn.onclick=async()=>{await requestLandscapeMode();startGame(mode)};
backMenuBtn.onclick=()=>{endOverlay.style.display='none';menu.style.display='block';hudBtns.style.display='none';menuPage='mode';renderMenu()};
initDebug();

function openPause(){if(menu.style.display!=='none'||gameOver)return;gamePaused=true;pauseOverlay.style.display='flex'}
function closePause(){gamePaused=false;pauseOverlay.style.display='none';debugPanel.classList.remove('open')}
function randomOpponentIndex(){let i=selected;while(i===selected)i=Math.floor(rand(0,countries.length));return i}
function startGame(m){resumeAudio();gamePaused=false;pauseOverlay.style.display='none';mode=m;menu.style.display='none';hudBtns.style.display='flex';teamA=countries[selected];teamB=countries[randomOpponentIndex()];resolveMatchKits();pickMatchEnvironment();scoreA=0;scoreB=0;timer=mode==='training'?999:120;gameOver=false;winShown=false;confetti=[];fireworks=[];goalHoldT=0;pendingKick=null;goalPause.style.display='none';endOverlay.style.display='none';reset(TA);preMatchT=mode==='training'?0:2.2;if(preMatchT>0)showIntro();show(mode==='training'?'ENTRAÎNEMENT LIBRE':'MATCH AMICAL')}

renderMenu();
ball = new Ball();
requestAnimationFrame(loop);
