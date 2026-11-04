import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { type UseFormRegisterReturn, useForm } from "react-hook-form";
import BriefAnimation from "#/components/BriefAnimation";
import PruefDialog from "#/components/PruefDialog";
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
	registrierung: UseFormRegisterReturn<FeldName>;
	label: string;
	autoComplete: string;
	type?: string;
	inputMode?: "numeric" | "tel" | "email";
	fehler?: string;
};

function Feld({
	registrierung,
	label,
	autoComplete,
	type = "text",
	inputMode,
	fehler,
}: FeldProps) {
	const { name } = registrierung;
	return (
		<div>
			<label htmlFor={name} className="mb-1.5 block text-sm font-semibold">
				{label}
			</label>
			<input
				{...registrierung}
				id={name}
				type={type}
				inputMode={inputMode}
				autoComplete={autoComplete}
				aria-invalid={fehler ? true : undefined}
				aria-describedby={fehler ? `${name}-fehler` : undefined}
				className="eingabe"
			/>
			{fehler && (
				<p id={`${name}-fehler`} className="mt-1.5 mb-0 text-sm text-fehler">
					{fehler}
				</p>
			)}
		</div>
	);
}

function Gruppe({
	titel,
	hinweis,
	children,
}: {
	titel: string;
	hinweis?: string;
	children: React.ReactNode;
}) {
	return (
		<fieldset className="mx-0 min-w-0 space-y-4 border-0 p-0">
			<legend className="mb-3 w-full p-0">
				<span className="text-xs font-bold tracking-widest text-akzent uppercase">
					{titel}
				</span>
				{hinweis && (
					<span className="ml-2 text-sm text-gedaempft">{hinweis}</span>
				)}
			</legend>
			{children}
		</fieldset>
	);
}

const FEHLERTEXTE = {
	limit: "Zu viele Versuche. Bitte in einer Minute erneut versuchen.",
	schluessel: "Die Seite ist nicht mehr aktuell. Bitte neu laden.",
	fehler: "Speichern fehlgeschlagen. Bitte später erneut versuchen.",
};

// Mindestdauer, damit der Brief auch bei schneller Antwort sichtbar verschlossen wird
const SENDEN_MIN_MS = 1200;
const FLUG_MS = 900;

function warte(ms: number) {
	return new Promise((fertig) => setTimeout(fertig, ms));
}

function wenigBewegung() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Phase = "eingabe" | "pruefen" | "senden" | "fliegt" | "fertig";

type CheckInFormularProps = {
	publicKey: string;
	schluesselId: string;
	pruefDialog: boolean;
	datenschutzUrl: string | null;
};

