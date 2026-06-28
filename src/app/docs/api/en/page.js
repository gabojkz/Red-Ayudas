import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { renderMarkdown } from "@/lib/renderMarkdown";
import { createPageMetadata, siteConfig } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Public feed for developers",
  description:
    `${siteConfig.name} JSON feed documentation: active humanitarian needs and offers in Venezuela.`,
  path: "/docs/api/en",
  alternates: {
    languages: {
      es: "/docs/api",
      en: "/docs/api/en",
    },
  },
});

export default function ApiDocsPageEn() {
  const content = renderMarkdown(readFileSync(join(process.cwd(), "docs", "api.en.md"), "utf8"));

  return (
    <div className="api-docs">
      <header className="api-docs-header">
        <div>
          <Link href="/" className="api-docs-back">← Back to map</Link>
          <h1>Public feed</h1>
          <p>One GET endpoint · read-only · no auth</p>
        </div>
        <nav className="api-docs-lang" aria-label="Language">
          <Link href="/docs/api" hrefLang="es">Español</Link>
          <span className="on">English</span>
        </nav>
      </header>

      <aside className="api-docs-notice">
        <code>GET /api/feed</code> returns active needs and offers. To publish, use the web app.
      </aside>

      <article className="api-docs-body">{content}</article>
    </div>
  );
}
