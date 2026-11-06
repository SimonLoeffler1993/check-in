type BriefAnimationProps = {
	phase: "senden" | "fliegt";
};

// Während des Sendens wird der Brief verschlossen und schwebt.
// Er fliegt erst weg, wenn der Server bestätigt hat, die Animation täuscht also keinen Erfolg vor.
export default function BriefAnimation({ phase }: BriefAnimationProps) {
	return (
		<div className="brief-buehne" data-phase={phase}>
			<div className="brief-flug">
				<div className="brief-schweben">
					<svg
						viewBox="0 0 200 170"
						className="h-44 w-52 overflow-visible"
						aria-hidden="true"
					>
						<title>Brief</title>
						<g className="brief-schweif">
							<path d="M4 120h30M-8 98h34M12 142h20" />
						</g>
						<rect
							className="fill-akzent-tief"
							x="30"
							y="60"
							width="140"
							height="96"
							rx="10"
						/>
						<path
							className="brief-lasche-offen fill-akzent-tief"
							d="M30 66 100 112 170 66Z"
						/>
						<g className="brief-blatt">
							<rect
								x="44"
								y="64"
								width="112"
								height="90"
								rx="5"
								className="fill-white"
							/>
							<path
								d="M58 80h84M58 96h84M58 112h52"
								className="stroke-linie"
								strokeWidth="6"
								strokeLinecap="round"
							/>
						</g>
						<path
							className="fill-akzent"
							d="M30 72v74a10 10 0 0 0 10 10h120a10 10 0 0 0 10-10V72l-70 48Z"
						/>
						<path
							className="brief-lasche"
							d="M30 72v-2a10 10 0 0 1 10-10h120a10 10 0 0 1 10 10v2l-70 48Z"
						/>
						<g className="brief-schloss">
							<circle cx="100" cy="106" r="19" className="fill-flaeche" />
							<path
								d="M93 104v-5a7 7 0 0 1 14 0v5"
								fill="none"
								className="stroke-akzent"
								strokeWidth="3.5"
							/>
							<rect
								x="89"
								y="103"
								width="22"
								height="14"
								rx="3"
								className="fill-akzent"
							/>
						</g>
					</svg>
				</div>
			</div>
			<output className="brief-text block text-lg font-bold text-tinte">
				{phase === "senden" ? "Wird verschlüsselt gesendet …" : "Gesendet!"}
			</output>
		</div>
	);
}
