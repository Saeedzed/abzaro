/**
 * Find the production routes that are NOT reachable on a deployed host.
 *
 *   BASE_URL=https://your-site.netlify.app node scripts/check-routes.mjs
 *
 * Compares the prerendered route list from .next/prerender-manifest.json with
 * the live HTTP responses, so a deploy that silently drops metadata routes
 * (sitemap.xml, robots.txt, icon.svg) is caught immediately.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const manifestPath = join(process.cwd(), ".next", "prerender-manifest.json");

let routes = [];
try {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  routes = Object.keys(manifest.routes ?? {}).filter((r) => !r.startsWith("/_"));
} catch {
  console.error(`✗ cannot read ${manifestPath} — run a build first.`);
  process.exit(1);
}

const failures = [];
console.log(`Checking ${routes.length} prerendered routes against ${BASE}\n`);

for (const route of routes) {
  const url = `${BASE}${route}`;
  let status = 0;
  try {
    const response = await fetch(url, { redirect: "follow" });
    status = response.status;
  } catch (error) {
    status = `ERR ${error.message}`;
  }
  const ok = status === 200;
  if (!ok) failures.push({ route, status });
  console.log(`${ok ? "PASS" : "FAIL"}  ${status}  ${route}`);
}

console.log(
  failures.length === 0
    ? `\n✅ ALL ${routes.length} ROUTES OK`
    : `\n❌ ${failures.length} ROUTE(S) BROKEN:\n` +
        failures.map((f) => `   ${f.status}  ${f.route}`).join("\n"),
);

process.exit(failures.length === 0 ? 0 : 1);
