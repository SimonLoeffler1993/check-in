export default function Header() {
	return (
		<header className="relative px-4 pt-5 sm:pt-7">
			<div className="mx-auto flex w-full max-w-2xl items-center gap-2.5 text-base font-bold tracking-tight text-auf-himmel">
				<svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
					<title>Logo</title>
					<path d="M2 20 9.5 6l4 7 2.5-4 6 11Z" fill="currentColor" />
				</svg>
				Skiservice Check-in
			</div>
		</header>
	);
}
