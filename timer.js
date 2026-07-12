/* ---------------- TIMER / CRONOMETRO (con rotelle numeriche) ---------------- */
(function(){
  const timerOverlay  = document.getElementById('timer-overlay');
  const fabTimer       = document.getElementById('fab-timer');
  const sonarTimer     = document.getElementById('sonar-timer');
  const timerClose     = document.getElementById('timer-close');
  const timerTabs      = document.querySelectorAll('.timer-tab');
  const timerSetup     = document.getElementById('timer-setup');
  const bigDisplay      = document.getElementById('timer-big-display');
  const timerStatus    = document.getElementById('timer-status');
  const toggleBtn       = document.getElementById('timer-toggle');
  const toggleIcon      = document.getElementById('timer-toggle-icon');
  const resetBtn        = document.getElementById('timer-reset');
  const indicator        = document.getElementById('time-indicator');
  const indicatorValue   = document.getElementById('time-indicator-value');
  const indicatorIcon    = document.getElementById('time-indicator-icon');

  const ICON_CLOCK  = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
  const ICON_PAUSE  = '<rect x="7" y="6" width="3.6" height="12" rx="1" fill="currentColor" stroke="none"/><rect x="13.4" y="6" width="3.6" height="12" rx="1" fill="currentColor" stroke="none"/>';
  const ICON_PLAY   = '<path d="M8 6.5v11l9-5.5z" fill="currentColor" stroke="none"/>';

  function updateIndicatorIcon(){
    if(running){
      indicatorIcon.innerHTML = ICON_PAUSE;
      indicator.title = 'Metti in pausa';
    }else if(currentValue() > 0 || mode === 'stopwatch'){
      indicatorIcon.innerHTML = ICON_PLAY;
      indicator.title = 'Riprendi';
    }else{
      indicatorIcon.innerHTML = ICON_CLOCK;
      indicator.title = 'Tempo trascorso';
    }
  }

  const minutesWheel = document.getElementById('wheel-minutes');
  const secondsWheel = document.getElementById('wheel-seconds');
  const minutesTrack = document.getElementById('wheel-minutes-track');
  const secondsTrack = document.getElementById('wheel-seconds-track');

  const ITEM_H = 44;
  const MAX_MIN = 60;
  const MAX_SEC = 59;

  let pickedMinutes = 5;
  let pickedSeconds = 0;

  let mode = 'timer';
  let running = false;
  let remaining = 0;
  let elapsed = 0;
  let intervalId = null;

  function pad(n){ return n.toString().padStart(2,'0'); }
  function format(totalSeconds){
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return pad(m) + ':' + pad(s);
  }

  /* ---------- costruzione rotelle ---------- */
  function buildWheel(track, max){
    for(let i = 0; i <= max; i++){
      const item = document.createElement('div');
      item.className = 'wheel-item';
      item.textContent = pad(i);
      item.dataset.value = i;
      track.appendChild(item);
    }
  }
  buildWheel(minutesTrack, MAX_MIN);
  buildWheel(secondsTrack, MAX_SEC);

  function scrollToValue(col, value, smooth){
    col.scrollTo({ top: value * ITEM_H, behavior: smooth ? 'smooth' : 'auto' });
  }

  function markSelected(track, idx){
    track.querySelectorAll('.wheel-item').forEach(el => {
      el.classList.toggle('selected', Number(el.dataset.value) === idx);
    });
  }

  function attachWheel(col, track, max, onSettle){
    let scrollTimer;
    col.addEventListener('scroll', () => {
      const idx = Math.min(max, Math.max(0, Math.round(col.scrollTop / ITEM_H)));
      markSelected(track, idx);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const finalIdx = Math.min(max, Math.max(0, Math.round(col.scrollTop / ITEM_H)));
        onSettle(finalIdx);
      }, 120);
    });
  }

  attachWheel(minutesWheel, minutesTrack, MAX_MIN, (val) => {
    pickedMinutes = val;
    if(!running) syncRemainingFromWheels();
  });
  attachWheel(secondsWheel, secondsTrack, MAX_SEC, (val) => {
    pickedSeconds = val;
    if(!running) syncRemainingFromWheels();
  });

  function initWheels(){
    scrollToValue(minutesWheel, pickedMinutes, false);
    scrollToValue(secondsWheel, pickedSeconds, false);
    markSelected(minutesTrack, pickedMinutes);
    markSelected(secondsTrack, pickedSeconds);
  }

  function syncRemainingFromWheels(){
    remaining = pickedMinutes * 60 + pickedSeconds;
    refreshDisplay();
  }

  /* ---------- logica timer / cronometro ---------- */
  function currentValue(){ return mode === 'timer' ? remaining : elapsed; }

  function refreshDisplay(){
    const val = currentValue();
    bigDisplay.textContent = format(val);
    indicatorValue.textContent = format(val);
    bigDisplay.classList.toggle('warning', mode === 'timer' && val <= 10 && val > 0);
    indicator.classList.toggle('running', running);
    updateIndicatorIcon();
  }

  function setStatus(text){ timerStatus.textContent = text; }

  function setWheelsDisabled(disabled){
    minutesWheel.classList.toggle('disabled', disabled);
    secondsWheel.classList.toggle('disabled', disabled);
  }

  function switchMode(newMode){
    if(running) stop();
    mode = newMode;
    timerTabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    timerSetup.style.display = mode === 'timer' ? 'block' : 'none';
    if(mode === 'timer'){
      syncRemainingFromWheels();
    }else{
      elapsed = 0;
    }
    setStatus('Pronto');
    refreshDisplay();
  }

  function tick(){
    if(mode === 'timer'){
      remaining -= 1;
      if(remaining <= 0){
        remaining = 0;
        refreshDisplay();
        stop();
        setStatus('Tempo scaduto');
        if(navigator.vibrate) navigator.vibrate([200,100,200]);
        return;
      }
    }else{
      elapsed += 1;
    }
    refreshDisplay();
  }

  function start(){
    if(mode === 'timer' && remaining <= 0){
      syncRemainingFromWheels();
      if(remaining <= 0) return;
    }
    running = true;
    setWheelsDisabled(true);
    intervalId = setInterval(tick, 1000);
    toggleBtn.classList.add('is-running');
    toggleIcon.innerHTML = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
    setStatus(mode === 'timer' ? 'In conto alla rovescia' : 'In esecuzione');
    refreshDisplay();
  }

  function stop(){
    running = false;
    setWheelsDisabled(false);
    clearInterval(intervalId);
    toggleBtn.classList.remove('is-running');
    toggleIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    if(timerStatus.textContent !== 'Tempo scaduto') setStatus('In pausa');
    refreshDisplay();
  }

  function reset(){
    stop();
    if(mode === 'timer'){
      syncRemainingFromWheels();
    }else{
      elapsed = 0;
    }
    setStatus('Pronto');
    refreshDisplay();
  }

  toggleBtn.addEventListener('click', () => running ? stop() : start());
  resetBtn.addEventListener('click', reset);
  timerTabs.forEach(tab => tab.addEventListener('click', () => switchMode(tab.dataset.mode)));

  fabTimer.addEventListener('click', () => {
    sonarTimer.classList.remove('ping');
    void sonarTimer.offsetWidth;
    sonarTimer.classList.add('ping');
    timerOverlay.classList.add('open');
  });
    indicator.addEventListener('click', () => {
    if(running){
      stop();
    }else if(currentValue() > 0 || mode === 'stopwatch'){
      start();
    }else{
      timerOverlay.classList.add('open'); // nessun tempo impostato: apri la modale per impostarlo
    }
  });
  timerClose.addEventListener('click', () => timerOverlay.classList.remove('open'));
  timerOverlay.addEventListener('click', (e) => { if(e.target === timerOverlay) timerOverlay.classList.remove('open'); });

  initWheels();
  switchMode('timer');
})();