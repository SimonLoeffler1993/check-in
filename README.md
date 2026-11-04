# Skiservice Check-in

Öffentliches Formular, über das Kunden ihre Daten selbst eingeben. Die App sieht dabei nie Klartext:

1. Der **Browser** verschlüsselt das Formular mit einem Public Key.
2. **TanStack Start** speichert nur den verschlüsselten Datensatz per Prisma in einer eigenen Zwischendatenbank (MariaDB).
3. Die **API** liest die Datensätze und entschlüsselt sie mit dem privaten Schlüssel, das **Center** übernimmt sie als Kunden.

Der private Schlüssel gehört **nie** auf den Server dieser App.

## Einrichtung

```bash
npm install
cp .env.example .env     # DATABASE_URL und CHECKIN_PUBLIC_KEY eintragen
npx prisma generate
npm run dev
```

Die Tabellen legt die API an, sie pflegt das Schema mit Alembic (`alembic -c alembic_checkin.ini upgrade head` in `skiserviceapi/`, beim Container-Start automatisch, wenn `CHECKIN_DB_HOST` gesetzt ist). Prisma ist hier nur der Datenbank-Client: Bei einer Schema-Änderung `prisma/schema.prisma` nachziehen und kein `prisma migrate` oder `prisma db push` verwenden.

### Schlüsselpaar

Das Schlüsselpaar erzeugt das Skiservice Center unter **Verwalten → Einstellungen → Check-in**. Den angezeigten Public Key von Hand als `CHECKIN_PUBLIC_KEY` eintragen und die App neu starten.

- Der private Schlüssel liegt in der Datenbank der API und verlässt sie über keine Schnittstelle. Er gehört **nie** auf den Server dieser App und nie in die Zwischendatenbank.
- Backups der API-Datenbank enthalten ihn mit. Wer die Haupt-DB oder ein Backup davon hat, kann alle noch offenen Check-ins entschlüsseln.
- Die App lehnt Schlüssel unter 3072 Bit ab, das Formular zeigt dann „nicht verfügbar“.
- Schlüsselwechsel: im Center einen neuen erzeugen und `CHECKIN_PUBLIC_KEY` tauschen. Alte Schlüssel bleiben, ältere Datensätze sind weiter lesbar. Die Spalte `schluesselId` zeigt, welcher Schlüssel zu einem Datensatz gehört.

## Abholen

Die API liest die Zwischendatenbank direkt (`CHECKIN_DB_HOST`, `_PORT`, `_USER`, `_PASSWORD`, `_NAME`) und entschlüsselt erst beim Anzeigen im Center. In der Kundensuche übernimmt „Letzte Kunden → Check-in“ einen Datensatz als Kunden, danach wird er aus der Zwischendatenbank gelöscht.

## Einstellungen

Alles kommt aus der Umgebung und wird zur Laufzeit gelesen, ein Ändern braucht nur einen Neustart.

| Variable | Pflicht | Standard | Wirkung |
|---|---|---|---|
| `DATABASE_URL` | ja | – | Zwischendatenbank |
| `CHECKIN_PUBLIC_KEY` | ja | – | Public Key, ohne ihn zeigt das Formular „nicht verfügbar“ |
| `CHECKIN_PRUEFDIALOG` | nein | an | Prüf-Dialog vor dem Absenden, nur `false` oder `0` schalten ihn ab |
| `CHECKIN_DATENSCHUTZ_URL` | nein | leer | Link im Footer und beim Absende-Knopf, leer = kein Link |
| `CHECKIN_IMPRESSUM_URL` | nein | leer | Link im Footer, leer = kein Link |
| `TRUST_PROXY` | nein | `0` | `1` hinter einem eigenen Reverse Proxy |

Für die Links gelten nur `http`- und `https`-URLs, alles andere wird ignoriert und ins Log geschrieben.

## Ablauf beim Absenden

