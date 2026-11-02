import { z } from "zod";

// Felder und Regeln wie am Kundenterminal (ski-kunden-dialog), Längen wie in der API (schemas/kunde.py)
export const kundenSchema = z
	.object({
		Vorname: z.string().trim().max(100, "Höchstens 100 Zeichen."),
		Nachname: z.string().trim().max(100, "Höchstens 100 Zeichen."),
		Strasse: z.string().trim().max(250, "Höchstens 250 Zeichen."),
		Plz: z
			.string()
			.trim()
			.regex(/^(\d{4,5})?$/, "Bitte eine gültige Postleitzahl eingeben."),
		Ort: z.string().trim().max(100, "Höchstens 100 Zeichen."),
		Tel: z.string().trim().max(50, "Höchstens 50 Zeichen."),
		Handy: z.string().trim().max(50, "Höchstens 50 Zeichen."),
		Email: z
			.string()
			.trim()
			.max(50, "Höchstens 50 Zeichen.")
			.email("Bitte eine gültige E-Mail-Adresse eingeben.")
			.or(z.literal("")),
	})
	.refine((daten) => daten.Vorname !== "" || daten.Nachname !== "", {
		message: "Bitte mindestens Vorname oder Nachname angeben.",
		path: ["Nachname"],
	})
	.refine(
		(daten) => daten.Tel !== "" || daten.Handy !== "" || daten.Email !== "",
		{
			message: "Bitte mindestens E-Mail, Telefon oder Handy angeben.",
			path: ["Email"],
		},
	);

export type KundenDaten = z.infer<typeof kundenSchema>;

export const LEERE_KUNDENDATEN: KundenDaten = {
	Vorname: "",
	Nachname: "",
	Strasse: "",
	Plz: "",
	Ort: "",
	Tel: "",
	Handy: "",
	Email: "",
};
