import RedDeAyuda from "@/components/RedDeAyuda";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata, siteConfig, websiteJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: siteConfig.title,
  absoluteTitle: true,
  description:
    "Publica y encuentra necesidades de ayuda humanitaria en Venezuela: medicamentos, agua, alimentos, rescate, transporte y más. Mapa colaborativo en tiempo real.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <RedDeAyuda />
    </>
  );
}
