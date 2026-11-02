# Skiservice Check-in

Öffentliches Formular, über das Kunden ihre Daten selbst eingeben. Die App sieht dabei nie Klartext:

1. Der **Browser** verschlüsselt das Formular mit einem Public Key.
2. **TanStack Start** speichert nur den verschlüsselten Datensatz per Prisma in einer eigenen Zwischendatenbank (MariaDB).
3. Die **API** holt die Datensätze später ab und entschlüsselt sie mit dem privaten Schlüssel. Dieser Teil ist noch nicht gebaut.

Der private Schlüssel gehört **nie** auf den Server dieser App.

## Einrichtung

```bash
npm install
cp .env.example .env     # DATABASE_URL und CHECKIN_PUBLIC_KEY eintragen
npm run db:migrate       # Tabellen anlegen (prisma migrate deploy)
npx prisma generate
npm run dev
```

### Schlüsselpaar erzeugen

Außerhalb des Repos und am besten auf dem Rechner, der später entschlüsselt:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out checkin_privat.pem
openssl rsa -in checkin_privat.pem -pubout -outform DER | base64 -w0   # Wert für CHECKIN_PUBLIC_KEY
```

- `checkin_privat.pem` sicher sichern. **Ohne ihn sind alle Datensätze unwiederbringlich verloren.**
- Die App lehnt Schlüssel unter 3072 Bit ab, das Formular zeigt dann „nicht verfügbar“.
- Schlüsselwechsel: `CHECKIN_PUBLIC_KEY` tauschen und den alten privaten Schlüssel behalten, bis alle alten Datensätze abgeholt sind. Die Spalte `schluesselId` zeigt, welcher Schlüssel zu einem Datensatz gehört.

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklung, liest `.env` |
| `npm run build` | `prisma generate` und Produktions-Build nach `.output/` |
| `node .output/server/index.mjs` | Produktion, Umgebungsvariablen müssen gesetzt sein |
| `npm run db:neu` | neue Migration nach Änderung am Schema (`prisma migrate dev`) |
| `npm run db:migrate` | Migrationen einspielen |
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

`tools/entschluesseln_test.py` zeigt die Entschlüsselung in Python und ist die Vorlage für die API:

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

- Datenschutzerklärung und Impressum, ggf. Einwilligung im Formular
- Löschfrist und Abholweg zur API (abgeholte Datensätze löschen)
- Dockerfile und Deployment
- Strenge Content-Security-Policy, passend zu den Inline-Skripten des SSR
- Die Spalte `Plz` der API ist eine Zahl: Führende Nullen (`01067`) gehen dort beim Import verloren
