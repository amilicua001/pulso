/* =========================================================== */
/* ----------  APP.JS  –  utilidades comunes + DECISOR -------- */
/* =========================================================== */

/* =========================== DECISOR ======================= */

function añadirOpcion(contenedorId){
  const contenedor = document.getElementById(contenedorId);
  const input      = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Escribe una opción…';
  contenedor.appendChild(input);
}

const KEYWORDS = {
  salud:        ['correr','gimnasio','andar','yoga','bicicleta','meditar','verdura','ensalada'],
  productividad:['estudiar','trabajar','leer','proyecto','limpiar','organizar','escribir'],
  ocio:         ['cine','jugar','netflix','descansar','salir','amigos','pasear','música']
};
  
function informedPick(opciones){
  /* gestor local antiguo —‐ si no hubiese perfil guardado usamos fallback
     (esta página no necesita Supabase) */
  const uid  = getCurrent();
  const user = getUsers().find(u => u.id === uid);
  if(!user || !user.preferencias){
    return opciones.reduce((a,b)=>a.length>b.length?a:b);
  }

  const pref = user.preferencias.prio;
  const eje  = user.habitos?.ejercicio;
  const scores = opciones.map(op=>{
    let s=0; const txt=op.toLowerCase();
    KEYWORDS[pref].forEach(k=>{ if(txt.includes(k)) s+=2; });
    if(eje==='3-5'&&KEYWORDS.ocio .some(k=>txt.includes(k))) s++;
    if(eje==='0'  &&KEYWORDS.salud.some(k=>txt.includes(k))) s++;
    return s;
  });

  const max = Math.max(...scores);
  if(max===0) return opciones.reduce((a,b)=>a.length>b.length?a:b);
  const top = opciones.filter((_,i)=>scores[i]===max);
  return top[Math.floor(Math.random()*top.length)];
}

function decidir(reintentar=false){
  const isAle = location.href.includes('aleatoria');
  const cont  = document.getElementById(isAle ? 'opciones-aleatorias'
                                              : 'opciones-informadas');
  const opc   = [...cont.querySelectorAll('input')]
                  .map(i=>i.value.trim()).filter(Boolean);
  if(opc.length<2){ toast('Introduce al menos dos opciones'); return; }

  const elegida = isAle ? opc[Math.floor(Math.random()*opc.length)]
                        : informedPick(opc);

  document.getElementById('resultado-contenedor').classList.remove('hidden');
  document.getElementById('opcion-elegida').textContent = elegida;
  document.getElementById('frase-elegida').textContent  = obtenerFrase();

  if(!reintentar){
    cont.style.display="none";
    document.querySelector('.btn-link')?.style.setProperty('display','none');
    document.querySelector('.btn-grad.btn-grande')?.style.setProperty('display','none');
  }
  guardarHistorial(isAle?'Aleatoria':'Informada',opc,elegida);
}

function obtenerFrase(){
  const frases=[
    "Confía en tu instinto.","Hoy es un buen día para empezar.","Lo importante es avanzar.",
    "Decidir también es crecer.","Sigue tu propio ritmo."
  ];
  return frases[Math.floor(Math.random()*frases.length)];
}

function toggleMenu(){
  document.getElementById('menu-lateral').classList.toggle('show');
  document.getElementById('menu-overlay').classList.toggle('hidden');
}

/* ======================= HISTORIAL local =================== */

function histKey(){ return 'pulsoHist_'+(getCurrent()||'guest'); }

function guardarHistorial(tipo,opciones,resultado){
  const arr = JSON.parse(localStorage.getItem(histKey())||'[]');
  arr.unshift({ fecha:new Date().toLocaleString(), tipo, opciones, resultado });
  localStorage.setItem(histKey(),JSON.stringify(arr));
}

if(location.href.includes('historial.html')){
  const lista = document.getElementById('historial-lista');
  const arr   = JSON.parse(localStorage.getItem(histKey())||'[]');
  lista.innerHTML = arr.length===0
      ? '<p>No hay decisiones guardadas aún.</p>'
      : arr.map(it=>`<div class="card-hist">
           <strong>${it.tipo}</strong> – ${it.fecha}<br>
           <em>${it.resultado}</em><br>
           <small>${it.opciones.join(', ')}</small>
         </div>`).join('');
}
function borrarHistorial(){
  if(!localStorage.getItem(histKey())){ toast('El historial ya está vacío'); return; }
  localStorage.removeItem(histKey()); toast('Historial borrado');
  setTimeout(()=>location.reload(),800);
}

/* ================= Utilidades del antiguo gestor local ===== */

function toast(msg){
  const t=document.getElementById('toast'); if(!t) return;
  t.textContent=msg; t.classList.remove('hidden'); t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}

function getUsers(){   return JSON.parse(localStorage.getItem('pulsoUsers')||'[]'); }
function setUsers(a){  localStorage.setItem('pulsoUsers',JSON.stringify(a)); }
function getCurrent(){ return localStorage.getItem('pulsoCurrentUser'); }
function setCurrent(id){localStorage.setItem('pulsoCurrentUser',id);}
function hash(s){ return btoa(s);} /* ofuscado mínimo */

/* ===== Arranque genérico (sólo para refrescar cabecera vieja) ===== */
if(!location.href.includes('login.html')){
  document.addEventListener('DOMContentLoaded',()=>{});
}
