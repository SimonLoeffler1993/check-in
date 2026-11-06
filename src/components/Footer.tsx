type FooterProps = {
	datenschutzUrl: string | null;
	impressumUrl: string | null;
};

function FooterLink({ href, text }: { href: string; text: string }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="text-gedaempft underline underline-offset-4 hover:text-tinte"
		>
			{text}
		</a>
	);
}

// Beide Links sind optional und kommen aus der Umgebung (CHECKIN_DATENSCHUTZ_URL, CHECKIN_IMPRESSUM_URL)
export default function Footer({ datenschutzUrl, impressumUrl }: FooterProps) {
	return (
		<footer className="relative px-4 py-8 text-sm text-gedaempft">
			<div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
				<span>Skiservice Check-in</span>
				{(datenschutzUrl || impressumUrl) && (
					<nav aria-label="Rechtliches" className="flex flex-wrap gap-x-5">
						{datenschutzUrl && (
							<FooterLink href={datenschutzUrl} text="Datenschutz" />
						)}
						{impressumUrl && (
							<FooterLink href={impressumUrl} text="Impressum" />
						)}
					</nav>
				)}
			</div>
		</footer>
	);
}
