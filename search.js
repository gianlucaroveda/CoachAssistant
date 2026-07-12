(function(){

  const TEMPLATES_URL = 'exercise-list.json';

  const TYPE_ORDER = ['Riscaldamento','Condizionamento fisico','Tecnica individuale','Tattica di squadra','Gioco / partita'];
  const TAG_OPTIONS = ['attacco','difesa','coordinazione','tiro','palleggio','passaggio','agilità','forza','equilibrio','resistenza','velocità','salto','1vs1','2vs2','3vs3','4vs4','5vs5'];

  const typeColorMap = {
    'Riscaldamento':          '#4FB6C9',
    'Condizionamento fisico': '#4EE1B6',
    'Tecnica individuale':    '#9B7EF2',
    'Tattica di squadra':     '#FF6F59',
    'Gioco / partita':        '#F2A65A'
  };
  function colorForType(type){ return typeColorMap[type] || '#4FB6C9'; }

  let templates = [];
  let activeTypes = new Set(TYPE_ORDER);   // tutte attive di default
  let activeTags = new Set();              // nessuna selezionata = nessun filtro tag
  let searchQuery = '';

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

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

  /* ---------------- filtri a pillole ---------------- */
  const typeFilterRow = document.getElementById('type-filter-row');
  const tagFilterRow = document.getElementById('tag-filter-row');

  function buildTypeFilters(){
    typeFilterRow.innerHTML = '';
    TYPE_ORDER.forEach(type => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'filter-pill type-pill active';
      pill.textContent = type;
      pill.style.setProperty('--pill-color', colorForType(type));
      pill.addEventListener('click', () => {
        if(activeTypes.has(type)) activeTypes.delete(type);
        else activeTypes.add(type);
        pill.classList.toggle('active');
        render();
      });
      typeFilterRow.appendChild(pill);
    });
  }

  function buildTagFilters(){
    tagFilterRow.innerHTML = '';
    TAG_OPTIONS.forEach(tag => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'filter-pill tag-pill-filter';
      pill.textContent = tag;
      pill.addEventListener('click', () => {
        if(activeTags.has(tag)) activeTags.delete(tag);
        else activeTags.add(tag);
        pill.classList.toggle('active');
        render();
      });
      tagFilterRow.appendChild(pill);
    });
  }

  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    render();
  });

  /* ---------------- matching ---------------- */
  function matchesQuery(ex){
    if(!searchQuery) return true;
    const haystack = [
      ex.title || '',
      ex.type || '',
      ...(ex.tags || [])
    ].join(' ').toLowerCase();
    return haystack.includes(searchQuery);
  }

  function matchesTags(ex){
    if(activeTags.size === 0) return true;
    return (ex.tags || []).some(tag => activeTags.has(tag));
  }

  /* ---------------- render ---------------- */
  const mainEl = document.getElementById('search-main');

  /* ---------------- playlist (localStorage condiviso con index.html) ---------------- */
  const PLAYLIST_KEY = 'coach_esercizi';

  function loadPlaylist(){
    try{
      const raw = localStorage.getItem(PLAYLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function savePlaylist(list){
    try{ localStorage.setItem(PLAYLIST_KEY, JSON.stringify(list)); }catch(e){}
  }
  function isInPlaylist(id){
    return loadPlaylist().some(e => e.id === id);
  }
  function addToPlaylist(ex){
    const list = loadPlaylist();
    list.push({
      id: ex.id,
      title: ex.title,
      type: ex.type,
      tags: ex.tags || [],
      description: ex.description || '',
      videoUrl: ex.videoUrl || ''
    });
    savePlaylist(list);
  }

  let toastTimer;
  function showToast(msg){
    const t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  }

  function render(){
    mainEl.innerHTML = '';

    const visibleTypes = TYPE_ORDER.filter(t => activeTypes.has(t));
    let totalMatches = 0;

    visibleTypes.forEach(type => {
      const matches = templates.filter(ex =>
        ex.type === type && matchesQuery(ex) && matchesTags(ex)
      );
      if(matches.length === 0) return;

      totalMatches += matches.length;
      const color = colorForType(type);

      const section = document.createElement('div');
      section.className = 'type-section';
      section.innerHTML = `
        <div class="type-section-header">
          <div class="type-dot" style="--pill-color:${color}"></div>
          <div class="type-section-title">${escapeHtml(type)}</div>
          <div class="type-section-count">${matches.length}</div>
        </div>
        <div class="results-list" id="results-${type.replace(/\s+/g,'-')}"></div>
      `;
      mainEl.appendChild(section);

      const list = section.querySelector('.results-list');
      matches.forEach(ex => {
        const row = document.createElement('div');
        row.className = 'result-card';
        row.style.setProperty('--accent', color);

        const isAdded = isInPlaylist(ex.id);
        row.innerHTML = `
          <div class="result-card-title">${escapeHtml(ex.title)}</div>
          <button type="button" class="result-add-btn ${isAdded ? 'added' : ''}" title="${isAdded ? 'Già in allenamento' : 'Aggiungi all\'allenamento'}">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round">${isAdded ? '<path d="M20 6 9 17l-5-5"/>' : '<path d="M12 5v14M5 12h14"/>'}</svg>
          </button>
        `;

        // click sulla card (fuori dal bottone +) apre il dettaglio
        row.addEventListener('click', () => {
          window.location.href = `dettaglio.html?id=${encodeURIComponent(ex.id)}`;
        });

        // click sul bottone + aggiunge alla playlist senza cambiare pagina
        const addBtn = row.querySelector('.result-add-btn');
        addBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if(isInPlaylist(ex.id)){
            showToast('Già presente in allenamento');
            return;
          }
          addToPlaylist(ex);
          addBtn.classList.add('added');
          addBtn.querySelector('svg').innerHTML = '<path d="M20 6 9 17l-5-5"/>';
          addBtn.title = 'Già in allenamento';
          showToast('Esercizio aggiunto');
        });

        list.appendChild(row);
      });
    });

    if(totalMatches === 0){
      mainEl.innerHTML = `
        <div class="search-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <p>Nessun esercizio trovato con questi filtri.</p>
        </div>`;
    }
  }

  async function init(){
    buildTypeFilters();
    buildTagFilters();
    await loadTemplates();
    render();
  }

  init();

})();