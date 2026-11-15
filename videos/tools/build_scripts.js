// Build one printable RTL page with every lesson's narration, cue markers removed.
const fs = require("fs");
const V = "C:/Users/afik1/Desktop/AfikAccounting/videos";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const unent = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
const text = (h) => unent(h.replace(/<[^>]+>/g, " ")).replace(/[\u202a-\u202e]/g, "").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
let toc = "", body = "", total = 0;
for (let n = 1; n <= 9; n++) {
  const d = JSON.parse(fs.readFileSync(`${V}/basics${n}/deck/deck.json`, "utf8"));
  const title = d.title.replace(/^חשבונאות מאפס — /, "");
  let secs = 0, slides = "";
  d.order.forEach((id, i) => {
    const h = fs.readFileSync(`${V}/basics${n}/deck/slides/${id}.html`, "utf8");
    const notes = text((h.match(/<aside>([\s\S]*?)<\/aside>/) || ["", ""])[1].replace(/\[\d+\]\s*/g, ""));
    const head = h.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/);
    const st = head ? text(head[1]) : id;
    secs += notes.split(/\s+/).length / 2.3;
    const lines = notes.split("\n").map((l) => `<p>${esc(l)}</p>`).join("");
    const last = i === d.order.length - 1;
    slides += `<div class="s"><div class="sh"><span class="num">${i + 1}</span>${esc(st)}</div>${lines}</div>\n` +
      (last ? `<div class="stop end">■ סוף השיעור. עוצרים את ההקלטה.</div>\n` : `<div class="stop">⏸ עוצרים 2 שניות, ואז שקופית ${i + 2}</div>\n`);
  });
  total += secs;
  const min = Math.round(secs / 60);
  toc += `<li><a href="#l${n}">${esc(title)}</a> <span class="m">· ${d.order.length} שקופיות · כ-${min} דק׳</span></li>`;
  body += `<section id="l${n}"><h2>${esc(title)}</h2><div class="meta">${d.order.length} שקופיות · כ-${min} דקות הקראה</div>${slides}</section>\n`;
}
const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>תסריטי הקראה · חשבונאות מאפס</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700&family=IBM+Plex+Sans+Hebrew:wght@400;600&display=swap">
<style>
:root{--bg:#f2f5f0;--ink:#0f3d2e;--acc:#1d6b47;--card:#fbfcf9;--line:#d3ded6;--muted:#5b6d63}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'IBM Plex Sans Hebrew',Arial,sans-serif}
main{max-width:820px;margin:0 auto;padding:32px 16px 80px}
h1,h2{font-family:'Frank Ruhl Libre',Georgia,serif}
h1{font-size:40px;margin:0 0 8px}
h2{font-size:32px;margin:56px 0 4px;padding-top:16px;border-top:3px solid var(--acc)}
.meta,.m{color:var(--muted);font-size:16px}
.how{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 20px;font-size:17px;line-height:1.7}
.how li{margin:4px 0}
ol.toc{font-size:18px;line-height:2}
a{color:var(--acc)}
.s{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 20px;margin:14px 0}
.sh{font-weight:600;color:var(--acc);font-size:16px;margin-bottom:6px;display:flex;gap:10px;align-items:center}
.num{background:var(--acc);color:#fbfcf9;border-radius:20px;min-width:30px;text-align:center;padding:1px 8px;font-size:15px}
.s p{margin:0 0 10px;font-size:21px;line-height:1.75;padding-right:14px;border-right:3px solid var(--line)}
.s p:last-child{margin-bottom:0}
.stop{margin:10px 0 18px;padding:8px 14px;border-radius:10px;background:#e4ece6;color:var(--acc);font-weight:600;font-size:16px;text-align:center}
.stop.end{background:var(--acc);color:#fbfcf9}
@media print{body{background:#fff}.s{break-inside:avoid;border-color:#ccc}section{break-before:page}h2{border-top:none}}
</style></head><body><main>
<h1>תסריטי הקראה · חשבונאות מאפס</h1>
<div class="meta">9 שיעורים · כ-${Math.round(total / 60)} דקות הקראה בסך הכול</div>
<div class="how"><b>איך מקליטים</b><ul>
<li>קובץ הקלטה אחד לכל שיעור (למשל ״שיעור 3.m4a״). אפשר גם קובץ לכל שקופית, אם נוח יותר.</li>
<li><b>כל שורה נאמרת ברצף, בנשימה אחת.</b> המשפטים באותה שורה קשורים זה לזה, אז לא עוצרים באמצע שורה.</li>
<li>בין שורה לשורה באותה שקופית אפשר לקחת נשימה קצרה, כמו בדיבור רגיל. לא יותר.</li>
<li>עוצרים 2 שניות של שקט רק בפס הירוק ⏸ שבין השקופיות. ככה אני מוצא איפה כל שקופית מתחילה.</li>
<li>טעית? עוצרים רגע וחוזרים על המשפט. את הניסיון הקודם אני אחתוך.</li>
<li>לא חייבים מילה במילה. התזמון מסתדר גם כשמנסחים קצת אחרת.</li>
<li>כמו בפעם הקודמת: לכבות מזגן או מאוורר, ולהקליט קרוב למיקרופון.</li>
</ul></div>
<ol class="toc">${toc}</ol>
${body}
</main></body></html>`;
fs.writeFileSync(`${V}/scripts.html`, html);
console.log("total min", Math.round(total / 60));
