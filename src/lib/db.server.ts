import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "#/generated/prisma/client";

let client: PrismaClient | undefined;

export function db(): PrismaClient {
	if (!client) {
		const url = process.env.DATABASE_URL;
		if (!url) throw new Error("DATABASE_URL fehlt");
		// Prisma CLI erwartet mysql://, der Adapter mariadb://
		const adapter = new PrismaMariaDb(url.replace(/^mysql:/, "mariadb:"));
		client = new PrismaClient({ adapter });
	}
	return client;
}
