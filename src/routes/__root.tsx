import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import Berge from "#/components/Berge";
import Footer from "#/components/Footer";
import Header from "#/components/Header";
import { holeEinstellungen } from "#/server/checkin";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	loader: () => holeEinstellungen(),
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Skiservice Check-in",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{ rel: "icon", href: "/favicon.ico", sizes: "48x48" },
			{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
		],
	}),
	shellComponent: RootDocument,
	component: Seite,
});

function Seite() {
	const { datenschutzUrl, impressumUrl } = Route.useLoaderData();

	return (
		<div className="relative flex min-h-dvh flex-col">
			<Berge />
			<Header />
			<div className="relative flex-1">
				<Outlet />
			</div>
			<Footer datenschutzUrl={datenschutzUrl} impressumUrl={impressumUrl} />
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="de">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				{import.meta.env.DEV && (
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
				)}
				<Scripts />
			</body>
		</html>
	);
}
