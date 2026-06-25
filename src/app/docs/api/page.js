import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { renderMarkdown } from "@/lib/renderMarkdown";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Feed público para desarrolladores",
  description:
    "Documentación del feed JSON de Red de Ayuda: necesidades y ofertas activas de ayuda humanitaria en Venezuela.",
  path: "/docs/api",
  alternates: {
    languages: {
      es: "/docs/api",
      en: "/docs/api/en",
    },
  },
});

export default function ApiDocsPageEs() {
  const content = renderMarkdown(readFileSync(join(process.cwd(), "docs", "api.es.md"), "utf8"));

  return (
    <div className="api-docs">
      <header className="api-docs-header">
        <div>
          <Link href="/" className="api-docs-back">← Volver al mapa</Link>
          <h1>Feed público</h1>
          <p>Un endpoint GET · solo lectura · sin autenticación</p>
        </div>
        <nav className="api-docs-lang" aria-label="Idioma">
          <span className="on">Español</span>
          <Link href="/docs/api/en" hrefLang="en">English</Link>
        </nav>
      </header>

      <aside className="api-docs-notice">
        <code>GET /api/feed</code> devuelve necesidades y ofertas activas. Para publicar, usa la app web.
      </aside>

      <article className="api-docs-body">{content}</article>
    </div>
  );
}
