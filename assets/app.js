
// Chargement config
const CFG = window.SITE_CONFIG || { BRAND_NAME:"Occaz+", PRIMARY_COLOR:"#2563eb", ACCENT_COLOR:"#22c55e", CONTACT_EMAIL:"contact@exemple.fr", DEFAULT_CITY:"" };

// Appliquer couleurs depuis config
document.documentElement.style.setProperty('--cfg-accent', CFG.PRIMARY_COLOR);
document.documentElement.style.setProperty('--cfg-accent2', CFG.ACCENT_COLOR);

// Données d'exemple (remplaçables)
const BASE_ANNONCES = [
  { id:1, titre: "Vélo route Triban RC120", prix: 220, ville: "Montbéliard", etat:"Très bon état", categorie:"Sport", img:"https://picsum.photos/seed/bike/600/400", date:"2025-09-05" },
  { id:2, titre: "iPhone 12 128Go", prix: 350, ville: "Belfort", etat:"Bon état", categorie:"High-Tech", img:"https://picsum.photos/seed/phone/600/400", date:"2025-09-08" },
  { id:3, titre: "Canapé 3 places gris", prix: 180, ville: "Sochaux", etat:"Correct", categorie:"Maison", img:"https://picsum.photos/seed/sofa/600/400", date:"2025-08-27" }
];

// LocalStorage helpers
const KEY = 'occaz_annonces';
function loadUserAnnonces(){
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch(e){ return []; }
}
function saveUserAnnonces(list){ localStorage.setItem(KEY, JSON.stringify(list)); }
function allAnnonces(){
  const user = loadUserAnnonces();
  return [...user, ...BASE_ANNONCES].sort((a,b)=> b.date.localeCompare(a.date));
}

// UI helpers
function formatEuro(n){ return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n); }

function renderCards(list, mount){
  if(!list.length){ mount.innerHTML = '<div class="notice">Aucune annonce pour ces filtres.</div>'; return; }
  mount.innerHTML = list.map(a => `
    <article class="card">
      <img src="${a.img}" alt="${a.titre}">
      <div class="body">
        <div class="badges">
          <span class="badge">${a.categorie}</span>
          <span class="badge">${a.etat}</span>
        </div>
        <h3 style="margin:6px 0">${a.titre}</h3>
        <div class="meta">
          <span>${a.ville}</span><span>${new Date(a.date).toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="price" style="margin-top:8px">${formatEuro(a.prix)}</div>
        <div style="margin-top:10px">
          <a class="btn" href="annonce.html?id=${a.id}">Voir</a>
        </div>
      </div>
    </article>
  `).join('');
}

function unique(list, key){
  return Array.from(new Set(list.map(x => x[key])));
}

function initBrand(){
  const brandEls = document.querySelectorAll('.brand-name');
  brandEls.forEach(el => el.textContent = CFG.BRAND_NAME);
  const contactLinks = document.querySelectorAll('a.mailto');
  contactLinks.forEach(a => a.href = `mailto:${CFG.CONTACT_EMAIL}`);
}

function initAnnonces(){
  const mount = document.querySelector('#cards');
  if(!mount) return;
  const annonces = allAnnonces();

  // Populate filters
  const catSelect = document.querySelector('#f-categorie');
  unique(annonces, 'categorie').forEach(c => {
    const o = document.createElement('option'); o.value = c; o.textContent = c; catSelect.appendChild(o);
  });

  // Hook filters
  const q = document.querySelector('#f-q');
  const pmin = document.querySelector('#f-min');
  const pmax = document.querySelector('#f-max');
  const cat = catSelect;
  function apply(){
    const term = (q?.value || '').trim().toLowerCase();
    const min = pmin?.value ? parseFloat(pmin.value) : -Infinity;
    const max = pmax?.value ? parseFloat(pmax.value) : Infinity;
    const c = cat?.value || "";
    const res = annonces.filter(a => 
      (a.titre.toLowerCase().includes(term) || a.ville.toLowerCase().includes(term)) &&
      (a.prix >= min && a.prix <= max) &&
      (c==="" || a.categorie===c)
    ).sort((a,b)=> b.date.localeCompare(a.date));
    renderCards(res, mount);
    updateKPIs(res);
  }
  [q,pmin,pmax,cat].forEach(el => el && el.addEventListener('input', apply));
  apply();
}

