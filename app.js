function añadirOpcion(contenedorId){
  const contenedor = document.getElementById(contenedorId);
  const input = document.createElement('input');
  input.type = 'textc';
  input.placeholder = 'Escribe una opción…';   // ← mismo placeholder
  contenedor.appendChild(input);
}


/* ========= Heurística mini ========= */
const KEYWORDS = {
  salud:        ['correr','gimnasio','andar','yoga','bicicleta','meditar','verdura','ensalada'],
  productividad:['estudiar','trabajar','leer','proyecto','limpiar','organizar','escribir'],
  ocio:         ['cine','jugar','netflix','descansar','salir','amigos','pasear','música']
};

function informedPick(opciones){
  const uid = getCurrent();
  const user = getUsers().find(u=>u.id===uid);
  if(!user || !user.preferencias){              // sin datos -> fallback
    return opciones.reduce((a,b)=>a.length>b.length?a:b);
  }

  // calcula para cada opción una puntuación
  const pref   = user.preferencias.prio;        // salud / productividad / ocio
  const ejer   = user.habitos?.ejercicio;       // 0 / 1-2 / 3-5
  const scores = opciones.map(op=>{
    let s = 0;
    const txt = op.toLowerCase();

    // +2 si contiene palabra de la preferencia principal
    KEYWORDS[pref].forEach(k=>{ if(txt.includes(k)) s+=2; });

    // ajuste por ejercicio
    if(ejer==='3-5' && KEYWORDS.ocio.some(k=>txt.includes(k)))      s+=1;
    if(ejer==='0'   && KEYWORDS.salud.some(k=>txt.includes(k)))     s+=1;

    return s;
  });

  // busca la mejor puntuación
  const max = Math.max(...scores);
  const top = opciones.filter((_,i)=>scores[i]===max);
  // si todas son 0 usamos longitud como antes
  if(max===0){ return opciones.reduce((a,b)=>a.length>b.length?a:b); }
  return top[Math.floor(Math.random()*top.length)];
}


function decidir(reintentar = false) {
  const isAleatoria = window.location.href.includes('aleatoria');
  const contenedor = isAleatoria
    ? document.getElementById('opciones-aleatorias')
    : document.getElementById('opciones-informadas');

  const inputs = contenedor.querySelectorAll('input');
  const opciones = [...inputs].map(i => i.value.trim()).filter(v => v);

  if (opciones.length < 2) { toast('Introduce al menos dos opciones'); return; }

const elegida = isAleatoria
      ? opciones[Math.floor(Math.random()*opciones.length)]
      : informedPick(opciones);        // ← antes usábamos length


  document.getElementById('resultado-contenedor').classList.remove('hidden');
  document.getElementById('opcion-elegida').textContent = elegida;
  document.getElementById('frase-elegida').textContent = obtenerFrase();

  if (!reintentar) {
    contenedor.style.display = "none";
    document.querySelector(".btn-link").style.display = "none";
    document.querySelector(".btn-grad.btn-grande").style.display = "none";
  }
  guardarHistorial(isAleatoria ? 'Aleatoria' : 'Informada', opciones, elegida);
}

function obtenerFrase() {
  const frases = [
    "Confía en tu instinto.",
    "Hoy es un buen día para empezar.",
    "Lo importante es avanzar.",
    "Decidir también es crecer.",
    "Sigue tu propio ritmo."
  ];
  return frases[Math.floor(Math.random() * frases.length)];
}

function toggleMenu() {
  const menu    = document.getElementById('menu-lateral');
  const overlay = document.getElementById('menu-overlay');
  const open    = menu.classList.contains('show');

  menu.classList.toggle('show', !open);
  overlay.classList.toggle('hidden', open);
}

/* ====================================================================== */
/* ------------------------- PERFIL 2.0 --------------------------------- */
/* ====================================================================== */

function toggleHabitos() {
  document.getElementById('habitos-vista').classList.toggle('hidden');
  document.getElementById('habitos-editar').classList.toggle('hidden');
}
function togglePass() {
  document.getElementById('box-pass').classList.toggle('hidden');
}

