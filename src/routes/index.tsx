import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import CheckInFormular from "#/components/CheckInFormular";
import { holePublicKey } from "#/server/checkin";

export const Route = createFileRoute("/")({
	loader: () => holePublicKey(),
	component: CheckIn,
});

function CheckIn() {
	const schluessel = Route.useLoaderData();
	const { pruefDialog, datenschutzUrl } = useLoaderData({ from: "__root__" });

	return (
		<main className="px-4 pt-20 sm:pt-32">
			<section className="karte mx-auto max-w-2xl rounded-3xl bg-flaeche p-6 sm:p-10">
				{schluessel ? (
					<CheckInFormular
						publicKey={schluessel.publicKey}
						schluesselId={schluessel.schluesselId}
						pruefDialog={pruefDialog}
						datenschutzUrl={datenschutzUrl}
					/>
				) : (
					<>
						<h1 className="mt-0 mb-2 text-3xl font-extrabold tracking-tight">
							Check-in
						</h1>
						<p role="alert" className="m-0 text-fehler">
							Der Check-in ist zurzeit nicht verfügbar. Bitte versuche es später
							erneut.
						</p>
					</>
				)}
			</section>
		</main>
	);
}
