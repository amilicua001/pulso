let modo = 'informada';

function irA(pantalla) {
  modo = pantalla;

  // Oculta todas
  document.getElementById('pantalla-inicio')?.classList.add('hidden');
  document.getElementById('pantalla-informada')?.classList.add('hidden');
  document.getElementById('pantalla-aleatoria')?.classList.add('hidden');

  // Muestra solo la que toca
  document.getElementById('pantalla-' + pantalla)?.classList.remove('hidden');

  // Actualiza pestañas
  document.querySelectorAll('.tab').forEach(tab => {
    const texto = tab.textContent.toLowerCase();
    tab.classList.toggle('active', texto === pantalla);
  });
}
  

function añadirOpcion(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Opción adicional';
  contenedor.appendChild(input);
}
function decidir(reintentar=false){
  const isAleatoria = window.location.href.includes('aleatoria');
  const contenedor = isAleatoria
      ? document.getElementById('opciones-aleatorias')
      : document.getElementById('opciones-informadas');
  const inputs = contenedor.querySelectorAll('input');
  const opciones = [...inputs].map(i=>i.value.trim()).filter(v=>v);
  if (opciones.length<2){ toast('Introduce al menos dos opciones'); return; }

  const elegida = isAleatoria
      ? opciones[Math.floor(Math.random()*opciones.length)]
      : opciones.reduce((a,b)=>a.length>b.length?a:b);

  guardarHistorial(isAleatoria?'Aleatoria':'Informada',opciones,elegida);  // Mostrar resultado visual
  document.getElementById('resultado-contenedor').classList.remove('hidden');
  document.getElementById('opcion-elegida').textContent = elegida;
  document.getElementById('frase-elegida').textContent = obtenerFrase();

  // Opcional: animar el botón
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
  const menu = document.getElementById('menu-lateral');
  const overlay = document.getElementById('overlay-menu');
  const isOpen = menu.classList.contains('show');

  if (isOpen) {
    menu.classList.remove('show');
    overlay.classList.add('hidden');
  } else {
    menu.classList.add('show');
    overlay.classList.remove('hidden');
  }
}


/* ---------- PERFIL ---------- */
function guardarPerfil() {
  const nombre = document.getElementById('perfil-nombre').value.trim();
  const email  = document.getElementById('perfil-email').value.trim();
  const meta   = document.getElementById('perfil-meta').value.trim();

  localStorage.setItem('pulsoPerfil', JSON.stringify({ nombre, email, meta }));
  alert('Perfil guardado');
}

/* Cargar datos al abrir perfil */
if (window.location.href.includes('perfil.html')) {
  const datos = JSON.parse(localStorage.getItem('pulsoPerfil') || '{}');
  if (datos.nombre) document.getElementById('perfil-nombre').value = datos.nombre;
  if (datos.email)  document.getElementById('perfil-email').value  = datos.email;
  if (datos.meta)   document.getElementById('perfil-meta').value   = datos.meta;
}

/* ---------- HISTORIAL ---------- */
// Cada vez que decidas, guarda un registro
function guardarHistorial(tipo, opciones, resultado) {
  const arr = JSON.parse(localStorage.getItem('pulsoHist') || '[]');
  arr.unshift({ fecha: new Date().toLocaleString(), tipo, opciones, resultado });
  localStorage.setItem('pulsoHist', JSON.stringify(arr));
}

/* Mostrar historial */
if (window.location.href.includes('historial.html')) {
  const lista = document.getElementById('historial-lista');
  const arr = JSON.parse(localStorage.getItem('pulsoHist') || '[]');
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
  if (confirm('¿Borrar todo el historial?')) {
    localStorage.removeItem('pulsoHist');
    location.reload();
  }
}
/* ===== helpers de users y sesión (ya los tenías) ===== */
function getUsers(){return JSON.parse(localStorage.getItem('pulsoUsers')||'[]');}
function setUsers(a){localStorage.setItem('pulsoUsers',JSON.stringify(a));}
function setCurrent(id){localStorage.setItem('pulsoCurrentUser',id);}
function getCurrent(){return localStorage.getItem('pulsoCurrentUser');}

/* ===== REFRESCA header y saludo menú ===== */
function refrescarUI(){
  const span  = document.getElementById('headerUser');
  const sal   = document.getElementById('saludo-menu');   // puede no estar
  const uid   = getCurrent();
  const user  = getUsers().find(u=>u.id===uid);

  // limpia antiguos handlers
  span.onclick = null;

  if (user){                                   /* --- LOGEADO --- */
    span.textContent = user.nombre;
    span.onclick     = logout;                 // click = cerrar sesión
    if(sal) sal.textContent = `Hola, ${user.nombre}!`;
  }else{                                       /* --- INVITADO --- */
    span.textContent = "Iniciar sesión";
    span.onclick     = ()=>location.href='login.html';
    if(sal) sal.textContent = "Hola, invitado!";
  }
}

/* ===== Logout sencillo ===== */
function logout(){
  localStorage.removeItem('pulsoCurrentUser');
  refrescarUI();
  toast('Sesión cerrada');
}

/* ===== Llamar al cargar (excepto en login.html) ===== */
if(!location.href.includes('login.html')){
  document.addEventListener('DOMContentLoaded', refrescarUI);
}
