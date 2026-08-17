# Einstufungstest — eigenständige App

Diese App braucht einen eigenen Anthropic-API-Key, damit die Gespräche
funktionieren, wenn Leute sie über deinen eigenen Link öffnen (z. B. nach
einem Social-Media-Post). Der Key liegt sicher auf dem Server (`api/chat.js`)
und ist im Browser-Code nicht sichtbar.

## Schritt 1 — API-Key holen
1. Auf https://console.anthropic.com registrieren/einloggen.
2. Unter "API Keys" einen neuen Key erstellen.
3. Guthaben aufladen (Nutzung wird nach Verbrauch abgerechnet).

## Schritt 2 — Bei Vercel deployen (kostenlos, mit HTTPS)
**Option A — ohne Kommandozeile:**
1. Ein kostenloses Konto auf https://vercel.com erstellen.
2. Diesen Ordner als GitHub-Repository hochladen (oder per Drag&Drop bei
   "Import Project" falls Vercel das anbietet).
3. Beim Import: unter "Environment Variables" hinzufügen:
   - Name: `ANTHROPIC_API_KEY`
   - Wert: dein Key aus Schritt 1
4. "Deploy" klicken. Du bekommst eine Live-URL wie
   `https://dein-projekt.vercel.app`.

**Option B — mit Kommandozeile:**
```
npm i -g vercel
cd einstufungstest-standalone
vercel
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

## Schritt 3 — Rate-Limit einrichten (empfohlen vor dem Posten!)
Ohne diesen Schritt läuft die App zwar, aber ohne Tageslimit — jede Person
kann beliebig oft testen, was deine API-Kosten hochtreiben kann.

1. Kostenloses Konto auf https://upstash.com erstellen.
2. Eine neue Redis-Datenbank anlegen (Free Tier reicht völlig).
3. In den Datenbank-Details findest du:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Beide als Environment Variables bei Vercel eintragen (wie in Schritt 2
   für `ANTHROPIC_API_KEY`), dann erneut deployen (`vercel --prod`).

Standardmäßig sind **15 Anfragen pro IP-Adresse und Tag** erlaubt. Das
kannst du in `api/chat.js` über die Konstante `RATE_LIMIT_PER_DAY` ändern.

Ohne Upstash-Zugangsdaten läuft die App weiter, aber **ohne Limit** —
für einen öffentlichen Post nicht empfohlen.

## Schritt 4 — Testen
Die Live-URL öffnen (nicht die lokale Datei!). HTTPS ist bei Vercel
automatisch aktiv, daher funktioniert auch das Mikrofon zuverlässig.

## Wichtig, bevor du den Link öffentlich postest
- **Kosten**: Jede Nutzung durch Besucher verbraucht Guthaben auf deinem
  API-Key. Das Rate-Limit aus Schritt 3 begrenzt das pro Person und Tag —
  setz zusätzlich ein monatliches Ausgabenlimit im Anthropic-Dashboard,
  falls du ganz sichergehen willst.
- **Modellname**: `claude-sonnet-4-6` in `api/chat.js` ggf. gegen ein
  aktuell verfügbares Modell aus https://docs.claude.com austauschen,
  falls sich das API-Angebot geändert hat.
