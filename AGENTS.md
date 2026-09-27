# Projektinstruktioner

- Läs `HANDOFF.md` och `README.md` innan arbete. Detaljplaner finns i `projektplaner/`; Botkyrka är första pilot.
- Bevara Next.js, Supabase, shadcn och separation of concerns som projektets grund.
- Håll verifierat implementationsläge skilt från planerade funktioner. Uppdatera `HANDOFF.md` vid avslutat arbetspass med ändringar, testresultat, öppna beslut och nästa steg.
- Egna platser är privata. Tillämpa RLS och testa användarisolering innan funktioner med användardata anses klara.
- Habitatklass är inte en kalibrerad fyndsannolikhet. Saknat dataunderlag ska synas, inte fyllas med fabricerade resultat.
- Använd inte ett befintligt Supabase-projekt enbart för att det syns i projektlistan. Verifiera avsett mål före ändringar.
- Spara inte hemligheter, sessionsuppgifter eller privata fyndkoordinater i projektdokumentation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
