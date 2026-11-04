import { useEffect, useRef } from "react";
import type { KundenDaten } from "#/lib/kundenSchema";

type PruefDialogProps = {
	kunde: KundenDaten;
	onZurueck: () => void;
	onBestaetigen: () => void;
};

// Zeigt die Eingaben noch einmal, gesendet wird erst nach aktiver Bestätigung.
// Natives <dialog>: Fokus bleibt im Dialog, Escape führt zurück zum Formular.
export default function PruefDialog({
	kunde,
	onZurueck,
	onBestaetigen,
}: PruefDialogProps) {
	const dialog = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const element = dialog.current;
		element?.showModal();
		return () => element?.close();
	}, []);

	const zeilen = [
		["Name", `${kunde.Vorname} ${kunde.Nachname}`.trim()],
		["Straße", kunde.Strasse],
		["Ort", `${kunde.Plz} ${kunde.Ort}`.trim()],
		["E-Mail", kunde.Email],
		["Handy", kunde.Handy],
		["Telefon", kunde.Tel],
	].filter(([, wert]) => wert !== "");

	return (
		<dialog
			ref={dialog}
			aria-labelledby="pruef-titel"
			onCancel={(event) => {
				event.preventDefault();
				onZurueck();
			}}
			className="pruef-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-0 bg-flaeche p-6 text-tinte sm:p-8"
		>
			<h2 id="pruef-titel" className="mt-0 mb-1 text-2xl font-extrabold">
				Stimmt alles?
			</h2>
			<p className="mt-0 mb-5 text-gedaempft">
				Bitte prüfe deine Angaben, bevor du sie absendest.
			</p>
			<dl className="m-0 divide-y divide-linie border-y border-linie">
				{zeilen.map(([bezeichnung, wert]) => (
					<div
						key={bezeichnung}
						className="grid grid-cols-[5.5rem_1fr] gap-3 py-2.5"
					>
						<dt className="text-sm text-gedaempft">{bezeichnung}</dt>
						<dd className="m-0 font-semibold">{wert}</dd>
					</div>
				))}
			</dl>
			<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<button type="button" onClick={onZurueck} className="knopf-zweit">
					Korrigieren
				</button>
				<button type="button" onClick={onBestaetigen} className="knopf">
					Stimmt, absenden
				</button>
			</div>
		</dialog>
	);
}
