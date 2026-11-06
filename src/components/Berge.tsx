// Flache Bergsilhouette als Hintergrund oben auf der Seite
export default function Berge() {
	return (
		<div
			aria-hidden="true"
			className="berge pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden sm:h-96"
		>
			<svg
				viewBox="0 0 1440 320"
				preserveAspectRatio="xMidYMax slice"
				className="absolute inset-x-0 bottom-0 h-full w-full"
			>
				<title>Berge</title>
				<path
					className="fill-berg-hinten"
					d="M0 240 L170 130 L290 200 L470 60 L640 190 L790 110 L960 215 L1150 70 L1300 180 L1440 120 V320 H0 Z"
				/>
				<path
					className="fill-berg-vorne"
					d="M0 280 L210 205 L380 265 L590 170 L780 275 L1010 180 L1210 265 L1440 200 V320 H0 Z"
				/>
				<path
					className="fill-grund"
					d="M0 305 C240 275 480 320 720 298 C960 276 1200 318 1440 290 V320 H0 Z"
				/>
			</svg>
		</div>
	);
}
