import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, setResponseStatus } from "@tanstack/react-start/server";
import { db } from "#/lib/db.server";
import { ladeEinstellungen } from "#/lib/einstellungen.server";
import { limitUeberschritten } from "#/lib/ratenlimit.server";
import { ladePublicKey } from "#/lib/schluessel.server";
import { umschlagSchema } from "#/lib/umschlag";

export const holePublicKey = createServerFn({ method: "GET" }).handler(() =>
	ladePublicKey(),
);

export const holeEinstellungen = createServerFn({ method: "GET" }).handler(() =>
	ladeEinstellungen(),
);

type SpeichernErgebnis =
	| { ok: true }
	| { ok: false; grund: "limit" | "schluessel" | "fehler" };

// Bekommt nur den verschlüsselten Umschlag. Inhalte prüft erst die API nach dem Entschlüsseln.
export const speichereCheckIn = createServerFn({ method: "POST" })
	.validator(umschlagSchema)
	.handler(async ({ data }): Promise<SpeichernErgebnis> => {
		const ip =
			getRequestIP({ xForwardedFor: process.env.TRUST_PROXY === "1" }) ??
			"unbekannt";
		if (limitUeberschritten(ip)) {
			setResponseStatus(429);
			return { ok: false, grund: "limit" };
		}

		// Veralteter Schlüssel, z.B. Seite vor einem Schlüsselwechsel geladen
		if (data.schluesselId !== ladePublicKey()?.schluesselId) {
			setResponseStatus(409);
			return { ok: false, grund: "schluessel" };
		}

		try {
			await db().checkIn.create({ data });
			return { ok: true };
		} catch (fehler) {
			// Nur der Fehlername: Datenbankfehler können den ganzen Datensatz enthalten
			console.error(
				"Check-in konnte nicht gespeichert werden:",
				fehler instanceof Error ? fehler.name : "unbekannt",
			);
			setResponseStatus(500);
			return { ok: false, grund: "fehler" };
		}
	});
