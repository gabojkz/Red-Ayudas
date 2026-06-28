import NecesidadesLista from "@/components/NecesidadesLista";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata, siteConfig, websiteJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: siteConfig.title,
  absoluteTitle: true,
  description:
    "Lista de necesidades de materiales por centro de emergencia en Venezuela: medicinas, agua, alimentos, camas de refugio y más.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <NecesidadesLista />
    </>
  );
}
