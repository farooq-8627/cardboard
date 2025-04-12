import "dotenv/config";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db, pool } from "./db";

async function main() {
	console.log("Running migrations...");

	await migrate(db, {
		migrationsFolder: "migrations",
	});

	console.log("Migrations completed!");
	await pool.end();
}

main().catch((err) => {
	console.error("Migration failed!");
	console.error(err);
	process.exit(1);
});
