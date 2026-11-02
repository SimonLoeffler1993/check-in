import { z } from "zod";

// Format des verschlüsselten Datensatzes, das einzige, was den Browser verlässt
export const UMSCHLAG_VERSION = 1;

const base64 = z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/);

export const umschlagSchema = z.object({
	version: z.literal(UMSCHLAG_VERSION),
	schluesselId: z.string().regex(/^[0-9a-f]{64}$/),
	// RSA-4096 ergibt 512 Byte, in Base64 684 Zeichen
	verschluesselterSchluessel: base64.min(512).max(1024),
	// 12 Byte IV
	iv: base64.length(16),
	// Ein Kundendatensatz bleibt weit darunter
	daten: base64.max(16_384),
});

export type Umschlag = z.infer<typeof umschlagSchema>;

// Zusätzlich authentifizierte Daten: binden den Inhalt an Format und Schlüssel
export function zusatzdaten(schluesselId: string): string {
	return `checkin:v${UMSCHLAG_VERSION}:${schluesselId}`;
}
