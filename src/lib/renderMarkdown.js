import { createElement as h, Fragment } from "react";

/** Safe subset renderer for generated API docs (no raw HTML). */
export function renderMarkdown(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const nodes = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      nodes.push(
        h("pre", { key: key++ }, h("code", null, codeLines.join("\n")))
      );
      i += 1;
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i += 1;
      }
      nodes.push(renderTable(tableLines, key++));
      continue;
    }

    if (line.startsWith("### ")) {
      nodes.push(h("h3", { key: key++ }, line.slice(4)));
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(h("h2", { key: key++ }, line.slice(3)));
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(h("h1", { key: key++ }, line.slice(2)));
      i += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(h("li", { key: key++ }, renderInline(lines[i].slice(2))));
        i += 1;
      }
      nodes.push(h("ul", { key: key++ }, items));
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    nodes.push(h("p", { key: key++ }, renderInline(line)));
    i += 1;
  }

  return h(Fragment, null, nodes);
}

function renderTable(tableLines, key) {
  const rows = tableLines
    .filter((line) => !/^\|[\s-:|]+\|$/.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim())
    );

  if (!rows.length) return null;

  const [head, ...body] = rows;
  return h(
    "table",
    { key },
    h(
      "thead",
      null,
      h("tr", null, head.map((cell, idx) => h("th", { key: idx }, renderInline(cell))))
    ),
    h(
      "tbody",
      null,
      body.map((row, rIdx) =>
        h(
          "tr",
          { key: rIdx },
          row.map((cell, cIdx) => h("td", { key: cIdx }, renderInline(cell)))
        )
      )
    )
  );
}

function renderInline(text) {
  const parts = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let match;
  let idx = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(h("code", { key: idx++ }, token.slice(1, -1)));
    } else {
      parts.push(h("strong", { key: idx++ }, token.slice(2, -2)));
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}
