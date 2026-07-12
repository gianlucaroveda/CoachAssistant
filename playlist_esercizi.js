const STORAGE_KEY = 'coach_esercizi';
  const TEMPLATES_URL = 'exercise-list.json';

// ordine di visualizzazione delle tipologie
  const TYPE_ORDER = ['Riscaldamento','Condizionamento fisico','Tecnica individuale','Tattica di squadra','Gioco / partita'];

  // un colore fisso per ciascuna tipologia (non più un ciclo casuale)
 const typeColorMap = {
    'Riscaldamento':          {accent:'var(--tide-400)',   glow:'var(--tide-400-glow)',   hex:'#4FB6C9', hexGlow:'rgba(79,182,201,.45)'},
    'Condizionamento fisico': {accent:'var(--bio-500)',    glow:'var(--bio-500-glow)',    hex:'#4EE1B6', hexGlow:'rgba(78,225,182,.45)'},
    'Tecnica individuale':    {accent:'var(--violet-500)', glow:'var(--violet-500-glow)', hex:'#9B7EF2', hexGlow:'rgba(155,126,242,.45)'},
    'Tattica di squadra':     {accent:'var(--coral-500)',  glow:'var(--coral-500-glow)',  hex:'#FF6F59', hexGlow:'rgba(255,111,89,.45)'},
    'Gioco / partita':        {accent:'var(--amber-500)',  glow:'var(--amber-500-glow)',  hex:'#F2A65A', hexGlow:'rgba(242,166,90,.45)'}
  };
  function styleForType(type){
    return typeColorMap[type] || {accent:'var(--tide-400)', glow:'var(--tide-400-glow)', hex:'#4FB6C9', hexGlow:'rgba(79,182,201,.45)'};
  }


  // ordina una lista di esercizi secondo TYPE_ORDER; tipologie sconosciute vanno in fondo
  function sortByType(list){
    return [...list].sort((a, b) => {
      const ia = TYPE_ORDER.indexOf(a.type);
      const ib = TYPE_ORDER.indexOf(b.type);
      return (ia === -1 ? TYPE_ORDER.length : ia) - (ib === -1 ? TYPE_ORDER.length : ib);
    });
  }

  let templates = [];

  async function loadTemplates(){
    try{
      const res = await fetch(TEMPLATES_URL);
      if(!res.ok) throw new Error('fetch fallita');
      templates = await res.json();
    }catch(e){
      console.error('Impossibile caricare exercise-list.json', e);
      templates = [];
    }
  }

  function loadExercises(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function saveExercises(list){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }catch(e){}
  }

  let exercises = loadExercises();

  const listEl = document.getElementById('list');

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderList(){
    listEl.innerHTML = '';

    if(exercises.length === 0){
      listEl.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="4"/></svg>
          <p>Nessun esercizio in lista.</p>
          <p class="hint">Premi "Genera" per crearne uno automaticamente, oppure aggiungine uno con il pulsante +.</p>
        </div>`;
      return;
    }


    const label = document.createElement('div');
    label.className = 'section-label';
    label.innerHTML = `<span>Esercizi in programma</span><span class="count">${exercises.length}</span>`;
    listEl.appendChild(label);

    const sortedExercises = sortByType(exercises);

  sortedExercises.forEach(ex => {
      const st = styleForType(ex.type);

      const strip = document.createElement('div');
      strip.className = 'strip';
      strip.dataset.id = ex.id;
      strip.style.setProperty('--accent', st.accent);
      strip.style.setProperty('--accent-glow', st.glow);
      strip.innerHTML = `
        <div class="gauge">
          <svg viewBox="0 0 48 48">
            <circle class="track" cx="24" cy="24" r="20"/>
            <circle class="fill" cx="24" cy="24" r="20" stroke-dasharray="${2*Math.PI*20}" stroke-dashoffset="0"
              style="stroke:${st.hex}; filter:drop-shadow(0 0 4px ${st.hexGlow});"/>
          </svg>
          <div class="mins">${escapeHtml((ex.type || '?').slice(0,3).toUpperCase())}</div>
        </div>
        <div class="strip-body">
          <div class="strip-title">${escapeHtml(ex.title)}</div>
          <div class="strip-meta">
            <span class="eq-text">${escapeHtml(ex.type || '')}${ex.tags && ex.tags.length ? ' · ' + ex.tags.map(escapeHtml).join(', ') : ''}</span>
          </div>
        </div>
        <button class="strip-remove" title="Rimuovi esercizio">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      `;

      // click sulla striscia (fuori dal bottone rimuovi) apre il popup con i dati JSON
      strip.addEventListener('click', () => {
        window.location.href = `dettaglio.html?id=${encodeURIComponent(ex.id)}`;
      });

      strip.querySelector('.strip-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeExercise(ex.id);
      });

      listEl.appendChild(strip);
    });
  }

  function addExercise(data){
    // mantiene lo stesso id del template scelto, così è ricollegabile ai dati originali
    const ex = {
      id: data.id,
      title: data.title,
      type: data.type,
      tags: data.tags || [],
      description: data.description || '',
      videoUrl: data.videoUrl || ''
    };
    exercises.push(ex);
    saveExercises(exercises);
    renderList();
  }

  function removeExercise(id){
    const el = listEl.querySelector(`.strip[data-id="${id}"]`);
    if(el){
      el.classList.add('removing');
      el.addEventListener('animationend', () => {
        exercises = exercises.filter(e => e.id !== id);
        saveExercises(exercises);
        renderList();
      }, {once:true});
    }else{
      exercises = exercises.filter(e => e.id !== id);
      saveExercises(exercises);
      renderList();
    }
  }

  /* ---------------- popup dati / JSON ---------------- */
  function openJsonView(ex){
    const overlay = document.getElementById('json-overlay');
    const titleEl = document.getElementById('json-title');
    const viewEl = document.getElementById('json-view');
    if(!overlay || !titleEl || !viewEl) return; // modale JSON non presente in pagina
    titleEl.textContent = ex.title;
    viewEl.textContent = JSON.stringify(ex, null, 2);
    overlay.classList.add('open');
  }

  (async function init(){
    await loadTemplates();
    renderList();
  })();