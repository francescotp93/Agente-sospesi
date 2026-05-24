// ═══════════════════════════════════════════════════════════════
//  CONFIGURAZIONE AGENTE SOSPESI
//  Inserisci qui la tua API key di Groq (GRATUITA)
//  Registrati su: https://console.groq.com → API Keys → Create
// ═══════════════════════════════════════════════════════════════

window.GROQ_API_KEY = 'gsk_INSERISCI-QUI-LA-TUA-CHIAVE-GROQ';

// ── SUPABASE (database cloud per salvare i dati) ──────────────
window.SUPABASE_URL  = 'https://ekjxrnsfqxnfxzrthdcf.supabase.co';
window.SUPABASE_KEY  = 'sb_publishable_Rq3qH44zdc8wUOsY7pfHvw_ny0XF9Cv';

// Soglie di allerta (puoi modificarle)
window.CONFIG = {
  SOGLIA_GIORNI_CRITICO:    60,
  SOGLIA_GIORNI_ATTENZIONE: 30,
  SOGLIA_SCARTO_CASSA:    0.50,
};
