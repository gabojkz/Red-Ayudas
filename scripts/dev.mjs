import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const nextDir = join(root, ".next");

// Evita "Cannot find module './331.js'" — caché webpack desincronizada
// (p. ej. mezclar `npm run build` con `npm run dev` o hot-reload tras cambios grandes).
try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("✓ Caché .next limpiada");
} catch {
  /* ignore */
}

const child = spawn(process.execPath, [nextBin, "dev"], {
  cwd: root,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
