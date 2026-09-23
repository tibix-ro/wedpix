import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SITE_URL = "https://www.wedpix.ro";
const SITEMAP_PATH = resolve(process.cwd(), "public", "sitemap.xml");

const routes = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/contact", changefreq: "monthly", priority: "0.6" },
    { path: "/privacy-policy", changefreq: "yearly", priority: "0.4" },
    { path: "/terms-of-service", changefreq: "yearly", priority: "0.4" },
    { path: "/cookie-policy", changefreq: "yearly", priority: "0.4" },
    { path: "/gdpr", changefreq: "yearly", priority: "0.4" },
    { path: "/dpa", changefreq: "yearly", priority: "0.3" },
    { path: "/accessibility", changefreq: "yearly", priority: "0.3" },
];

const lastmod = new Date().toISOString().slice(0, 10);

const urls = routes
    .map(
        ({ path, changefreq, priority }) => `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

await writeFile(SITEMAP_PATH, xml, "utf8");
console.log(`Sitemap generated at ${SITEMAP_PATH}`);
