/** Shared SEO config for metadata, sitemap, and JSON-LD. */

export const siteConfig = {
  name: "Red de Ayuda",
  title: "Red de Ayuda · Venezuela",
  description:
    "Mapa colaborativo para coordinar necesidades y ofertas de ayuda humanitaria en Venezuela tras emergencias.",
  keywords: [
    "ayuda humanitaria Venezuela",
    "emergencias Venezuela",
    "mapa ayuda Venezuela",
    "coordinación logística",
    "necesidades humanitarias",
    "ofertas de ayuda",
    "rescate Venezuela",
    "donaciones Venezuela",
    "PWA ayuda humanitaria",
    "Red de Ayuda",
  ],
  locale: "es_VE",
  language: "es",
  url: "https://red-ayudas.vercel.app",
  twitterHandle: null,
};

export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return siteConfig.url;
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

const defaultRobots = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

/** @param {{ title?: string, description?: string, path?: string, noIndex?: boolean, absoluteTitle?: boolean, alternates?: object }} opts */
export function createPageMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
  absoluteTitle = false,
  alternates,
} = {}) {
  const url = absoluteUrl(path);
  const fullTitle = title ?? siteConfig.title;

  return {
    title: absoluteTitle ? { absolute: fullTitle } : fullTitle,
    description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    robots: noIndex ? { index: false, follow: false } : defaultRobots,
    alternates: {
      canonical: path,
      ...alternates,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}

export function websiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: siteConfig.title,
        description: siteConfig.description,
        inLanguage: siteConfig.language,
        publisher: { "@id": `${url}/#app` },
      },
      {
        "@type": "WebApplication",
        "@id": `${url}/#app`,
        name: siteConfig.title,
        description: siteConfig.description,
        url,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        inLanguage: siteConfig.language,
        isAccessibleForFree: true,
      },
    ],
  };
}
