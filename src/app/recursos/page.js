import Link from "next/link";
import { ArrowUpRight, Github, MapPin, Search, Users, Zap } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";
import { RESOURCE_SECTIONS, THIS_PROJECT } from "@/lib/otherResources";
import "./recursos.css";

export const metadata = createPageMetadata({
  title: "Otros recursos de ayuda",
  description:
    "Enlaces útiles para buscar desaparecidos, localizados y otras herramientas de respuesta humanitaria en Venezuela. Incluye Red de Ayuda (open source).",
  path: "/recursos",
});

function ExternalCard({ link }) {
  return (
    <a
      className="recursos-card recursos-card-ext"
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="recursos-card-head">
        <strong>{link.title}</strong>
        <ArrowUpRight size={18} aria-hidden />
      </span>
      <span className="recursos-card-desc">{link.description}</span>
      <span className="recursos-card-url">{link.url.replace(/^https?:\/\//, "")}</span>
    </a>
  );
}

export default function RecursosPage() {
  return (
    <div className="recursos-shell">
      <div className="recursos-topbar">
        <div className="recursos-mark" aria-hidden>
          <Zap size={16} strokeWidth={2.6} color="#fff" />
        </div>
        <div>
          <div className="recursos-topbar-title">Red de Ayuda · Venezuela</div>
          <div className="recursos-topbar-sub">Directorio de recursos</div>
        </div>
      </div>

      <main className="recursos-page">
        <header className="recursos-header">
          <Link href="/" className="recursos-back">← Volver al mapa</Link>
          <h1>Otros recursos de ayuda</h1>
          <p className="recursos-lead">
            Enlaces externos útiles. Esta app coordina logística; estas páginas cubren
            desaparecidos, localizados y otros aspectos de la emergencia.
          </p>
        </header>

        {RESOURCE_SECTIONS.map((section) => (
          <section key={section.id} className="recursos-section">
            <h2>{section.title}</h2>
            {section.description && (
              <p className="recursos-section-desc">{section.description}</p>
            )}
            <div className="recursos-grid">
              {section.links.map((link) => (
                <ExternalCard key={link.url} link={link} />
              ))}
            </div>
          </section>
        ))}

        <section className="recursos-section recursos-project">
          <h2>{THIS_PROJECT.title}</h2>
          <p className="recursos-project-tagline">{THIS_PROJECT.tagline}</p>
          <p className="recursos-project-summary">{THIS_PROJECT.summary}</p>

          <ol className="recursos-steps">
            {THIS_PROJECT.steps.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>

          <div className="recursos-project-actions">
            <Link href="/" className="recursos-btn recursos-btn-primary">
              <MapPin size={16} aria-hidden /> Abrir mapa
            </Link>
            <a
              className="recursos-btn recursos-btn-outline"
              href={THIS_PROJECT.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={16} aria-hidden /> Código open source
            </a>
          </div>

          <p className="recursos-repo-note">
            Repositorio:{" "}
            <a href={THIS_PROJECT.repoUrl} target="_blank" rel="noopener noreferrer">
              {THIS_PROJECT.repoLabel}
            </a>
            {" · "}
            Proyecto comunitario por{" "}
            <a href={THIS_PROJECT.author.profileUrl} target="_blank" rel="noopener noreferrer">
              {THIS_PROJECT.author.name}
            </a>
          </p>
        </section>

        <aside className="recursos-tip">
          <Search size={16} aria-hidden />
          <span>
            ¿Conoces otro enlace útil?{" "}
            <a href={THIS_PROJECT.repoUrl} target="_blank" rel="noopener noreferrer">
              Sugiérelo en GitHub
            </a>
            .
          </span>
        </aside>

        <footer className="recursos-footer">
          <Users size={16} aria-hidden />
          <span>
            Estos sitios son independientes de Red de Ayuda. Verifica la información antes de actuar.
          </span>
        </footer>
      </main>
    </div>
  );
}