function updateKPIs(list){
  const k1 = document.querySelector('#k-total'); if(!k1) return;
  const k2 = document.querySelector('#k-moy'); 
  const k3 = document.querySelector('#k-min');
  const k4 = document.querySelector('#k-max');
  const n = list.length;
  const prix = list.map(a=>a.prix);
  const sum = prix.reduce((a,b)=>a+b,0);
  k1.textContent = n;
  k2.textContent = n? formatEuro(sum/n) : "—";
  k3.textContent = n? formatEuro(Math.min(...prix)) : "—";
  k4.textContent = n? formatEuro(Math.max(...prix)) : "—";
}

// Detail page
function initAnnonceDetail(){
  const el = document.querySelector('#detail'); if(!el) return;
  const annonces = allAnnonces();
  const params = new URLSearchParams(location.search);
  const id = parseInt(params.get('id'));
  const a = annonces.find(x=>x.id===id) || annonces[0];
  el.innerHTML = `
    <div class="grid" style="grid-template-columns:1.2fr 1fr">
      <div class="card"><img src="${a.img}" alt="${a.titre}"></div>
      <div class="card">
        <div class="body">
          <h2 style="margin:0 0 6px">${a.titre}</h2>
          <div class="price">${formatEuro(a.prix)}</div>
          <div class="badges" style="margin:10px 0">
            <span class="badge">${a.categorie}</span>
            <span class="badge">${a.etat}</span>
            <span class="badge">${a.ville}</span>
          </div>
          <p>Mis en ligne le ${new Date(a.date).toLocaleDateString('fr-FR')}</p>
          <div class="alert">Contactez le vendeur via le formulaire ci-dessous. Aucun paiement en ligne.</div>
          <a class="btn mailto" href="mailto:${CFG.CONTACT_EMAIL}?subject=${encodeURIComponent("Intéressé par: "+a.titre)}&body=${encodeURIComponent("Bonjour, je suis intéressé par votre annonce '"+a.titre+"' à "+formatEuro(a.prix)+".")}">Contacter</a>
        </div>
      </div>
    </div>
  `;
}

// Ajouter une annonce (localStorage)
function initAjouter(){
  const form = document.querySelector('#form-ajout'); if(!form) return;
  const city = form.querySelector('#ville');
  if(CFG.DEFAULT_CITY && city) city.value = CFG.DEFAULT_CITY;

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const list = loadUserAnnonces();
    const id = Date.now();
    const annonce = {
      id,
      titre: data.titre.trim(),
      prix: parseFloat(data.prix||0),
      ville: data.ville.trim() || CFG.DEFAULT_CITY || "",
      etat: data.etat,
      categorie: data.categorie,
      img: data.image || 'https://picsum.photos/seed/'+id+'/600/400',
      date: new Date().toISOString().slice(0,10)
    };
    list.unshift(annonce);
    saveUserAnnonces(list);
    form.reset();
    alert('Annonce ajoutée ! Elle apparaît maintenant dans la liste.');
    location.href = 'annonces.html';
  });

  // Afficher les annonces locales + suppression
  const mount = document.querySelector('#mes-annonces');
  const render = ()=>{
    const list = loadUserAnnonces();
    if(!list.length){ mount.innerHTML = '<div class="notice">Aucune annonce enregistrée sur cet appareil.</div>'; return; }
    mount.innerHTML = list.map(a=>`
      <div class="card" style="flex-direction:row;align-items:center">
        <img src="${a.img}" style="width:120px;height:90px;object-fit:cover" alt="${a.titre}">
        <div class="body" style="flex:1">
          <strong>${a.titre}</strong><div class="small">${a.categorie} • ${a.etat} • ${a.ville}</div>
        </div>
        <div style="padding:12px">
          <button class="btn" data-del="${a.id}">Supprimer</button>
        </div>
      </div>
    `).join('');
    mount.querySelectorAll('[data-del]').forEach(btn=> btn.addEventListener('click', ()=>{
      const id = parseInt(btn.getAttribute('data-del'));
      const left = loadUserAnnonces().filter(x=>x.id!==id);
      saveUserAnnonces(left);
      render();
    }));
  };
  render();
}

function initHeaderActive(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href===path) a.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initBrand();
  initHeaderActive();
  initAnnonces();
  initAnnonceDetail();
  initAjouter();
  const moisEl = document.getElementById('mois');
  if(moisEl) moisEl.textContent = new Date().toLocaleDateString('fr-FR', {month:'long', year:'numeric'});
});
