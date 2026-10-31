// Fetches the "Real examples" on each converter page from the live API (3 per page, the page's own
// samples), checks each answer is in the right script, and writes tools/examples.json.
//   node tools/fetch_examples.mjs && python3 tools/build_converters.py
import { readFileSync, writeFileSync } from "node:fs";
const { api, pages } = JSON.parse(readFileSync(new URL("./converters.json", import.meta.url), "utf8"));
const SCRIPT = { bn: /[ঀ-৿]/, hi: /[ऀ-ॿ]/, ur: /[؀-ۿ]/, ar: /[؀-ۿ]/ };
const only = process.argv[2]; // optional: refetch one page, keep the rest
const out = only ? JSON.parse(readFileSync(new URL("./examples.json", import.meta.url), "utf8")) : {};
for (const page of pages.filter((p) => !only || p.slug === only)) {
  const id = crypto.randomUUID().replaceAll("-", "");
  out[page.slug] = [];
  for (const draft of page.samples) {
    const response = await fetch(`${api}/v1/improve`, { method: "POST", headers: { "Content-Type": "application/json", "X-EkLish-Installation-ID": id }, body: JSON.stringify({ draft, goal: page.goal, language: page.lang, surface: "web" }) });
    const body = await response.json();
    if (response.status !== 200) throw new Error(`${page.slug}: ${response.status} ${body.error}`);
    const text = body.improvedText;
    const native = page.goal === "native" && SCRIPT[page.lang];
    const ok = native ? native.test(text) : /^[\x00-\x7F‘-”–—]+$/.test(text);
    if (!ok) throw new Error(`${page.slug}: wrong script for "${draft}"`);
    out[page.slug].push({ draft, text, requestId: body.requestId });
  }
  console.log(page.slug, "ok");
}
writeFileSync(new URL("./examples.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
