// Check a deck: files vs order, one aside, builds == cue markers, no x- elements, and nothing overflowing 1920x1080 when fully built.
// usage: node check_deck.mjs <project_dir> [shots_dir]
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const [proj, shots] = process.argv.slice(2);
const deck = JSON.parse(fs.readFileSync(path.join(proj, "deck.json"), "utf8"));
const fontLinks = Object.values(deck.faces).filter((f) => f.href).map((f) => `<link rel="stylesheet" href="${f.href}">`).join("");
if (shots) fs.mkdirSync(shots, { recursive: true });
const problems = [];
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
let secs = 0;
for (const id of deck.order) {
  const f = path.join(proj, "slides", `${id}.html`);
  if (!fs.existsSync(f)) { problems.push(`${id}: missing file`); continue; }
  const html = fs.readFileSync(f, "utf8");
  const asides = html.match(/<aside>([\s\S]*?)<\/aside>/g) || [];
  if (asides.length !== 1) problems.push(`${id}: ${asides.length} asides`);
  const notes = asides[0] || "";
  const cues = [...notes.matchAll(/\[(\d+)\]/g)].map((m) => +m[1]);
  const builds = [...new Set([...html.matchAll(/data-build-in="\w+\s*(\d*)"/g)].map((m) => +(m[1] || 1)))].sort((a, b) => a - b);
  const cs = [...cues].sort((a, b) => a - b);
  if (JSON.stringify(cs) !== JSON.stringify(builds)) problems.push(`${id}: builds ${builds} vs cues ${cues}`);
  if (JSON.stringify(cues) !== JSON.stringify(cs)) problems.push(`${id}: cues out of order ${cues}`);
  if (/<x-/.test(html)) problems.push(`${id}: custom x- element`);
  if (!html.includes(`id="${id}"`)) problems.push(`${id}: section id mismatch`);
  const words = notes.replace(/<[^>]+>|\[\d+\]/g, " ").split(/\s+/).filter(Boolean).length;
  secs += words / 2.3;
  const body = html.replace(/<aside>[\s\S]*?<\/aside>/, "");
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">${fontLinks}<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden}section{position:relative;width:1920px;height:1080px;overflow:hidden}</style></head><body>${body}</body></html>`, { waitUntil: "load", timeout: 60000 });
  await page.evaluate(async () => { await document.fonts.ready; });
  const over = await page.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll("section *")) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > 1921 || r.bottom > 1081 || r.left < -1 || r.top < -1) out.push(`${e.tagName} ${Math.round(r.left)},${Math.round(r.top)}-${Math.round(r.right)},${Math.round(r.bottom)} "${(e.textContent || "").trim().slice(0, 30)}"`);
      if (e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflow !== "visible" && e.clientHeight > 0) out.push(`${e.tagName} clipped content "${(e.textContent || "").trim().slice(0, 30)}"`);
    }
    return out.slice(0, 3);
  });
  if (over.length) problems.push(`${id}: overflow ${over.join(" | ")}`);
  if (shots) await page.screenshot({ path: path.join(shots, `${String(deck.order.indexOf(id)).padStart(2, "0")}-${id}.png`) });
}
await browser.close();
console.log(`${deck.order.length} slides, ~${Math.round(secs / 60)} min of speech`);
console.log(problems.length ? problems.join("\n") : "no problems");
