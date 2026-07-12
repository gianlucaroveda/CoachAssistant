// Seleziona gli elementi
const fabAdd = document.getElementById('fab-add');
const modalOverlay = document.getElementById('modal-overlay');
const btnCancel = document.getElementById('btn-cancel');

// Apri il modale
function openModal() {
  modalOverlay.classList.add('open');
  // Focus sul primo campo dopo l'apertura
  setTimeout(() => document.getElementById('f-title').focus(), 300);
}

// Chiudi il modale
function closeModal() {
  modalOverlay.classList.remove('open');
  // Reset del form
  document.getElementById('exercise-form').reset();
  // Deseleziona tutti i tag
  document.querySelectorAll('.tag-pill.selected').forEach(p => p.classList.remove('selected'));
  selectedTags = [];
}

// Click sul pulsante + (apri)
fabAdd.addEventListener('click', openModal);

// Click su Annulla (chiudi)
btnCancel.addEventListener('click', closeModal);

// Click sul fondo scuro (chiudi)
modalOverlay.addEventListener('click', function(e) {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// Opzionale: tasto ESC per chiudere
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
    closeModal();
  }
});

// ===== POPOLA SELECT TIPOLOGIA =====
const TYPE_OPTIONS = ['Riscaldamento','Condizionamento fisico', 'Tecnica individuale', 'Tattica di squadra', 'Gioco / partita'];
const typeSelect = document.getElementById('f-type');
TYPE_OPTIONS.forEach(t => {
  const opt = document.createElement('option');
  opt.value = t;
  opt.textContent = t;
  typeSelect.appendChild(opt);
});

// ===== POPOLA TAG PICKER =====
const TAG_OPTIONS = ['attacco', 'difesa', 'coordinazione', 'tiro', 'palleggio', 'passaggio', 'agilità', 'forza', 'equilibrio', 'resistenza', 'velocità', 'salto', '1vs1', '2vs2', '3vs3', '4vs4', '5vs5'];
const tagPicker = document.getElementById('tag-picker');
let selectedTags = [];

TAG_OPTIONS.forEach(tag => {
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'tag-pill';
  pill.textContent = tag;
  pill.dataset.tag = tag;
  pill.addEventListener('click', function() {
    this.classList.toggle('selected');
    const tagName = this.dataset.tag;
    selectedTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName];
  });
  tagPicker.appendChild(pill);
});

// ===== FUNZIONE PER COPIARE NEGLI APPUNTI (fallback) =====
function copyToClipboard(text) {
  // Prova con l'API moderna
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback per browser più vecchi
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function generateId() {
  // Genera un ID di 8 caratteri alfanumerici casuali
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
}

// ===== SUBMIT FORM - GENERA JSON =====
document.getElementById('exercise-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const title = document.getElementById('f-title').value.trim();
  const type = document.getElementById('f-type').value;
  const description = document.getElementById('f-description').value.trim();
  const videoUrl = document.getElementById('f-video').value.trim();

  // Validazione - video NON obbligatorio
  if (!title || !type || !description) {
    alert('⚠️ Compila tutti i campi obbligatori!');
    return;
  }

  // Crea l'oggetto JSON  
  const exerciseData = {
    id: generateId(),
    title: title,
    type: type,
    tags: selectedTags,
    description: description,
    videoUrl: videoUrl || null,
  };

  // Converti in JSON formattato
  const jsonString = JSON.stringify(exerciseData, null, 2);

  // Mostra in console
  console.log('📋 NUOVO ESERCIZIO (JSON):');
  console.log(jsonString);

  // Mostra l'alert con il JSON
  const jsonMessage = `✅ ESERCIZIO CREATO!\n\n📄 JSON:\n${jsonString}\n\n📋 Copia il JSON con Ctrl+C (Cmd+C su Mac)`;

  // Crea un alert personalizzato con il testo selezionabile
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #0a1e2f;
    color: #f0f4f8;
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
    z-index: 9999;
    max-width: 90%;
    width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    font-family: 'Courier New', monospace;
  `;

  alertDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h3 style="color:#60a5fa;margin:0;">✅ JSON Generato</h3>
      <button id="closeJsonAlert" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:24px;cursor:pointer;">✕</button>
    </div>
    <pre style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);font-size:13px;line-height:1.6;overflow:auto;max-height:300px;white-space:pre-wrap;word-wrap:break-word;margin:0;">${jsonString}</pre>
    <div style="margin-top:16px;display:flex;gap:10px;">
      <button id="copyJsonBtn" style="background:#3b82f6;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600;flex:1;">📋 Copia JSON</button>
      <button id="closeJsonAlertBtn" style="background:rgba(255,255,255,0.1);color:#f0f4f8;border:1px solid rgba(255,255,255,0.1);padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600;">Chiudi</button>
    </div>
    <div id="copySuccess" style="color:#10b981;font-weight:600;margin-top:10px;display:none;">✅ Copiato negli appunti!</div>
  `;

  document.body.appendChild(alertDiv);

  // Funzione per chiudere l'alert
  function closeAlert() {
    if (document.body.contains(alertDiv)) {
      document.body.removeChild(alertDiv);
    }
  }

  // Eventi per chiudere
  document.getElementById('closeJsonAlert').addEventListener('click', closeAlert);
  document.getElementById('closeJsonAlertBtn').addEventListener('click', closeAlert);

  // Click fuori per chiudere
  alertDiv.addEventListener('click', function(e) {
    if (e.target === alertDiv) {
      closeAlert();
    }
  });

  // Copia JSON
  document.getElementById('copyJsonBtn').addEventListener('click', function() {
    copyToClipboard(jsonString)
      .then(() => {
        const successMsg = document.getElementById('copySuccess');
        successMsg.style.display = 'block';
        this.textContent = '✅ Copiato!';
        this.style.background = '#10b981';
        setTimeout(() => {
          successMsg.style.display = 'none';
          this.textContent = '📋 Copia JSON';
          this.style.background = '#3b82f6';
        }, 3000);
      })
      .catch(() => {
        // Se la copia fallisce, seleziona il testo
        const pre = alertDiv.querySelector('pre');
        const range = document.createRange();
        range.selectNode(pre);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        alert('Seleziona il JSON e premi Ctrl+C (Cmd+C su Mac) per copiarlo');
      });
  });

  // Resetta il form dopo l'invio
  closeModal();
});