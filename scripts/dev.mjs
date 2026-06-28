import { rmSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const nextDir = join(root, ".next");
const port = Number(process.env.PORT) || 3000;

/** Cierra next dev zombie que sirve chunks viejos (611.js / moduleId is not a function). */
function killZombieNextDev(p) {
  freePort(p);
  try {
    const out = execSync("pgrep -fl \"next dev\" 2>/dev/null || true", { encoding: "utf8" }).trim();
    if (!out) return;
    for (const line of out.split("\n")) {
      const pid = line.trim().split(/\s+/)[0];
      if (!pid || pid === String(process.pid)) continue;
      try {
        process.kill(Number(pid), "SIGTERM");
        console.log(`✓ next dev ${pid} cerrado`);
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* ignore */
  }
}

function freePort(p) {
  try {
    const out = execSync(`lsof -ti :${p}`, { encoding: "utf8" }).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/)) {
      if (!pid) continue;
      try {
        process.kill(Number(pid), "SIGTERM");
        console.log(`✓ Proceso ${pid} liberó el puerto ${p}`);
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* puerto libre */
  }
}

// Evita caché webpack desincronizada (mezclar build + dev, HMR grande, dos `next dev`).
killZombieNextDev(port);
try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("✓ Caché .next limpiada");
} catch {
  /* ignore */
}

const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    // Menos HMR corrupto tras cambios grandes en client components.
    NEXT_DISABLE_WEBPACK_CACHE: "1",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