function loadPerfil() {
  const user = getUsers().find(u => u.id === getCurrent());
  const con  = document.getElementById('perfil-con-sesion');
  const sin  = document.getElementById('perfil-sin-sesion');
  

  if (!user) {                       // Invitado
    sin.classList.remove('hidden');
    con.classList.add('hidden');
    return;
  }

  // Datos básicos
  document.getElementById('perfil-nombre').textContent = 'Hola, ' + user.nombre + '!';
  document.getElementById('perfil-email').textContent  = user.email;

  // Hábitos en modo lectura
  const h = user.habitos || { sueno: '-', ejercicio: '-' };
  document.getElementById('vista-sueno').textContent = 'Horas de sueño: ' + h.sueno;
  document.getElementById('vista-ej').textContent    = 'Ejercicio: ' + (h.ejercicio === '0' ? 'Nunca' : h.ejercicio);
  
  const prio = user.preferencias?.prio || '-';
document.getElementById('vista-prio').textContent = 'Prioridad: ' + prio;

  // Pre-seleccionar radios
  document.querySelectorAll('input[name="p-sueno"]').forEach(r => r.checked = (r.value === h.sueno));
  document.querySelectorAll('input[name="p-ej"]').forEach   (r => r.checked = (r.value === h.ejercicio));
  document.querySelectorAll('input[name="p-prio"]').forEach(r => r.checked = (r.value === prio));

  con.classList.remove('hidden');
  sin.classList.add('hidden');
}

function guardarHabitosPerfil() {
  const sueno = document.querySelector('input[name="p-sueno"]:checked')?.value;
  const eje   = document.querySelector('input[name="p-ej"]:checked')?.value;
  const prio  = document.querySelector('input[name="p-prio"]:checked')?.value;
  if (!sueno || !eje || !prio) { toast('Completa los tres bloques'); return; }

  const users = getUsers();
  const i     = users.findIndex(u => u.id === getCurrent());
  users[i].habitos       = { sueno, ejercicio: eje };
  users[i].preferencias  = { prio };
  setUsers(users);

  toast('Hábitos guardados');
  toggleHabitos();
  loadPerfil();
}

function guardarPassword() {
  const act = document.getElementById('pass-actual').value.trim();
  const neu = document.getElementById('pass-nueva').value.trim();

  const users = getUsers();
  const i     = users.findIndex(u => u.id === getCurrent());
  if (i < 0) return;

  if (hash(act) !== users[i].pass) { toast('Contraseña actual incorrecta'); return; }
  if (neu.length < 4) { toast('Mínimo 4 caracteres'); return; }

  users[i].pass = hash(neu);
  setUsers(users);

  toast('Contraseña cambiada 👍');
  togglePass();
}

/* Auto-carga cuando estamos en perfil.html */
if (location.href.includes('perfil.html')) {
  document.addEventListener('DOMContentLoaded', () => { refrescarUI(); loadPerfil(); });
}

/* ====================================================================== */
/* ----------------------- HISTORIAL, LOGIN, REGISTRO ------------------- */
/* ====================================================================== */

/* ---------- HISTORIAL ---------- */
function histKey() { return 'pulsoHist_' + (getCurrent() || 'guest'); }

function guardarHistorial(tipo, opciones, resultado) {
  const arr = JSON.parse(localStorage.getItem(histKey()) || '[]');
  arr.unshift({ fecha: new Date().toLocaleString(), tipo, opciones, resultado });
  localStorage.setItem(histKey(), JSON.stringify(arr));
}

/* Mostrar historial */
if (window.location.href.includes('historial.html')) {
  const lista = document.getElementById('historial-lista');
  const arr = JSON.parse(localStorage.getItem(histKey()) || '[]');
  if (arr.length === 0) {
    lista.innerHTML = '<p>No hay decisiones guardadas aún.</p>';
  } else {
    lista.innerHTML = arr.map(item => `
      <div class="card-hist">
        <strong>${item.tipo}</strong> – ${item.fecha}<br>
        <em>${item.resultado}</em><br>
        <small>${item.opciones.join(', ')}</small>
      </div>
    `).join('');
  }
}

function borrarHistorial() {
  const arr = JSON.parse(localStorage.getItem(histKey()) || '[]');
  if (arr.length === 0){
    toast('El historial ya está vacío');
    return;
  }
  localStorage.removeItem(histKey());
  toast('Historial borrado');
  setTimeout(()=>location.reload(), 800);   // refresca lista tras el toast
}


/* ===== Toast reutilizable ===== */
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* ---------- Registro wizard (PASO 0-1-2) ---------- */
let wizardPaso = 0;
const regTemp = {};

function activarDot() {
  document.querySelectorAll('.step-dot')
    .forEach((d, i) => d.classList.toggle('active', i === wizardPaso));
}
function mostrarPaso(i) {
  wizardPaso = i;
  activarDot();
  document.querySelectorAll('.paso').forEach((s, idx) =>
    s.classList.toggle('hidden', idx !== i));
}

