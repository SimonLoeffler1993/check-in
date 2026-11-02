import { createHash, createPublicKey } from "node:crypto";

export type PublicKeyInfo = {
	publicKey: string;
	schluesselId: string;
};

const MINDEST_BITS = 3072;

// Liest und prüft den Public Key aus der Umgebung, null wenn er fehlt oder unbrauchbar ist
export function ladePublicKey(): PublicKeyInfo | null {
	const publicKey = process.env.CHECKIN_PUBLIC_KEY?.trim();
	if (!publicKey) {
		console.error("CHECKIN_PUBLIC_KEY fehlt");
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
			console.error(`CHECKIN_PUBLIC_KEY: RSA mit ${MINDEST_BITS} Bit erwartet`);
			return null;
		}
		return {
			publicKey,
			schluesselId: createHash("sha256").update(der).digest("hex"),
		};
	} catch {
		console.error("CHECKIN_PUBLIC_KEY ist kein gültiger SPKI-Schlüssel");
		return null;
	}
}
