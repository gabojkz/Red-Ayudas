import CentroDetalle from "@/components/CentroDetalle";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return createPageMetadata({
    title: `Centro ${String(slug).replace(/-/g, " ")}`,
    description: "Detalle del centro de emergencia: inventario, equipo, camas y contacto.",
    path: `/centros/${slug}`,
  });
}

export default async function CentroPage({ params }) {
  const { slug } = await params;
  return <CentroDetalle slug={slug} />;
}
