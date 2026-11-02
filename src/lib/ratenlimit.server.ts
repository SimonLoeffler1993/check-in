const FENSTER_MS = 60_000;
const MAX_ANFRAGEN = 10;

// Liegt im Arbeitsspeicher, gilt also pro Instanz und bremst nur einfachen Missbrauch
const anfragen = new Map<string, { anzahl: number; beginn: number }>();

export function limitUeberschritten(ip: string): boolean {
	const jetzt = Date.now();
	for (const [schluessel, eintrag] of anfragen) {
		if (jetzt - eintrag.beginn >= FENSTER_MS) anfragen.delete(schluessel);
	}
	const eintrag = anfragen.get(ip);
	if (!eintrag) {
		anfragen.set(ip, { anzahl: 1, beginn: jetzt });
		return false;
	}
	eintrag.anzahl += 1;
	return eintrag.anzahl > MAX_ANFRAGEN;
}
