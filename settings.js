(function(){

  const STORAGE_KEY = 'coach_orari';

  const dayOrder = ['lunedì','martedì','mercoledì','giovedì','venerdì','sabato','domenica'];
  const dayShort = {
    'lunedì':'LUN','martedì':'MAR','mercoledì':'MER','giovedì':'GIO',
    'venerdì':'VEN','sabato':'SAB','domenica':'DOM'
  };

  const accentCycle = [
    {accent:'var(--tide-400)',   glow:'var(--tide-400-glow)'},
    {accent:'var(--violet-500)', glow:'var(--violet-500-glow)'},
    {accent:'var(--coral-500)',  glow:'var(--coral-500-glow)'},
    {accent:'var(--bio-500)',    glow:'var(--bio-500-glow)'}
  ];

  function loadSchedule(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function saveSchedule(list){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }catch(e){}
  }

  let schedule = loadSchedule();

  const listEl = document.getElementById('schedule-list');
  const form = document.getElementById('schedule-form');

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function sortedSchedule(){
    return [...schedule].sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if(dayDiff !== 0) return dayDiff;
      return a.start.localeCompare(b.start);
    });
  }

  function renderList(){
    const items = sortedSchedule();
    listEl.innerHTML = '';

    if(items.length === 0){
      listEl.innerHTML = `
        <div class="empty-schedule">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <p>Nessun orario impostato. Aggiungine uno dal modulo qui sopra.</p>
        </div>`;
      return;
    }

    items.forEach(item => {
      const dayIndex = dayOrder.indexOf(item.day);
      const style = accentCycle[dayIndex % accentCycle.length];

      const row = document.createElement('div');
      row.className = 'schedule-item';
      row.dataset.id = item.id;
      row.style.setProperty('--accent', style.accent);
      row.style.setProperty('--accent-glow', style.glow);
      row.innerHTML = `
        <div class="day-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          <span class="day-short">${dayShort[item.day] || item.day.slice(0,3).toUpperCase()}</span>
        </div>
        <div class="schedule-body">
          <div class="schedule-time">${item.start}<span class="sep">—</span>${item.end}</div>
          <div class="schedule-meta">
            <span class="day-full">${escapeHtml(item.day)}</span>
            ${item.label ? `<span class="label-chip">${escapeHtml(item.label)}</span>` : ''}
          </div>
        </div>
        <button class="schedule-delete" title="Rimuovi orario">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      `;
      row.querySelector('.schedule-delete').addEventListener('click', () => removeSlot(item.id));
      listEl.appendChild(row);
    });
  }

  function addSlot(data){
    const slot = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
      day: data.day,
      start: data.start,
      end: data.end,
      label: data.label
    };
    schedule.push(slot);
    saveSchedule(schedule);
    renderList();
  }

  function removeSlot(id){
    const el = listEl.querySelector(`.schedule-item[data-id="${id}"]`);
    if(el){
      el.classList.add('removing');
      el.addEventListener('animationend', () => {
        schedule = schedule.filter(s => s.id !== id);
        saveSchedule(schedule);
        renderList();
      }, {once:true});
    }else{
      schedule = schedule.filter(s => s.id !== id);
      saveSchedule(schedule);
      renderList();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const day = document.getElementById('s-day').value;
    const start = document.getElementById('s-start').value;
    const end = document.getElementById('s-end').value;
    const label = document.getElementById('s-label').value.trim();

    if(!day || !start || !end || !label) return;

    if(start >= end){
      showToast('L\'orario di fine deve essere dopo l\'inizio');
      return;
    }

    addSlot({day, start, end, label});
    form.reset();
    showToast('Orario aggiunto');
  });

  let toastTimer;
  function showToast(msg){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('show'), 2200);
  }

  renderList();

})();
