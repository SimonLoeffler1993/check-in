import { createFileRoute } from "@tanstack/react-router";
import CheckInFormular from "#/components/CheckInFormular";
import { holePublicKey } from "#/server/checkin";

export const Route = createFileRoute("/")({
	loader: () => holePublicKey(),
	component: CheckIn,
});

function CheckIn() {
	const schluessel = Route.useLoaderData();

	return (
		<main className="page-wrap max-w-2xl px-4 pb-8 pt-10">
			<section className="island-shell rounded-2xl p-6 sm:p-8">
				<h1 className="display-title mt-0 mb-2 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
					Check-in
				</h1>
				<p className="mt-0 mb-6 text-[var(--sea-ink-soft)]">
					Bitte trage deine Daten ein. Sie werden schon in deinem Browser
					verschlüsselt und erst bei uns im Geschäft wieder lesbar.
				</p>
				{schluessel ? (
					<CheckInFormular
						publicKey={schluessel.publicKey}
						schluesselId={schluessel.schluesselId}
					/>
				) : (
					<p role="alert" className="m-0 text-red-600">
						Der Check-in ist zurzeit nicht verfügbar. Bitte versuche es später
						erneut.
					</p>
				)}
			</section>
		</main>
	);
}
