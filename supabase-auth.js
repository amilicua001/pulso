/* supabase-auth.js
 * – Configura Supabase
 * – Helpers de sesión, login, perfiles y decisiones
 * -------------------------------------------------- */
import { createClient }
  from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

//  ⚠️  Tus credenciales Supabase
const SUPABASE_URL  = 'https://drwrobfxpuhjswdsfhcv.supabase.co';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd3JvYmZ4cHVoanN3ZHNmaGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjI4MTksImV4cCI6MjA2NTAzODgxOX0.1R6zMj8D4VZVseiDaEpFraN9c94lEMEsf2JucxudoNk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

/* ========== AUTH ========== */
// 1- Login con Google
export const loginWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google' });

// 2- Registro con email  (✅ SIN user_metadata → evita error 400)
// Antes (no lanza):
// export const signUpEmail = ({ email, password }) =>
//   supabase.auth.signUp({ email, password });

// Después (lanza si hay error):
export const signUpEmail = async ({ email, password }) => {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;          // <-- ahora sí pasa al catch
  return true;                     // opcional
};

// 3- Login con email

export const signInEmail = async ({ email, password }) => {
  const { error } = await supabase.auth
    .signInWithPassword({ email, password });

  if (error) throw error;          // ← ahora sí llega al catch de login.html
  return true;                     // sesión iniciada OK
};


// 4- Logout seguro
export const logout = async () => {
  await supabase.auth.signOut().catch(() => {});          // silencio “ya cerrada”
  localStorage.removeItem('supabase.auth.token');         // extra-seguridad
};

/* ========== SESIÓN ========== */
export const getCurrentUser = () =>
  supabase.auth.getUser().then(({ data: { user } }) => user);

export const listenToAuthChanges = cb =>
  supabase.auth.onAuthStateChange((_e, s) => cb(s?.user ?? null));

/* ========== PERFILES ========== */
/*  upsert único: inserta o actualiza fila en 'profiles'
 *  Ahora acepta opcionalmente { nombre }                                      */
/*  Guarda SOLO los campos que llegan definidos  */
/* Guarda los campos indicados; crea la fila si aún no existe */
export const updateHabits = async ({ sueno, ejercicio, prioridad, nombre }) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Debes iniciar sesión');

  /* construimos objeto con claves realmente enviadas */
  const fields = {};
  if (sueno      !== undefined && sueno      !== null) fields.sueno      = sueno;
  if (ejercicio  !== undefined && ejercicio  !== null) fields.ejercicio  = ejercicio;
  if (prioridad  !== undefined && prioridad  !== null) fields.prioridad  = prioridad;
  if (nombre     !== undefined && nombre     !== null) fields.nombre     = nombre;

  if (Object.keys(fields).length === 0) return true;   // nada que guardar

  /* ---------- 1º intento: UPDATE parcial ---------- */
  let { error, count } = await supabase
    .from('profiles')
    .update(fields, { returning: 'minimal', count: 'exact' }) // no trae datos
    .eq('id', user.id);

  if (error) throw error;
  if (count && count > 0) return true;                  // fila actualizada ✅

  /* ---------- 2º intento: INSERT (la fila no existía) ---------- */
  ({ error } = await supabase
    .from('profiles')
    .insert({ id: user.id, ...fields }));

  if (error) throw error;
  return true;
};



/*  Si aún no existe fila devolvemos {} (sin error)  */
export const fetchProfile = async () => {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return {};   // “row not found”
    throw error;
  }
  return data;
};

/* ========== HISTORIAL ========== */
export const saveDecision = async ({ tipo, opciones, resultado }) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Debes iniciar sesión');

  const { error } = await supabase.from('decisions').insert({
    user_id:  user.id,
    tipo,
    opciones: JSON.stringify(opciones),
    resultado,
    fecha:    new Date().toISOString()
  });
  if (error) throw error;
};

export const fetchDecisionHistory = async (limit = 50) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Debes iniciar sesión');

  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    .order('fecha', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};


/* --------------------------------------------------------- */
/* Devuelve el nombre “bonito” del usuario                   */
/* Orden de preferencia:                                     */
/*   1) user_metadata.nombre                                 */
/*   2) columna profiles.nombre                              */
/*   3) parte local del email (antes de @)                   */
/* --------------------------------------------------------- */
export const getDisplayName = async user => {
  if (!user) return '';

  /* 1) metadatos */
  const meta = user.user_metadata?.nombre?.trim();
  if (meta) return meta;

  /* 2) tabla profiles */
  try {
    const { nombre } = await fetchProfile();        // usa la función que ya tienes
    if (nombre) return nombre;
  } catch { /* sin perfil aún */ }

  /* 3) fallback → email */
  return user.email.split('@')[0];
};
