import {
  STOCK_CATS, STOCK_CAT_KEYS, LABOR_SKILLS, stockStatus, bedsStatus, timeAgoStock,
} from "./stockConstants.js";

function escapeCsv(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function csvRow(cells) {
  return cells.map(escapeCsv).join(",");
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso || "";
  }
}

/** Agrupa stock, equipo y necesidades de personal para exportar. */
export function buildSedeReportSections(sede) {
  const stock = sede?.stock || [];
  const helpers = sede?.helpers || [];
  const laborNeeds = sede?.laborNeeds || [];
  const beds = bedsStatus(sede || {});

  const materiales = STOCK_CAT_KEYS
    .map((cat) => ({
      cat,
      label: STOCK_CATS[cat]?.label || cat,
      items: stock
        .filter((i) => i.cat === cat)
        .map((i) => ({
          nombre: i.nombre,
          cantidad: i.cantidad,
          unidad: i.unidad,
          estado: stockStatus(i).key,
          actualizado: timeAgoStock(i.updated),
        })),
    }))
    .filter((g) => g.items.length);

  return {
    header: {
      nombre: sede?.nombre || "Centro",
      slug: sede?.slug || "centro",
      zona: sede?.zona || "",
      contacto: sede?.contacto || "",
      camasTotal: sede?.camasTotal ?? 0,
      camasOcupadas: sede?.camasOcupadas ?? 0,
      camasLibres: beds.libres ?? Math.max(0, (sede?.camasTotal ?? 0) - (sede?.camasOcupadas ?? 0)),
      camasEstado: beds.key,
      generado: new Date().toISOString(),
    },
    materiales,
    equipo: helpers.map((h) => ({
      nombre: h.nombre,
      rol: h.rolLabel || h.rol,
      cedula: h.cedula || "",
    })),
    personalNecesita: laborNeeds.map((n) => ({
      habilidad: n.skillLabel || LABOR_SKILLS[n.skill]?.label || n.skill,
      cantidad: n.cantidad,
      notas: n.notas || "",
    })),
  };
}

export function sedeReportToCsv(sede) {
  const report = buildSedeReportSections(sede);
  const lines = [];
  const { header } = report;

  lines.push(csvRow(["Centro", header.nombre]));
  lines.push(csvRow(["Dirección", header.zona]));
  if (header.contacto) lines.push(csvRow(["Contacto", header.contacto]));
  lines.push(csvRow(["Camas totales", header.camasTotal]));
  lines.push(csvRow(["Camas libres", header.camasLibres]));
  lines.push(csvRow(["Estado refugio", header.camasEstado]));
  lines.push(csvRow(["Generado", formatDate(header.generado)]));
  lines.push("");

  lines.push("MATERIALES");
  lines.push(csvRow(["Categoría", "Material", "Cantidad", "Unidad", "Estado", "Actualizado"]));
  for (const group of report.materiales) {
    for (const item of group.items) {
      lines.push(csvRow([
        group.label,
        item.nombre,
        item.cantidad,
        item.unidad,
        item.estado,
        item.actualizado,
      ]));
    }
  }
  if (!report.materiales.length) {
    lines.push(csvRow(["—", "Sin materiales registrados", "", "", "", ""]));
  }
  lines.push("");

  lines.push("PERSONAL EN EL CENTRO");
  lines.push(csvRow(["Nombre", "Rol", "Cédula"]));
  for (const h of report.equipo) {
    lines.push(csvRow([h.nombre, h.rol, h.cedula]));
  }
  if (!report.equipo.length) {
    lines.push(csvRow(["Sin trabajadores registrados", "", ""]));
  }
  lines.push("");

  lines.push("PERSONAL QUE NECESITAMOS");
  lines.push(csvRow(["Habilidad", "Cantidad", "Notas"]));
  for (const n of report.personalNecesita) {
    lines.push(csvRow([n.habilidad, n.cantidad, n.notas]));
  }
  if (!report.personalNecesita.length) {
    lines.push(csvRow(["Sin necesidades publicadas", "", ""]));
  }

  return lines.join("\r\n");
}

function buildPrintHtml(sede) {
  const report = buildSedeReportSections(sede);
  const { header } = report;

  const materialesHtml = report.materiales.length
    ? report.materiales.map((g) => `
        <h3>${escapeHtml(g.label)}</h3>
        <table>
          <thead><tr><th>Material</th><th>Cantidad</th><th>Unidad</th><th>Estado</th><th>Actualizado</th></tr></thead>
          <tbody>
            ${g.items.map((i) => `
              <tr>
                <td>${escapeHtml(i.nombre)}</td>
                <td>${escapeHtml(i.cantidad)}</td>
                <td>${escapeHtml(i.unidad)}</td>
                <td>${escapeHtml(i.estado)}</td>
                <td>${escapeHtml(i.actualizado)}</td>
              </tr>`).join("")}
          </tbody>
        </table>`).join("")
    : "<p class=\"empty\">Sin materiales registrados.</p>";

  const equipoHtml = report.equipo.length
    ? `<table>
        <thead><tr><th>Nombre</th><th>Rol</th><th>Cédula</th></tr></thead>
        <tbody>
          ${report.equipo.map((h) => `
            <tr><td>${escapeHtml(h.nombre)}</td><td>${escapeHtml(h.rol)}</td><td>${escapeHtml(h.cedula)}</td></tr>`).join("")}
        </tbody>
      </table>`
    : "<p class=\"empty\">Sin trabajadores registrados.</p>";

  const necesitaHtml = report.personalNecesita.length
    ? `<table>
        <thead><tr><th>Habilidad</th><th>Cantidad</th><th>Notas</th></tr></thead>
        <tbody>
          ${report.personalNecesita.map((n) => `
            <tr><td>${escapeHtml(n.habilidad)}</td><td>${escapeHtml(n.cantidad)}</td><td>${escapeHtml(n.notas || "—")}</td></tr>`).join("")}
        </tbody>
      </table>`
    : "<p class=\"empty\">Sin necesidades de personal publicadas.</p>";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(header.nombre)} — Recursos</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #0F1B2D; margin: 24px; line-height: 1.4; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .meta { color: #64748B; font-size: 13px; margin-bottom: 20px; }
    h2 { font-size: 16px; margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #0E5A6B; color: #0E5A6B; }
    h3 { font-size: 13px; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px; }
    th, td { border: 1px solid #D9E2EC; padding: 8px 10px; text-align: left; }
    th { background: #EAEEF3; font-weight: 600; }
    tr:nth-child(even) td { background: #FAFBFC; }
    .empty { color: #64748B; font-style: italic; }
    @media print {
      body { margin: 12mm; }
      h2 { page-break-after: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(header.nombre)}</h1>
  <p class="meta">
    ${escapeHtml(header.zona)}${header.contacto ? ` · ${escapeHtml(header.contacto)}` : ""}<br />
    Camas: ${header.camasLibres} libres / ${header.camasTotal} total (${escapeHtml(header.camasEstado)})<br />
    Generado: ${escapeHtml(formatDate(header.generado))}
  </p>

  <h2>Materiales</h2>
  ${materialesHtml}

  <h2>Personal en el centro</h2>
  ${equipoHtml}

  <h2>Personal que necesitamos</h2>
  ${necesitaHtml}
</body>
</html>`;
}

export function downloadSedeReportCsv(sede) {
  if (typeof document === "undefined") return;
  const report = buildSedeReportSections(sede);
  const csv = sedeReportToCsv(sede);
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.header.slug}-recursos-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printSedeReport(sede) {
  if (typeof window === "undefined") return;
  const html = buildPrintHtml(sede);
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => win.print();
}