export default function CheckInFormular({
	publicKey,
	schluesselId,
	pruefDialog,
	datenschutzUrl,
}: CheckInFormularProps) {
	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors },
	} = useForm<KundenDaten>({
		resolver: zodResolver(kundenSchema),
		defaultValues: LEERE_KUNDENDATEN,
	});
	const [phase, setPhase] = useState<Phase>("eingabe");
	const [zuPruefen, setZuPruefen] = useState<KundenDaten | null>(null);
	// Schützt vor doppeltem Absenden, z.B. Doppelklick im Prüf-Dialog
	const sendetGerade = useRef(false);
	const [honigtopf, setHonigtopf] = useState("");
	// Ohne JavaScript würde der Browser das Formular im Klartext absenden, daher erst danach freigeben
	const [bereit, setBereit] = useState(false);
	const [unsicher, setUnsicher] = useState(false);

	useEffect(() => {
		setBereit(true);
		setUnsicher(!verschluesselungVerfuegbar());
	}, []);

	function geprueft(kunde: KundenDaten) {
		// Keine Weitergabe im Klartext: ohne Web Crypto wird nichts gesendet
		if (!verschluesselungVerfuegbar()) {
			setUnsicher(true);
			return;
		}
		if (pruefDialog) {
			setZuPruefen(kunde);
			setPhase("pruefen");
		} else {
			absenden(kunde);
		}
	}

	// Gibt eine Fehlermeldung zurück oder null bei Erfolg
	async function uebermitteln(kunde: KundenDaten): Promise<string | null> {
		// Bots füllen das versteckte Feld aus: Erfolg anzeigen, aber nichts senden
		if (honigtopf !== "") return null;
		try {
			const data = await verschluesseln(kunde, publicKey, schluesselId);
			const ergebnis = await speichereCheckIn({ data });
			return ergebnis.ok ? null : FEHLERTEXTE[ergebnis.grund];
		} catch {
			return FEHLERTEXTE.fehler;
		}
	}

	async function absenden(kunde: KundenDaten) {
		if (sendetGerade.current) return;
		sendetGerade.current = true;
		setPhase("senden");
		const bewegung = !wenigBewegung();
		const [fehlertext] = await Promise.all([
			uebermitteln(kunde),
			warte(bewegung ? SENDEN_MIN_MS : 0),
		]);
		sendetGerade.current = false;
		setZuPruefen(null);

		if (fehlertext) {
			setError("root", { message: fehlertext });
			setPhase("eingabe");
			return;
		}
		// Erst jetzt hat der Server bestätigt: der Brief fliegt
		setPhase("fliegt");
		await warte(bewegung ? FLUG_MS : 0);
		reset();
		setPhase("fertig");
	}

	if (phase === "fertig") {
		return (
			<output className="block py-6 text-center">
				<svg
					viewBox="0 0 64 64"
					className="haken mx-auto mb-4 h-16 w-16"
					aria-hidden="true"
				>
					<title>Erledigt</title>
					<circle cx="32" cy="32" r="29" />
					<path d="M20 33l9 9 16-19" />
				</svg>
				<h1 className="mt-0 mb-2 text-3xl font-extrabold tracking-tight">
					Vielen Dank!
				</h1>
				<p className="m-0 text-gedaempft">
					Deine Daten sind verschlüsselt bei uns angekommen.
				</p>
			</output>
		);
	}

	const inArbeit = phase === "senden" || phase === "fliegt";

	const feld = (name: FeldName) => ({
		registrierung: register(name),
		fehler: errors[name]?.message,
	});

	return (
		<>
			<h1 className="mt-0 mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
				Check-in
			</h1>
			<p className="mt-0 mb-8 text-gedaempft">
				Trage bitte deine Daten ein, damit wir dich schneller bedienen können.
			</p>

			<form
				onSubmit={handleSubmit(geprueft)}
				noValidate
				inert={inArbeit}
				className="flex flex-col gap-8"
			>
				<Gruppe titel="Name" hinweis="Vor- oder Nachname genügt">
					<div className="grid gap-4 sm:grid-cols-2">
						<Feld
							{...feld("Vorname")}
							label="Vorname"
							autoComplete="given-name"
						/>
						<Feld
							{...feld("Nachname")}
							label="Nachname"
							autoComplete="family-name"
						/>
					</div>
				</Gruppe>

				<Gruppe titel="Adresse">
					<Feld
						{...feld("Strasse")}
						label="Straße und Hausnummer"
						autoComplete="street-address"
					/>
					<div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
						<Feld
							{...feld("Plz")}
							label="PLZ"
							autoComplete="postal-code"
							inputMode="numeric"
						/>
						<Feld {...feld("Ort")} label="Ort" autoComplete="address-level2" />
					</div>
				</Gruppe>

				<Gruppe titel="Kontakt" hinweis="Eine Angabe genügt">
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
				</Gruppe>

				{/* Für Menschen unsichtbar, siehe uebermitteln() */}
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
					<p role="alert" className="m-0 text-sm text-fehler">
						Diese Seite ist nicht über eine sichere Verbindung (HTTPS) geöffnet.
						Deine Daten können deshalb nicht verschlüsselt und nicht gesendet
						werden.
					</p>
				)}
				{errors.root && (
					<p role="alert" className="m-0 text-sm text-fehler">
						{errors.root.message}
					</p>
				)}

				<div className="space-y-4">
					<button
						type="submit"
						disabled={!bereit || unsicher || phase !== "eingabe"}
						className="knopf w-full"
					>
						{pruefDialog ? "Weiter" : "Daten absenden"}
					</button>
					<p className="m-0 flex items-start gap-2 text-sm text-gedaempft">
						<svg
							viewBox="0 0 24 24"
							className="mt-0.5 h-4 w-4 shrink-0 fill-current"
							aria-hidden="true"
						>
							<title>Schloss</title>
							<path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3Z" />
						</svg>
						<span>
							Deine Daten werden schon in deinem Browser verschlüsselt und sind
							erst bei uns im Geschäft wieder lesbar.
							{datenschutzUrl && (
								<>
									{" "}
									<a
										href={datenschutzUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-gedaempft underline underline-offset-2 hover:text-tinte"
									>
										Zur Datenschutzerklärung
									</a>
								</>
							)}
						</span>
					</p>
				</div>
				<noscript>
					<p className="m-0 text-sm text-fehler">
						Zum Verschlüsseln deiner Daten wird JavaScript benötigt.
					</p>
				</noscript>
			</form>

			{phase === "pruefen" && zuPruefen && (
				<PruefDialog
					kunde={zuPruefen}
					onZurueck={() => {
						setZuPruefen(null);
						setPhase("eingabe");
					}}
					onBestaetigen={() => absenden(zuPruefen)}
				/>
			)}
			{inArbeit && <BriefAnimation phase={phase} />}
		</>
	);
}
