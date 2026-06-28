import { spawnSync } from "node:child_process";

const NAME = "redayuda-postgres";

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || "") };
}

const exists = run("docker", ["ps", "-a", "--filter", `name=^/${NAME}$`, "-q"]);
if (exists.ok && exists.out.trim()) {
  const started = run("docker", ["start", NAME]);
  if (!started.ok) {
    console.error(started.out);
    process.exit(1);
  }
  console.log(`✓ Contenedor ${NAME} iniciado (ya existía)`);
} else {
  const up = run("docker", ["compose", "up", "-d"]);
  if (!up.ok) {
    console.error(up.out);
    process.exit(1);
  }
  console.log("✓ PostgreSQL creado e iniciado con docker compose");
}
