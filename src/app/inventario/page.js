import InventarioApp from "@/components/InventarioApp";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Inventario por sede",
  description:
    "Registro de materiales, camas de refugio y ayudantes por centro de emergencia. Busca insumos entre sedes o administra el stock de tu sede.",
  path: "/inventario",
});

export default function InventarioPage() {
  return <InventarioApp />;
}
