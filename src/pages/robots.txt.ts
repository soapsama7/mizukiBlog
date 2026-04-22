import type { APIRoute } from "astro";
import { siteConfig } from "../config";

const siteBase = import.meta.env.SITE || siteConfig.siteURL;

const robotsTxt = `
User-agent: *
Disallow: /
Allow: /$
Allow: /posts/

Sitemap: ${new URL("sitemap-index.xml", siteBase).href}
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
