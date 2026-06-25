import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("→ Levantando Postgres (Docker)…");
run("docker", ["compose", "up", "-d"]);

console.log("→ Esperando base de datos…");
run("node", ["scripts/wait-for-db.js"]);

console.log("→ Migrando esquema…");
run("node", ["scripts/migrate.js"]);

console.log("→ Insertando datos de prueba…");
run("node", ["scripts/seed.js"]);

console.log("\n✓ Dev listo. Corre: npm run dev\n");
