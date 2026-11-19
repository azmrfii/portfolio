import PortfolioGame from "@/components/PortfolioGame";
import { buildings } from "@/data/worldData";

const SITE_URL = "https://azzamrafizafran.vercel.app";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Azzam Rafi Zafran",
      alternateName: ["azmrfii", "Azzam Rafi"],
      url: SITE_URL,
      email: "mailto:azzamrafizafran@gmail.com",
      telephone: "+62-813-8419-7696",
      jobTitle: "Fullstack Developer | Web & Mobile Engineer",
      description:
        "Fullstack Developer specializing in modern web and mobile application engineering with experience at PT. Adidata Informatika, PT. Geomatika Satelit Indonesia, and CV Sinang Permata Group.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bogor",
        addressRegion: "Jawa Barat",
        addressCountry: "ID",
      },
      worksFor: {
        "@type": "Organization",
        name: "PT. Adidata Informatika",
      },
      alumniOf: [
        { "@type": "CollegeOrUniversity", name: "Universitas Telkom (Telkom University)" },
        { "@type": "EducationalOrganization", name: "SMK Farmako Medika Plus" },
        { "@type": "EducationalOrganization", name: "SMK Wikrama 1 Garut" },
      ],
      sameAs: [
        "https://www.linkedin.com/in/azzamrafizafran/",
        "https://id.linkedin.com/in/azzamrafizafran",
        "https://github.com/azmrfii",
        "https://azmrfii.vercel.app",
      ],
    },
    {
      "@type": "ProfilePage",
      "@id": `${SITE_URL}/#profilepage`,
      url: SITE_URL,
      name: "Azzam Rafi Zafran — Fullstack Developer | Interactive Town Portfolio",
      mainEntity: { "@id": `${SITE_URL}/#person` },
      inLanguage: "id-ID",
    },
  ],
};

export default function Home() {
  const eduBuildings = buildings.filter((b) => b.kind === "school");
  const workBuildings = buildings.filter((b) => b.kind === "office");

  return (
    <main className="relative h-full w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Semantic SSR content for search engine crawlers (Googlebot) */}
      <article className="sr-only">
        <h1>Azzam Rafi Zafran — Fullstack Developer | Web &amp; Mobile Portfolio</h1>
        <p>
          Selamat datang di Interactive Town Portfolio milik Azzam Rafi Zafran (azmrfii), seorang
          Fullstack Developer dan Software Engineer yang berfokus pada pengembangan aplikasi Web dan
          Mobile modern.
        </p>

        <section aria-label="Pengalaman Kerja Azzam Rafi Zafran">
          <h2>Pengalaman Kerja (Work Experience)</h2>
          <ul>
            {workBuildings.map((b) => (
              <li key={b.id}>
                <h3>
                  {b.modal.title} {b.modal.subtitle ? `— ${b.modal.subtitle}` : ""}
                </h3>
                {b.modal.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Riwayat Pendidikan Azzam Rafi Zafran">
          <h2>Pendidikan (Education)</h2>
          <ul>
            {eduBuildings.map((b) => (
              <li key={b.id}>
                <h3>
                  {b.modal.title} {b.modal.subtitle ? `— ${b.modal.subtitle}` : ""}
                </h3>
                {b.modal.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Kontak dan Profil Azzam Rafi Zafran">
          <h2>Kontak &amp; Profil Resmi</h2>
          <ul>
            <li>
              <a href="https://www.linkedin.com/in/azzamrafizafran/">
                LinkedIn Azzam Rafi Zafran
              </a>
            </li>
            <li>
              <a href="https://github.com/azmrfii">GitHub azmrfii (Azzam Rafi Zafran)</a>
            </li>
            <li>
              <a href="mailto:azzamrafizafran@gmail.com">azzamrafizafran@gmail.com</a>
            </li>
          </ul>
        </section>
      </article>

      <PortfolioGame />
    </main>
  );
}
