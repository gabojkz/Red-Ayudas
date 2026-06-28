import RedDeAyuda from "@/components/RedDeAyuda";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Reportes y conexiones",
  description:
    "Publica necesidades u ofertas de ayuda humanitaria y coordina conexiones entre quien necesita y quien puede ofrecer.",
  path: "/reportes",
});

export default function ReportesPage() {
  return <RedDeAyuda />;
}