Prüfen der Felder → Prüf-Dialog (falls an) → Verschlüsseln und Senden, der Brief wird verschlossen → **erst nach der Bestätigung des Servers** fliegt der Brief weg → „Vielen Dank“. Bei einem Fehler geht es mit Meldung und allen Eingaben zurück ins Formular. Wer im System „weniger Bewegung“ eingestellt hat, sieht den Ablauf ohne Animation.

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklung, liest `.env` |
| `npm run build` | `prisma generate` und Produktions-Build nach `.output/` |
| `node .output/server/index.mjs` | Produktion, Umgebungsvariablen müssen gesetzt sein |
| `npm run check` | Biome |

## Format eines Datensatzes

Tabelle `checkins`. Unverschlüsselt sind nur `id` und `erstelltAm`.

| Spalte | Inhalt |
|---|---|
| `version` | Format, aktuell `1` |
| `schluesselId` | SHA-256 des Public Keys (DER), hex |
| `verschluesselterSchluessel` | AES-Schlüssel, verschlüsselt mit RSA-OAEP (SHA-256, MGF1-SHA-256), Base64 |
| `iv` | 12 Byte, Base64 |
| `daten` | AES-256-GCM, Chiffretext mit angehängtem 16-Byte-Tag, Base64 |

Die Zusatzdaten (AAD) von AES-GCM sind `checkin:v1:<schluesselId>`. Der Klartext ist JSON:

```json
{
  "schemaVersion": 1,
  "erfasstAm": "2026-11-02T21:50:07.845Z",
  "kunde": { "Vorname": "", "Nachname": "", "Strasse": "", "Plz": "", "Ort": "", "Tel": "", "Handy": "", "Email": "" }
}
```

Die Entschlüsselung steht in `skiserviceapi/app/services/checkin.py`. Zum Prüfen mit einem eigenen Schlüsselpaar gibt es `tools/entschluesseln_test.py`:

```bash
pip install cryptography
python tools/entschluesseln_test.py checkin_privat.pem < umschlag.json
```

## Was die Verschlüsselung leistet und was nicht

**Schützt vor:** gestohlener Datenbank, Backups, Logs und Zugriff des Hosters auf die Datenbank.

**Schützt nicht vor einem übernommenen Webserver.** Wer den Server dieser App kontrolliert, kann geändertes JavaScript oder einen eigenen Public Key ausliefern und so neue Eingaben mitlesen. HTTPS und ein abgesicherter Server bleiben daher Pflicht.

Außerdem wichtig:

- **Nur über HTTPS:** Web Crypto gibt es nur über HTTPS oder localhost. Sonst zeigt das Formular einen Fehler und sendet nichts; einen Rückfall auf Klartext gibt es nicht.
- **Der Server kann den Inhalt nicht prüfen.** Die API muss jeden Datensatz nach dem Entschlüsseln selbst validieren und als ungeprüfte Eingabe behandeln. Auch Dubletten sind möglich.
- **Spam:** Das Formular ist öffentlich. Versteckter Honeypot und IP-Limit (10 pro Minute, pro Instanz) bremsen nur einfachen Missbrauch.
- **Reverse Proxy:**
  - `TRUST_PROXY=1` setzen, damit das Limit die echte Client-IP sieht, und `X-Forwarded-For` im Proxy überschreiben.
  - Die Größe von Anfragen dort begrenzen (z. B. 64 KB): Die App prüft die Größen erst nach dem Einlesen.

## Offen vor dem Internet-Betrieb

- Datenschutzerklärung und Impressum unter eigenen URLs bereitstellen und eintragen; das Formular verlinkt sie nur, eine Einwilligung fragt es nicht ab
- Löschfrist für nicht übernommene Datensätze
- Dockerfile und ein eigenes Compose, das die App sauber von der internen API trennt: Vorerst läuft alles nur zum Testen nebeneinander. Die App darf später weder die Datenbank noch den Container der API erreichen
- Strenge Content-Security-Policy, passend zu den Inline-Skripten des SSR
