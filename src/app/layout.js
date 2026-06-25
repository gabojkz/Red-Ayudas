import SerwistProvider from "@/components/SerwistProvider";
import "./globals.css";

export const metadata = {
  title: "Red de Ayuda · Venezuela",
  description: "Mapa colaborativo de necesidades tras emergencias en Venezuela",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Red de Ayuda",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport = {
  themeColor: "#1A2233",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <SerwistProvider>{children}</SerwistProvider>
      </body>
    </html>
  );
}
