/* ---------------- OROLOGIO DI SISTEMA ---------------- */
const timeEl = document.getElementById('clock-time');
const secEl = document.getElementById('clock-sec');
const dateEl = document.getElementById('clock-date');

function pad(n){return n.toString().padStart(2,'0');}

function tick(){
  const now = new Date();
  timeEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  secEl.textContent = pad(now.getSeconds());
  dateEl.textContent = now.toLocaleDateString('it-IT',{weekday:'long', day:'numeric', month:'long'});
}
tick();
setInterval(tick, 1000);

/* ---------------- PARTICELLE AMBIENTE ---------------- */
const particlesEl = document.getElementById('particles');
for(let i=0;i<14;i++){
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.left = Math.random()*100 + '%';
  p.style.setProperty('--drift', (Math.random()*40-20)+'px');
  p.style.animationDuration = (10 + Math.random()*14) + 's';
  p.style.animationDelay = (Math.random()*14) + 's';
  particlesEl.appendChild(p);
}