import CentrosLista from "@/components/CentrosLista";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Centros de emergencia",
  description:
    "Directorio de centros de ayuda en Venezuela: estado operativo, equipo, inventario, camas y contacto.",
  path: "/centros",
});

export default function CentrosPage() {
  return <CentrosLista />;
}
