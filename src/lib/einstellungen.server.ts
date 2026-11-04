export type Einstellungen = {
	pruefDialog: boolean;
	datenschutzUrl: string | null;
	impressumUrl: string | null;
};

// Nur http(s), damit z.B. eine javascript:-URL nie als Link auf der Seite landet
function linkAusEnv(name: string): string | null {
	const wert = process.env[name]?.trim();
	if (!wert) return null;
	try {
		const url = new URL(wert);
		if (url.protocol === "http:" || url.protocol === "https:") return url.href;
	} catch {
		// Unten als ungültig gemeldet
	}
	console.error(`${name} ist keine gültige http(s)-URL und wird ignoriert`);
	return null;
}

// Wird zur Laufzeit gelesen, eine Änderung braucht also keinen neuen Build
export function ladeEinstellungen(): Einstellungen {
	const pruefDialog = process.env.CHECKIN_PRUEFDIALOG?.trim().toLowerCase();
	return {
		pruefDialog: pruefDialog !== "false" && pruefDialog !== "0",
		datenschutzUrl: linkAusEnv("CHECKIN_DATENSCHUTZ_URL"),
		impressumUrl: linkAusEnv("CHECKIN_IMPRESSUM_URL"),
	};
}
