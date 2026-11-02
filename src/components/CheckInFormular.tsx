import { type FormEvent, useEffect, useState } from "react";
import {
	type KundenDaten,
	kundenSchema,
	LEERE_KUNDENDATEN,
} from "#/lib/kundenSchema";
import {
	verschluesseln,
	verschluesselungVerfuegbar,
} from "#/lib/verschluesselung";
import { speichereCheckIn } from "#/server/checkin";

type FeldName = keyof KundenDaten;

type FeldProps = {
	name: FeldName;
	label: string;
	autoComplete: string;
	type?: string;
	inputMode?: "numeric" | "tel" | "email";
	wert: string;
	fehler?: string;
	onWechsel: (name: FeldName, wert: string) => void;
};

function Feld({
	name,
	label,
	autoComplete,
	type = "text",
	inputMode,
	wert,
	fehler,
	onWechsel,
}: FeldProps) {
	return (
		<div>
			<label
				htmlFor={name}
				className="mb-1 block text-sm font-semibold text-[var(--sea-ink)]"
			>
				{label}
			</label>
			<input
				id={name}
				name={name}
				type={type}
				inputMode={inputMode}
				autoComplete={autoComplete}
				value={wert}
				aria-invalid={fehler ? true : undefined}
				aria-describedby={fehler ? `${name}-fehler` : undefined}
				onChange={(event) => onWechsel(name, event.target.value)}
				className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2.5 text-base text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon-deep)] aria-invalid:border-red-600"
			/>
			{fehler && (
				<p id={`${name}-fehler`} className="mt-1 mb-0 text-sm text-red-600">
					{fehler}
				</p>
			)}
		</div>
	);
}

const FEHLERTEXTE = {
	limit: "Zu viele Versuche. Bitte in einer Minute erneut versuchen.",
	schluessel: "Die Seite ist nicht mehr aktuell. Bitte neu laden.",
	fehler: "Speichern fehlgeschlagen. Bitte später erneut versuchen.",
};

type CheckInFormularProps = {
	publicKey: string;
	schluesselId: string;
};

export default function CheckInFormular({
	publicKey,
	schluesselId,
}: CheckInFormularProps) {
	const [werte, setWerte] = useState(LEERE_KUNDENDATEN);
	const [fehler, setFehler] = useState<Partial<Record<FeldName, string>>>({});
	const [meldung, setMeldung] = useState<string | null>(null);
	const [sendet, setSendet] = useState(false);
	const [erledigt, setErledigt] = useState(false);
	const [honigtopf, setHonigtopf] = useState("");
	// Ohne JavaScript würde der Browser das Formular im Klartext absenden, daher erst danach freigeben
	const [bereit, setBereit] = useState(false);
	const [unsicher, setUnsicher] = useState(false);

	useEffect(() => {
		setBereit(true);
		setUnsicher(!verschluesselungVerfuegbar());
	}, []);

	function wechsel(name: FeldName, wert: string) {
		setWerte((alt) => ({ ...alt, [name]: wert }));
		setFehler((alt) => ({ ...alt, [name]: undefined }));
	}

	async function absenden(event: FormEvent) {
		event.preventDefault();
		setMeldung(null);

		const pruefung = kundenSchema.safeParse(werte);
		if (!pruefung.success) {
			const neu: Partial<Record<FeldName, string>> = {};
			for (const problem of pruefung.error.issues) {
				const feld = problem.path[0] as FeldName;
				neu[feld] ??= problem.message;
			}
			setFehler(neu);
			return;
		}
		setFehler({});

		// Keine Weitergabe im Klartext: ohne Web Crypto wird nichts gesendet
		if (!verschluesselungVerfuegbar()) {
			setUnsicher(true);
			return;
		}

		setSendet(true);
		try {
			// Bots füllen das versteckte Feld aus: Erfolg anzeigen, aber nichts senden
			if (honigtopf === "") {
				const data = await verschluesseln(
					pruefung.data,
					publicKey,
					schluesselId,
				);
				const ergebnis = await speichereCheckIn({ data });
				if (!ergebnis.ok) {
					setMeldung(FEHLERTEXTE[ergebnis.grund]);
					return;
				}
			}
			setWerte(LEERE_KUNDENDATEN);
			setErledigt(true);
		} catch {
			setMeldung(FEHLERTEXTE.fehler);
		} finally {
			setSendet(false);
		}
	}

	if (erledigt) {
		return (
			<output className="block">
				<h2 className="mt-0 mb-2 text-xl font-semibold text-[var(--sea-ink)]">
					Vielen Dank!
				</h2>
				<p className="m-0 text-[var(--sea-ink-soft)]">
					Deine Daten wurden verschlüsselt übermittelt.
				</p>
			</output>
		);
	}

	const feld = (name: FeldName) => ({
		name,
		wert: werte[name],
		fehler: fehler[name],
		onWechsel: wechsel,
	});

	return (
		<form onSubmit={absenden} noValidate className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<Feld {...feld("Vorname")} label="Vorname" autoComplete="given-name" />
				<Feld
					{...feld("Nachname")}
					label="Nachname"
					autoComplete="family-name"
				/>
			</div>
			<Feld
				{...feld("Strasse")}
				label="Straße und Hausnummer"
				autoComplete="street-address"
			/>
			<div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
				<Feld
					{...feld("Plz")}
					label="PLZ"
					autoComplete="postal-code"
					inputMode="numeric"
				/>
				<Feld {...feld("Ort")} label="Ort" autoComplete="address-level2" />
			</div>
			<Feld
				{...feld("Email")}
				label="E-Mail"
				autoComplete="email"
				type="email"
				inputMode="email"
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				<Feld
					{...feld("Handy")}
					label="Handy"
					autoComplete="tel"
					type="tel"
					inputMode="tel"
				/>
				<Feld
					{...feld("Tel")}
					label="Telefon"
					autoComplete="off"
					type="tel"
					inputMode="tel"
				/>
			</div>

			{/* Für Menschen unsichtbar, siehe absenden() */}
			<div
				aria-hidden="true"
				className="absolute -left-[9999px] h-px w-px overflow-hidden"
			>
				<label htmlFor="webseite">Webseite</label>
				<input
					id="webseite"
					type="text"
					tabIndex={-1}
					autoComplete="off"
					value={honigtopf}
					onChange={(event) => setHonigtopf(event.target.value)}
				/>
			</div>

			{unsicher && (
				<p role="alert" className="m-0 text-sm text-red-600">
					Diese Seite ist nicht über eine sichere Verbindung (HTTPS) geöffnet.
					Deine Daten können deshalb nicht verschlüsselt und nicht gesendet
					werden.
				</p>
			)}
			{meldung && (
				<p role="alert" className="m-0 text-sm text-red-600">
					{meldung}
				</p>
			)}

			<button
				type="submit"
				disabled={!bereit || unsicher || sendet}
				className="w-full cursor-pointer rounded-full border-0 bg-[var(--lagoon-deep)] px-5 py-3 text-base font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#0b1f24] sm:w-auto"
			>
				{sendet ? "Wird verschlüsselt gesendet…" : "Daten absenden"}
			</button>
			<noscript>
				<p className="m-0 text-sm text-red-600">
					Zum Verschlüsseln deiner Daten wird JavaScript benötigt.
				</p>
			</noscript>
		</form>
	);
}
