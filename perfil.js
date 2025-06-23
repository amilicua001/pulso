/* perfil.js – versión mínima basada en test.html */

import {
  getCurrentUser, listenToAuthChanges,
  fetchProfile, updateHabits, logout as supaLogout
} from './supabase-auth.js';

/* helpers DOM */
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const toast = m => { const t=$("#toast"); if(!t) return;
  t.textContent=m; t.classList.remove("hidden"); t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2500);
};

/* -------------- header + logout -------------- */
async function logoutGlobal(){
  try{ await supaLogout(); }catch{}
  localStorage.clear(); location.href='login.html';
}
function pintaHeader(u){
  const hd=$("#headerUser");
  if(u){ hd.textContent="Salir"; hd.onclick=logoutGlobal; }
  else { hd.textContent="Iniciar sesión"; hd.onclick=()=>location.href='login.html'; }
}

/* -------------- perfil -------------- */
async function pintaPerfil(u){
  const sin=$("#perfil-sin"), con=$("#perfil-con");
  if(!u){ sin.classList.remove("hidden"); con.classList.add("hidden"); return; }

  sin.classList.add("hidden");  con.classList.remove("hidden");

  $("#p-nombre").textContent = `Hola, ${u.user_metadata?.nombre || u.email}!`;
  $("#p-mail").textContent    = u.email;

  try{
    const p = await fetchProfile();   // {sueno, ejercicio, prioridad}
    $("#v-sueno").textContent = (p.sueno     ?? '-');
    $("#v-ej").textContent    = (p.ejercicio ?? '-');
    $("#v-prio").textContent  = (p.prioridad ?? '-');

    /* pre-selección en el form */
    $$("input[name='sue']").forEach(r=>r.checked=r.value===p.sueno);
    $$("input[name='ej']"). forEach(r=>r.checked=r.value===p.ejercicio);
    $$("input[name='prio']").forEach(r=>r.checked=r.value===p.prioridad);
  }catch(e){ console.warn(e); }
}

/* -------------- listeners -------------- */
function init(){
  /* cabecera / sesión */
  getCurrentUser().then(pintaHeader);
  listenToAuthChanges(pintaHeader);
  getCurrentUser().then(pintaPerfil);
  listenToAuthChanges(pintaPerfil);

  /* botones */
  $("#btnEdit").onclick  = ()=>{ $("#habitos-view").classList.add("hidden");
                                 $("#habitos-form").classList.remove("hidden"); };
  $("#btnCancel").onclick= ()=>{ $("#habitos-form").classList.add("hidden");
                                 $("#habitos-view").classList.remove("hidden"); };
  $("#btnLogout").onclick= logoutGlobal;

  /* guardado */
  $("#habitos-form").onsubmit = async e =>{
    e.preventDefault();
    const sueno=$("input[name='sue']:checked")?.value;
    const eje  =$("input[name='ej']:checked")?.value;
    const prio =$("input[name='prio']:checked")?.value;
    if(!sueno||!eje||!prio){ toast("Completa los 3 bloques"); return; }
    try{
      await updateHabits({ sueno, ejercicio:eje, prioridad:prio });
      toast("Hábitos guardados ✔");
      $("#habitos-form").classList.add("hidden");
      $("#habitos-view").classList.remove("hidden");
      pintaPerfil(await getCurrentUser());
    }catch(err){ console.error(err); toast(err.message||"Error"); }
  };
}

/* arranque */
if(document.readyState==="loading") window.addEventListener("DOMContentLoaded",init);
else init();
