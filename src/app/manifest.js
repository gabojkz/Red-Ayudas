export default function manifest() {
  return {
    name: "Red de Ayuda · Venezuela",
    short_name: "Red de Ayuda",
    description: "Mapa colaborativo de necesidades de ayuda humanitaria",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F5F6F8",
    theme_color: "#1A2233",
    lang: "es",
    categories: ["navigation", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
