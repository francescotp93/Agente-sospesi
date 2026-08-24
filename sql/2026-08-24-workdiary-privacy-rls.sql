-- ═══════════════════════════════════════════════════════════════════════════
--  WORK DIARY — la visibilità la decide il DATABASE, non il browser
--  (APPLICATO in produzione il 2026-08-24)
--
--  BUG: ogni utente vedeva le voci di diario di TUTTI.
--
--  Causa: su iam_workdiary c'erano DUE policy SELECT permissive. In Postgres le
--  policy permissive per lo stesso comando si combinano in OR, quindi:
--       iam_workdiary_select  →  USING (true)              ← faceva vedere tutto
--    OR wd_select             →  USING (proprie OR condivise)
--  = true. La policy giusta (wd_select) veniva annullata da quella con `true`.
--
--  Il frontend filtrava già a «proprie + condivise», ma era un filtro CLIENT:
--  aggirabile da chiunque interroghi Supabase con la propria sessione. La
--  visibilità deve stare qui, dove non si scavalca.
--
--  FIX: si rimuove la policy permissiva. Resta wd_select, che limita la lettura
--  alle proprie voci più quelle esplicitamente condivise (auth.uid() dentro
--  condivisi_con). Vale per TUTTI, admin e top_master compresi — nessuna
--  scorciatoia. Insert/update/delete erano già corretti (owner-only, con
--  update esteso ai condivisi).
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists iam_workdiary_select on public.iam_workdiary;

-- Policy che RESTA (già presente, qui solo per riferimento — non ricrearla):
--   create policy wd_select on public.iam_workdiary for select to authenticated
--   using (utente_id = auth.uid()
--          or (auth.uid())::text = any (coalesce(condivisi_con, '{}'::text[])));

-- ── Come si è verificato (RLS provata simulando due utenti diversi) ──────────
-- begin;
--   set local role authenticated;
--   select set_config('request.jwt.claims','{"sub":"<uuid-utente>","role":"authenticated"}', true);
--   select count(*) from iam_workdiary;   -- deve dare: sue + condivise-con-lui, NON il totale
-- rollback;
--
-- Esito 2026-08-24:
--   Antonio (admin):        236 → 19  (17 sue + 2 condivise)
--   Francesco (top_master): 236 → 221 (219 sue + 2 condivise)
