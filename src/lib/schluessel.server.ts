import { createHash, createPublicKey } from "node:crypto";
import { readFileSync } from "node:fs";

export type PublicKeyInfo = {
	publicKey: string;
	schluesselId: string;
};

const MINDEST_BITS = 3072;

// Aus der Datei, die die API ins gemeinsame Volume schreibt, sonst aus CHECKIN_PUBLIC_KEY.
// Die Datei wird bei jedem Zugriff gelesen, ein neuer Schlüssel gilt also ohne Neustart.
function publicKeyLesen(): string | undefined {
	const datei = process.env.CHECKIN_PUBLIC_KEY_DATEI?.trim();
	if (!datei) return process.env.CHECKIN_PUBLIC_KEY?.trim();
	try {
		return readFileSync(datei, "utf8").trim();
	} catch {
		return undefined;
	}
}

// Liest und prüft den Public Key, null wenn er fehlt oder unbrauchbar ist
export function ladePublicKey(): PublicKeyInfo | null {
	const publicKey = publicKeyLesen();
	if (!publicKey) {
		console.error("Public Key fehlt (CHECKIN_PUBLIC_KEY_DATEI oder CHECKIN_PUBLIC_KEY)");
		return null;
	}
	try {
		const der = Buffer.from(publicKey, "base64");
		const schluessel = createPublicKey({
			key: der,
			format: "der",
			type: "spki",
		});
		const bits = schluessel.asymmetricKeyDetails?.modulusLength ?? 0;
		if (schluessel.asymmetricKeyType !== "rsa" || bits < MINDEST_BITS) {
			console.error(`Public Key: RSA mit ${MINDEST_BITS} Bit erwartet`);
			return null;
		}
		return {
			publicKey,
			schluesselId: createHash("sha256").update(der).digest("hex"),
		};
	} catch {
		console.error("Public Key ist kein gültiger SPKI-Schlüssel");
		return null;
	}
}
