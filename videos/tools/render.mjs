// Render deck slides to frames whose build-in animations start at spoken cues, then an ffmpeg concat list.
// usage: node render.mjs <cues.json> <slides_dir> <deck.json> <out_dir>
// Only frames that differ are rendered: an animation window at FPS, one still for each hold.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const [cuesPath, slidesDir, deckPath, outDir] = process.argv.slice(2);
const FPS = 30, ANIM = 0.55, PREROLL = 0.15, FADE = 0.35;
const cues = JSON.parse(fs.readFileSync(cuesPath, "utf8"));
const deck = JSON.parse(fs.readFileSync(deckPath, "utf8"));
const fontLinks = Object.values(deck.faces).filter((f) => f.href).map((f) => `<link rel="stylesheet" href="${f.href}">`).join("");
fs.mkdirSync(outDir, { recursive: true });

// Elements of the deck subset that are not plain HTML.
const ICONS = { Check: "M5 12l5 5 9-10", CheckCircle: "M12 2a10 10 0 100 20 10 10 0 000-20zm-5 10l3.5 3.5L17 9", Warning: "M12 3l10 18H2L12 3zm0 6v6m0 3v.5" };
function shim(html) {
  return html
    .replace(/<aside>[\s\S]*?<\/aside>/, "")
    .replace(/<x-icon name="(\w+)" style="([^"]*)"><\/x-icon>/g, (_, n, st) =>
      `<svg viewBox="0 0 24 24" style="${st};fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none"><path d="${ICONS[n] ?? ""}"/></svg>`)
    .replace(/<x-shape kind="arrow-left"([^>]*)style="([^"]*)"><\/x-shape>/g, (_, a, st) =>
      `<svg${a}viewBox="0 0 100 50" preserveAspectRatio="none" style="${st.replace(/background:([^;]+)/, "fill:$1")}"><path d="M0 25L40 0V14H100V36H40V50Z"/></svg>`);
}

const page_html = (section) => `<!doctype html><html><head><meta charset="utf-8">${fontLinks}<style>
*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden}
section{position:relative;width:1920px;height:1080px}
</style></head><body>${shim(section)}<script>{
const els=[...document.querySelectorAll('[data-build-in]')].map(e=>{const [kind,order]=e.dataset.buildIn.split(/\\s+/);return {e,kind,order:+order||1}});
const base=new Map(els.map(x=>[x.e,x.e.style.transform||'']));
window.setState=(times,t)=>{for(const x of els){const c=times[x.order];let p=c==null?1:Math.min(1,Math.max(0,(t-c)/${ANIM}));
const q=1-Math.pow(1-p,3);x.e.style.opacity=q;const b=base.get(x.e);
x.e.style.transform=(b+' '+(x.kind==='rise'?'translateY('+(1-q)*36+'px)':x.kind==='pop'?'scale('+(0.88+0.12*q)+')':'')).trim();}};
}</script></body></html>`;

const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--force-color-profile=srgb"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
page.on("console", (m) => console.log("console:", m.text()));
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
const list = [];
let n = 0;
async function shot(times, t) {
  const st = await page.evaluate((times, t) => { window.setState(times, t); return [...document.querySelectorAll("[data-build-in]")].map((e) => e.style.opacity).join(","); }, times, t);
  if (process.env.DBG) console.log(t.toFixed(2), st);
  const f = `f${String(n++).padStart(5, "0")}.png`;
  await page.screenshot({ path: path.join(outDir, f) });
  return f;
}
for (const s of cues.slides) {
  const html = fs.readFileSync(path.join(slidesDir, `${s.id}.html`), "utf8");
  await page.setContent(page_html(html), { waitUntil: "load", timeout: 60000 });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.fonts].map((f) => f.load().catch(() => {}))); });
  const fontsOk = await page.evaluate(() => document.fonts.check("700 40px 'Frank Ruhl Libre'") && document.fonts.check("400 30px 'IBM Plex Sans Hebrew'"));
  if (!fontsOk) console.warn(s.id, "warning: web fonts not loaded");
  const dur = s.end - s.start;
  const times = Object.fromEntries(s.cues.map((c) => [c.n, Math.max(0, c.t - PREROLL)]));
  // Moments where something moves: each cue's animation window. Everything else is a hold.
  const windows = [...new Set(Object.values(times))].sort((a, b) => a - b).map((c) => [c, Math.min(dur, c + ANIM)]);
  let t = 0;
  for (const [a, b] of windows) {
    if (a > t) { list.push([await shot(times, t), a - t]); t = a; }
    for (; t < b - 1e-6; t += 1 / FPS) list.push([await shot(times, t), Math.min(1 / FPS, b - t)]);
    t = b;
  }
  if (dur > t) list.push([await shot(times, t), dur - t]);
  console.log(s.id, `${dur.toFixed(2)}s`, `${windows.length} cues`, `frames so far ${n}`);
}
await browser.close();
// ffmpeg concat: each still with its duration (the last repeated, as the demuxer needs).
const lines = list.map(([f, d]) => `file '${f}'\nduration ${d.toFixed(4)}`);
lines.push(`file '${list.at(-1)[0]}'`);
fs.writeFileSync(path.join(outDir, "frames.txt"), lines.join("\n") + "\n");
console.log("total", list.reduce((a, [, d]) => a + d, 0).toFixed(2), "s");