/* PASO 1 */
function guardarCuenta() {
  const nombre = document.getElementById('r-nombre').value.trim();
  const email  = document.getElementById('r-email').value.trim();
  const pass   = document.getElementById('r-pass').value.trim();

  if (!nombre || !email || !pass) { toast('Rellena todos los campos'); return; }

  document.getElementById('cta-login').classList.add('hidden');

  if (getUsers().some(u => u.email === email)) {
    toast('Ese email ya existe');
    document.getElementById('cta-login').classList.remove('hidden');
    return;
  }

  regTemp.nombre = nombre;
  regTemp.email  = email;
  regTemp.pass   = hash(pass);

  mostrarPaso(1);
}

/* PASO 2 */
function guardarHabitos() {
  const sueno     = document.querySelector('input[name="r-sueno"]:checked')?.value;
  const ejercicio = document.querySelector('input[name="r-ejercicio"]:checked')?.value;
  if (!sueno || !ejercicio) { toast('Elige una opción en cada bloque'); return; }

  regTemp.habitos = { sueno, ejercicio };
  mostrarPaso(2);
}

/* PASO 3 y final */
function guardarPreferencias() {
  const prio = document.querySelector('input[name="r-prio"]:checked').value;
  regTemp.preferencias = { prio };

  const users = getUsers();
  const id    = Date.now().toString();
  users.push({ ...regTemp, id });
  setUsers(users); setCurrent(id);

  toast('¡Cuenta creada!');
  setTimeout(() => location.href = 'index.html', 800);
}

if (location.href.includes('registro.html')) {
  document.addEventListener('DOMContentLoaded', () => mostrarPaso(0));
}

/* ===== helpers de users y sesión ===== */
function getUsers()   { return JSON.parse(localStorage.getItem('pulsoUsers') || '[]'); }
function setUsers(a)  { localStorage.setItem('pulsoUsers', JSON.stringify(a)); }
function setCurrent(id){ localStorage.setItem('pulsoCurrentUser', id); }
function getCurrent() { return localStorage.getItem('pulsoCurrentUser'); }

/* ===== REFRESCA header y saludo menú ===== */
function refrescarUI() {
  const span = document.getElementById('headerUser');
  const sal  = document.getElementById('saludo-menu');
  const uid  = getCurrent();
  const user = getUsers().find(u => u.id === uid);

  span.onclick = null;

  if (user) {                     // LOGEADO
    span.textContent = user.nombre;
    span.onclick     = logout;
    if (sal) sal.textContent = `Hola, ${user.nombre}!`;
  } else {                        // INVITADO
    span.textContent = "Iniciar sesión";
    span.onclick     = () => location.href = 'login.html';
    if (sal) sal.textContent = "Hola, invitado!";
  }
}

/* ===== LOGIN / CREAR CUENTA / LOGOUT ===== */
function login() {
  const mail = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  if (!mail || !pass) { toast('Introduce email y contraseña'); return; }

  const users = getUsers();
  const u = users.find(u => u.email === mail && u.pass === hash(pass));

  if (!u) { toast('Credenciales incorrectas. Inténtalo de nuevo'); return; }

  setCurrent(u.id); refrescarUI();
  toast('¡Bienvenido, ' + u.nombre + '!');
  setTimeout(() => location.href = 'index.html', 800);
}

function crearCuenta() {
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email  = document.getElementById('reg-email').value.trim();
  const pass   = document.getElementById('reg-pass').value.trim();
  if (!nombre || !email || !pass) { toast('Completa todos los campos'); return; }

  const users = getUsers();
  if (users.some(u => u.email === email)) { toast('Ese email ya está registrado'); return; }

  const id = Date.now().toString();
  users.push({ id, nombre, email, pass: hash(pass) });
  setUsers(users); setCurrent(id);

  toast('Cuenta creada. ¡Bienvenido!');
  refrescarUI();
  setTimeout(() => location.href = 'index.html', 800);
}

function logout() {
  localStorage.removeItem('pulsoCurrentUser');
  refrescarUI();
  toast('Sesión cerrada');
}

/* ===== Arranque ===== */
if (!location.href.includes('login.html')) {
  document.addEventListener('DOMContentLoaded', refrescarUI);
}
if (location.href.includes('login.html') && getCurrent()) {
  location.href = 'index.html';
}

function hash(s) { return btoa(s); }     // hash rápido base64 (solo ofusca)
