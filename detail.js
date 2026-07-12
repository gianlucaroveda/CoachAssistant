(function(){

  const TEMPLATES_URL = 'exercise-list.json';

  const typeAccentCycle = ['#4FB6C9', '#9B7EF2', '#FF6F59', '#4EE1B6'];
  let knownTypes = [];
  function colorForType(type){
    let idx = knownTypes.indexOf(type);
    if(idx === -1){ knownTypes.push(type); idx = knownTypes.length - 1; }
    return typeAccentCycle[idx % typeAccentCycle.length];
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function getIdFromUrl(){
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function renderNotFound(){
    document.getElementById('detail-main').innerHTML = `
      <div class="not-found">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5s1-2 2.5-2 2.5 1.2 2.5 2.5c0 1.5-2.5 2-2.5 3.5"/><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none"/></svg>
        <p>Esercizio non trovato.</p>
      </div>`;
  }

  function renderDetail(ex){
    const color = colorForType(ex.type);
    const main = document.getElementById('detail-main');

    main.innerHTML = `
      <div class="type-badge" style="--badge-color:${color}">${escapeHtml(ex.type || '')}</div>
      <div class="detail-title">${escapeHtml(ex.title)}</div>

      ${ex.tags && ex.tags.length ? `
        <div class="detail-tags">
          ${ex.tags.map(t => `<span class="detail-tag" style="--badge-color:${color}">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}

      <div class="detail-block">
        <h2>Descrizione</h2>
        <div class="detail-description">${escapeHtml(ex.description) || 'Nessuna descrizione disponibile.'}</div>
      </div>

      ${ex.videoUrl
        ? `<a class="video-btn" href="${escapeHtml(ex.videoUrl)}" target="_blank" rel="noopener noreferrer">
             <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
             Guarda il video
           </a>`
        : `<button type="button" class="video-btn disabled" disabled>
             <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
             Nessun video disponibile
           </button>`
      }
    `;
  }

  document.getElementById('detail-back-btn').addEventListener('click', () => {
    // se c'è una pagina precedente nella cronologia del sito, torna lì
    if(document.referrer && document.referrer.includes(window.location.host) && window.history.length > 1){
      window.history.back();
    }else{
      // fallback: nessuna cronologia utile (es. link diretto/bookmark) → torna alla home
      window.location.href = 'index.html';
    }
  });

const STORAGE_KEY = 'coach_esercizi';

  function loadSavedExercises(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }

  async function loadTemplates(){
    try{
      const res = await fetch(TEMPLATES_URL);
      if(!res.ok) throw new Error('fetch fallita');
      return await res.json();
    }catch(e){
      console.error('Impossibile caricare exercise-list.json', e);
      return [];
    }
  }

  async function init(){
    const id = getIdFromUrl();
    if(!id){ renderNotFound(); return; }

    // 1. cerca prima tra gli esercizi salvati dall'utente (localStorage)
    const saved = loadSavedExercises();
    let ex = saved.find(e => e.id === id);

    // 2. se non c'è, cerca nel file statico exercise-list.json
    if(!ex){
      const templates = await loadTemplates();
      ex = templates.find(t => t.id === id);
    }

    if(!ex){ renderNotFound(); return; }
    renderDetail(ex);
  }

  init();

})();