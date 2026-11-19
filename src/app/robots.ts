import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://azzamrafizafran.vercel.app/sitemap.xml",
    host: "https://azzamrafizafran.vercel.app",
  };
}

