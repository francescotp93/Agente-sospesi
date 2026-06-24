-- ═══════════════════════════════════════════════════════════════════════════════
--  CONTABILITÀ CONDIVISA — rende la contabilità IAM visibile/modificabile da TUTTI
--  gli utenti autenticati (è l'unico dato condiviso; il resto resta per-utente).
--
--  Tabelle interessate:
--    • sessioni_giornaliere  → cassa, contanti, versamenti, spese, fondo, POS,
--                              sospesi/incassi (sotto-tab Carica/Anomalie/Sospesi/Storico)
--    • iam_conto             → estratto conto, spunte e note (sotto-tab "Conto")
--
--  COME ESEGUIRLO:
--    Supabase → progetto → SQL Editor → incolla tutto → Run.
--    È sicuro e reversibile (cambia solo le policy RLS, non i dati).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) (Diagnosi facoltativa) vedi le policy attuali prima di cambiare:
-- select tablename, policyname, cmd, qual, with_check
--   from pg_policies
--  where schemaname='public' and tablename in ('sessioni_giornaliere','iam_conto');

-- 2) Rimuove le vecchie policy per-utente su entrambe le tabelle
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('sessioni_giornaliere', 'iam_conto')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 3) Mantiene la RLS attiva
alter table public.sessioni_giornaliere enable row level security;
alter table public.iam_conto            enable row level security;

-- 4) Policy CONDIVISA: ogni utente autenticato legge/scrive TUTTE le righe
create policy "contabilita_condivisa_all" on public.sessioni_giornaliere
  for all to authenticated using (true) with check (true);

create policy "conto_condiviso_all" on public.iam_conto
  for all to authenticated using (true) with check (true);

-- Fatto. Da ora la contabilità è uguale per tutti gli utenti dell'agenzia.
