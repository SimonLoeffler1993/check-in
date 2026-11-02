import type { KundenDaten } from "./kundenSchema";
import { UMSCHLAG_VERSION, type Umschlag, zusatzdaten } from "./umschlag";

function zuBase64(bytes: Uint8Array): string {
	let text = "";
	for (const byte of bytes) text += String.fromCharCode(byte);
	return btoa(text);
}

function ausBase64(text: string): Uint8Array<ArrayBuffer> {
	return Uint8Array.from(atob(text), (zeichen) => zeichen.charCodeAt(0));
}

// Web Crypto gibt es nur über HTTPS oder localhost
export function verschluesselungVerfuegbar(): boolean {
	return typeof crypto !== "undefined" && crypto.subtle !== undefined;
}

// Hybrid: die Daten mit einem neuen AES-256-GCM-Schlüssel, diesen mit RSA-OAEP (SHA-256) und dem Public Key
export async function verschluesseln(
	kunde: KundenDaten,
	publicKey: string,
	schluesselId: string,
): Promise<Umschlag> {
	const rsaSchluessel = await crypto.subtle.importKey(
		"spki",
		ausBase64(publicKey),
		{ name: "RSA-OAEP", hash: "SHA-256" },
		false,
		["encrypt"],
	);
	const aesSchluessel = await crypto.subtle.generateKey(
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt"],
	);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const kodierer = new TextEncoder();

	const klartext = JSON.stringify({
		schemaVersion: UMSCHLAG_VERSION,
		erfasstAm: new Date().toISOString(),
		kunde,
	});
	const daten = await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv,
			additionalData: kodierer.encode(zusatzdaten(schluesselId)),
		},
		aesSchluessel,
		kodierer.encode(klartext),
	);
	const verschluesselterSchluessel = await crypto.subtle.encrypt(
		{ name: "RSA-OAEP" },
		rsaSchluessel,
		await crypto.subtle.exportKey("raw", aesSchluessel),
	);

	return {
		version: UMSCHLAG_VERSION,
		schluesselId,
		verschluesselterSchluessel: zuBase64(
			new Uint8Array(verschluesselterSchluessel),
		),
		iv: zuBase64(iv),
		daten: zuBase64(new Uint8Array(daten)),
	};
}
