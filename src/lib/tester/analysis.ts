import { type Answers, type FormState, type Row, moduleName, optionsOf, schema, sectionById, tagLabel, toMarkdown } from "./form";

/**
 * Every tester's feedback, read together: where they got stuck (and how badly), which
 * lesson pages they rated unclear (and why), how ready each lesson left them for the exam, where the exam asked more than the course taught,
 * how the tools did, and the overall verdict, ending in an ordered list of what to fix.
 * Pure, so it is tested; the admin page shows it, and `forClaude` hands the same reading,
 * with the raw answers, to Claude for a deeper one.
 */

export type TesterInput = { id: string; label: string; state: FormState };

export type Quote = { text: string; tester: string; module?: string };
export type Hotspot = {
  where: string;
  points: number;
  testers: number;
  blockers: number;
  slows: number;
  cosmetic: number;
  minutes: number;
  kinds: Record<string, number>;
  notes: Quote[];
  score: number;
};
/** One lesson page, every tester's rating of it. */
export type PageStat = {
  key: string;
  lesson: string;
  title: string;
  where: string;
  clear: number;
  ok: number;
  unclear: number;
  n: number;
  tags: Record<string, number>;
  notes: Quote[];
  /** Median seconds on the page before rating it, when known. */
  secs: number | null;
  /** 0 (all clear) to 1 (all unclear). */
  score: number;
};
/** One lesson: how many of its pages were rated, how unclear, and the end-of-lesson answers. */
export type LessonStat = { slug: string; lesson: string; rated: number; unclear: number; ok: number; exam: number | null; examN: number; changes: Quote[] };
export type Action = { level: "high" | "medium" | "low"; text: string; why: string };

export type Analysis = {
  testers: number;
  modules: number;
  points: number;
  minutesLost: number;
  bySeverity: Record<string, number>;
  byKind: Record<string, number>;
  hotspots: Hotspot[];
  pages: PageStat[];
  lessons: LessonStat[];
  /** Ratings given, over all pages and testers. */
  pageRatings: number;
  rubric: { improve: Quote[]; tooMuch: Quote[]; missing: Quote[]; excellent: Quote[] };
  exam: { independence: Record<string, number>; notTaught: Quote[]; taughtSimpler: Quote[]; courseHelped: Quote[] };
  leftSite: Quote[];
  tools: {
    used: Record<string, number>;
    helped: Record<string, number>;
    found: Record<string, number>;
    explained: Record<string, number>;
    problems: Quote[];
    sheetMissing: Quote[];
  };
  verdict: Record<string, number>;
  verdictGaps: Quote[];
  nps: { score: number | null; promoters: number; passives: number; detractors: number; n: number };
  leastReady: Quote[];
  suggestions: Quote[];
  actions: Action[];
};

const SEVERITY_WEIGHT: Record<string, number> = { blocker: 5, slows: 2, cosmetic: 1 };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const add = (m: Record<string, number>, k: string, n = 1) => {
  if (k) m[k] = (m[k] ?? 0) + n;
};
const quote = (text: unknown, tester: string, module?: string): Quote | null => {
  const t = str(text);
  return t && t !== "אין" && t !== "-" && t !== "—" ? { text: t, tester, module } : null;
};
const push = (list: Quote[], q: Quote | null) => q && list.push(q);

/** Group sticking points by page: the address in parentheses when the button filled it in, else the text. */
export function placeKey(where: string) {
  const path = /\((\/[^)\s]*)\)/.exec(where)?.[1] ?? /(^|\s)(\/[a-z0-9/_-]+)/i.exec(where)?.[2];
  if (path) return path.replace(/#.*$/, "").replace(/\/$/, "") || "/";
  return where.replace(/\s+/g, " ").trim().toLowerCase();
}

const label = (enumName: string, value: string) => {
  const o = (schema.enums[enumName] ?? []).find((x) => (typeof x === "string" ? x : x.value) === value);
  return o ? (typeof o === "string" ? o : o.label) : value;
};

export function analyze(testers: TesterInput[]): Analysis {
  const bySeverity: Record<string, number> = {};
  const byKind: Record<string, number> = {};
  const spots = new Map<string, Hotspot & { who: Set<string>; names: Map<string, number> }>();
  const pageMap = new Map<string, PageStat & { times: number[] }>();
  const lessonMap = new Map<string, LessonStat & { examSum: number }>();
  let pageRatings = 0;
  const rubric: Analysis["rubric"] = { improve: [], tooMuch: [], missing: [], excellent: [] };
  const exam: Analysis["exam"] = { independence: {}, notTaught: [], taughtSimpler: [], courseHelped: [] };
  const leftSite: Quote[] = [];
  const tools: Analysis["tools"] = { used: {}, helped: {}, found: {}, explained: {}, problems: [], sheetMissing: [] };
  const verdict: Record<string, number> = {};
  const verdictGaps: Quote[] = [];
  const leastReady: Quote[] = [];
  const suggestions: Quote[] = [];
  const npsScores: number[] = [];
  let modules = 0;
  let points = 0;
  let minutesLost = 0;

  const toolsField = sectionById("tools").fields.find((f) => f.id === "toolsUsed");
  const toolLabel = (v: string) => (toolsField ? optionsOf(toolsField).find((o) => o.value === v)?.label ?? v : v);

  for (const t of testers) {
    const s = t.state;
    s.modules.forEach((m: Answers, i) => {
      if (Object.keys(m).length === 0) return;
      modules++;
      const mod = moduleName(m, i);

      for (const r of (m["stuckPoints.points"] as Row[] | undefined) ?? []) {
        if (!Object.values(r).some(Boolean)) continue;
        points++;
        const sev = str(r.severity);
        const kind = str(r.kind);
        const minutes = Math.max(0, Math.min(600, Number(r.minutesLost) || 0));
        add(bySeverity, sev || "unknown");
        add(byKind, kind || "unknown");
        minutesLost += minutes;
        const where = str(r.where) || "לא צוין";
        const key = placeKey(where);
        const h =
          spots.get(key) ??
          ({ where, points: 0, testers: 0, blockers: 0, slows: 0, cosmetic: 0, minutes: 0, kinds: {}, notes: [], score: 0, who: new Set<string>(), names: new Map<string, number>() } as Hotspot & {
            who: Set<string>;
            names: Map<string, number>;
          });
        h.points++;
        h.minutes += minutes;
        if (sev === "blocker") h.blockers++;
        else if (sev === "slows") h.slows++;
        else if (sev === "cosmetic") h.cosmetic++;
        add(h.kinds, kind || "unknown");
        h.who.add(t.id);
        h.names.set(where, (h.names.get(where) ?? 0) + 1);
        push(h.notes, quote(r.tried, t.label, mod));
        spots.set(key, h);
      }
      push(leftSite, quote(m["stuckPoints.leftSite"], t.label, mod));

      push(rubric.improve, quote(m["quickRubric.improve"], t.label, mod));
      push(rubric.tooMuch, quote(m["quickRubric.tooMuch"], t.label, mod));
      push(rubric.missing, quote(m["quickRubric.missing"], t.label, mod));
      push(rubric.excellent, quote(m["quickRubric.excellent"], t.label, mod));

      add(exam.independence, str(m["examGap.independence"]));
      push(exam.notTaught, quote(m["examGap.notTaught"], t.label, mod));
      push(exam.taughtSimpler, quote(m["examGap.taughtSimpler"], t.label, mod));
      push(exam.courseHelped, quote(m["examGap.courseHelped"], t.label, mod));

      for (const v of (m["tools.toolsUsed"] as string[] | undefined) ?? []) add(tools.used, toolLabel(v));
      add(tools.helped, str(m["tools.helpedUnderstand"]));
      add(tools.found, str(m["tools.foundEasily"]));
      add(tools.explained, str(m["tools.resultExplained"]));
      push(tools.problems, quote(m["tools.unexpected"], t.label, mod));
      push(tools.problems, quote(m["tools.inputsClear"], t.label, mod));
      push(tools.sheetMissing, quote(m["tools.sheetMissing"], t.label, mod));

      push(suggestions, quote(m["freeText.oneChange"], t.label, mod));
      push(suggestions, quote(m["freeText.uxIdeas"], t.label, mod));
    });

    for (const [key, p] of Object.entries(s.pages ?? {})) {
      const slug = key.split("/")[0];
      const l = lessonMap.get(slug) ?? { slug, lesson: p.lesson || slug, rated: 0, unclear: 0, ok: 0, exam: null, examN: 0, changes: [], examSum: 0 };
      lessonMap.set(slug, l);
      if (key.endsWith("/summary")) {
        if (p.exam) {
          l.examSum += p.exam;
          l.examN++;
        }
        push(l.changes, quote(p.change, t.label, p.lesson));
        continue;
      }
      if (!p.r) continue;
      pageRatings++;
      l.rated++;
      if (p.r === "unclear") l.unclear++;
      if (p.r === "ok") l.ok++;
      const st =
        pageMap.get(key) ??
        ({ key, lesson: p.lesson || slug, title: p.title, where: p.where ?? "", clear: 0, ok: 0, unclear: 0, n: 0, tags: {}, notes: [], secs: null, score: 0, times: [] } as PageStat & {
          times: number[];
        });
      st.title = p.title || st.title;
      st[p.r]++;
      st.n++;
      for (const tag of p.tags ?? []) add(st.tags, tag);
      push(st.notes, quote(p.note, t.label));
      if (p.secs) st.times.push(p.secs);
      pageMap.set(key, st);
    }

    add(verdict, str(s.summary["summary.verdict"]));
    push(verdictGaps, quote(s.summary["summary.verdictGap"], t.label));
    push(leastReady, quote(s.summary["summary.leastReady"], t.label));
    const rec = Number(s.summary["summary.recommend"]);
    if (s.summary["summary.recommend"] !== undefined && s.summary["summary.recommend"] !== "" && rec >= 0 && rec <= 10) npsScores.push(rec);
  }

  const hotspots: Hotspot[] = [...spots.values()]
    .map(({ who, names, ...h }) => {
      const where = [...names.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? h.where;
      const testersN = who.size;
      const score = h.blockers * SEVERITY_WEIGHT.blocker + h.slows * SEVERITY_WEIGHT.slows + h.cosmetic * SEVERITY_WEIGHT.cosmetic + (testersN - 1) * 3 + Math.min(h.minutes, 120) / 20;
      return { ...h, where, testers: testersN, score: Math.round(score * 10) / 10 };
    })
    .sort((a, b) => b.score - a.score || b.points - a.points);

  // Worst first: the share of "unclear" (and half of "OK"), then how many testers said so.
  const pages: PageStat[] = [...pageMap.values()]
    .map(({ times, ...p }) => {
      const sorted = times.sort((a, b) => a - b);
      return { ...p, secs: sorted.length ? Math.round(sorted[Math.floor(sorted.length / 2)]) : null, score: Math.round(((p.unclear + p.ok / 2) / p.n) * 100) / 100 };
    })
    .sort((a, b) => b.score - a.score || b.unclear - a.unclear || b.n - a.n);
  const lessons: LessonStat[] = [...lessonMap.values()]
    .map(({ examSum, ...l }) => ({ ...l, exam: l.examN ? Math.round((examSum / l.examN) * 10) / 10 : null }))
    .sort((a, b) => (a.exam ?? 6) - (b.exam ?? 6) || b.unclear - a.unclear);

  const promoters = npsScores.filter((x) => x >= 9).length;
  const detractors = npsScores.filter((x) => x <= 6).length;
  const nps = {
    score: npsScores.length ? Math.round(((promoters - detractors) / npsScores.length) * 100) : null,
    promoters,
    passives: npsScores.length - promoters - detractors,
    detractors,
    n: npsScores.length,
  };

  const result: Analysis = {
    testers: testers.length,
    modules,
    points,
    minutesLost,
    bySeverity,
    byKind,
    hotspots,
    pages,
    lessons,
    pageRatings,
    rubric,
    exam,
    leftSite,
    tools,
    verdict,
    verdictGaps,
    nps,
    leastReady,
    suggestions,
    actions: [],
  };
  result.actions = actionsFor(result);
  return result;
}

/** An ordered "what to fix first", from the strongest signals: blockers, repeats, the exam gap, low ratings. */
function actionsFor(a: Analysis): Action[] {
  const out: Action[] = [];
  for (const h of a.hotspots.filter((x) => x.blockers > 0).slice(0, 5)) {
    out.push({
      level: "high",
      text: `לתקן את ${h.where}`,
      why: `${h.blockers} דיווחי חוסם${h.testers > 1 ? `, אצל ${h.testers} ניסיינים` : ""}${h.minutes ? `, ${h.minutes} דקות אבדו` : ""}. ${topKind(h.kinds)}`,
    });
  }
  for (const h of a.hotspots.filter((x) => x.blockers === 0 && x.testers >= 2).slice(0, 3)) {
    out.push({ level: "high", text: `לבדוק את ${h.where}`, why: `${h.testers} ניסיינים נתקעו שם בנפרד. ${topKind(h.kinds)}` });
  }
  if (a.exam.notTaught.length) {
    out.push({ level: "high", text: "להשלים חומר שהבחינה דורשת והקורס לא מלמד", why: `${a.exam.notTaught.length} דיווחים בשאלה ״מה השאלה דרשה שהשיעור לא לימד״.` });
  }
  if (a.leftSite.length) {
    out.push({ level: "medium", text: "לבדוק למה ניסיינים יצאו מהאתר כדי להבין", why: `${a.leftSite.length} פעמים הניסיינים חיפשו הסבר במקום אחר. כל פעם כזו היא הסבר שחסר באתר.` });
  }
  for (const p of a.pages.filter((x) => x.unclear >= 2).slice(0, 5)) {
    out.push({ level: "high", text: `לשכתב את המסך ״${p.title}״ (${p.lesson})`, why: `${p.unclear} מתוך ${p.n} ניסיינים סימנו ״לא ברור״. ${topTags(p.tags)}` });
  }
  for (const p of a.pages.filter((x) => x.unclear === 1 || (x.unclear === 0 && x.ok >= 2)).slice(0, 4)) {
    out.push({
      level: "medium",
      text: `לבדוק את המסך ״${p.title}״ (${p.lesson})`,
      why: `${p.unclear ? "ניסיין סימן ״לא ברור״" : `${p.ok} ניסיינים סימנו רק ״בסדר״`}. ${topTags(p.tags)}`,
    });
  }
  for (const l of a.lessons.filter((x) => x.exam !== null && x.exam < 3.5).slice(0, 3)) {
    out.push({ level: "medium", text: `לחזק את התרגול ברמת בחינה ב${l.lesson}`, why: `ממוצע ${l.exam} מתוך 5 ב״אוכל לפתור שאלת בחינה בנושא״ (${l.examN} ניסיינים).` });
  }
  if (a.exam.taughtSimpler.length) {
    out.push({ level: "medium", text: "להעלות את רמת התרגול לרמת הבחינה", why: `${a.exam.taughtSimpler.length} דיווחים שהשיעור לימד את הנושא, אבל ברמה פשוטה מהבחינה.` });
  }
  const answer = (a.tools.helped["רק נתן תשובה"] ?? 0) as number;
  if (answer >= 2) out.push({ level: "medium", text: "לגרום לכלים להסביר את הדרך, לא רק לתת תוצאה", why: `${answer} פעמים ענו שהכלי ״רק נתן תשובה״.` });
  for (const h of a.hotspots.filter((x) => x.blockers === 0 && x.testers < 2 && x.slows > 0).slice(0, 3)) {
    out.push({ level: "low", text: `לשפר את ${h.where}`, why: `${h.slows} דיווחי ״מאט״. ${topKind(h.kinds)}` });
  }
  return out;
}

function topTags(tags: Record<string, number>) {
  const top = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  return top.length ? `בעיקר: ${top.map(([k]) => tagLabel(k)).join(", ")}.` : "";
}

function topKind(kinds: Record<string, number>) {
  const top = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0];
  return top && top[0] !== "unknown" ? `בעיקר: ${label("stuckType", top[0])}.` : "";
}

export const severityLabel = (v: string) => (v === "unknown" ? "לא סומן" : label("severity", v));
export const kindLabel = (v: string) => (v === "unknown" ? "לא סומן" : label("stuckType", v));

/**
 * Everything, ready to paste into Claude: what to do with it, the reading above, and every
 * tester's full answers. Plain Markdown, so it also works as a file.
 */
export function forClaude(a: Analysis, testers: TesterInput[]) {
  const lines: string[] = [
    "# ניתוח משוב ניסיינים — AfikAccounting",
    "",
    "אני בונה אתר ללימוד חשבונאות לסטודנטים בישראל. ניסיינים למדו בו לקראת מבחן אמיתי ומילאו טופס משוב: כל מסך בשיעור דורג בנפרד (ברור / בסדר / לא ברור, עם סיבות והערה), בסוף כל שיעור ״אוכל לפתור שאלת בחינה בנושא?״ (1–5) והדבר האחד לשנות, ולכל מודול גם מחוון חופשי (מצוין / לשיפור / עמוס מדי / חסר), נקודות היתקעות (סוג: הבנה / פער בחינה / ממשק / תקלה; חומרה: חוסם / מאט / קוסמטי), שאלות על הכלים, והשוואה בין השיעור לרמת הבחינה. בסוף: האם אפשר להגיע לרמת בחינה רק מהאתר, וציון המלצה 0–10.",
    "",
    "## מה אני מבקש",
    "1. **תמות:** קבץ את כל מה שנאמר לתמות (לא לפי ניסיין). לכל תמה: כמה ניסיינים העלו אותה, כמה חמורה, וציטוט מייצג אחד.",
    "2. **סיבת שורש:** לכל תמה, מה כנראה הסיבה (הסבר חסר, תרגול ברמה נמוכה מהבחינה, ממשק מבלבל, תקלה טכנית) ומה מבדיל בין סימפטום לסיבה.",
    "3. **פעולות:** רשימה מסודרת לפי השפעה חלקי מאמץ. לכל פעולה: מה בדיוק לשנות, איפה (שיעור / מסך / כלי), ואיך אדע שזה עבד.",
    "4. **פער הבחינה:** מה הבחינה דורשת שהקורס עוד לא מכסה, לפי נושא.",
    "5. **מה לא לגעת בו:** מה עובד טוב ולכן אסור לשבור.",
    "6. **סתירות ואותות חלשים:** איפה ניסיינים לא מסכימים, ומה עלה רק פעם אחת אבל נשמע חשוב.",
    "כתוב בעברית, בלי הקדמות, והפרד בין מה שהנתונים מראים לבין מה שאתה משער.",
    "",
    "## סיכום מספרי (חושב אוטומטית)",
    `- ניסיינים: ${a.testers} · מודולים שתועדו: ${a.modules} · נקודות היתקעות: ${a.points} · דקות שאבדו: ${a.minutesLost}`,
    `- לפי חומרה: ${Object.entries(a.bySeverity).map(([k, v]) => `${severityLabel(k)} ${v}`).join(", ") || "—"}`,
    `- לפי סוג: ${Object.entries(a.byKind).map(([k, v]) => `${kindLabel(k)} ${v}`).join(", ") || "—"}`,
    `- דירוגי מסכים: ${a.pageRatings} (${a.pages.length} מסכים שונים)`,
    `- מוכנות לבחינה בסוף שיעור (ממוצע מתוך 5): ${a.lessons.filter((l) => l.exam !== null).map((l) => `${l.lesson}: ${l.exam}`).join(" · ") || "—"}`,
    `- אפשר להגיע לרמת בחינה רק מהאתר? ${Object.entries(a.verdict).map(([k, v]) => `${k}: ${v}`).join(", ") || "—"}`,
    `- NPS: ${a.nps.score ?? "—"} (${a.nps.n} תשובות)`,
    "",
    "### מוקדי היתקעות (מדורגים)",
    ...(a.hotspots.length
      ? a.hotspots.slice(0, 15).map((h) => `- ${h.where}: ${h.points} דיווחים, ${h.testers} ניסיינים, חוסם ${h.blockers} / מאט ${h.slows} / קוסמטי ${h.cosmetic}, ${h.minutes} דק׳`)
      : ["- אין"]),
    "",
    "### המסכים שדורגו הכי נמוך",
    ...(a.pages.some((p) => p.score > 0)
      ? a.pages
          .filter((p) => p.score > 0)
          .slice(0, 20)
          .map(
            (p) =>
              `- ${p.lesson} · ${p.title}: לא ברור ${p.unclear} / בסדר ${p.ok} / ברור ${p.clear}${Object.keys(p.tags).length ? ` · ${Object.entries(p.tags).map(([k, v]) => `${tagLabel(k)} ${v}`).join(", ")}` : ""}`,
          )
      : ["- אין"]),
    "",
    "## התשובות המלאות של כל ניסיין",
    "",
  ];
  for (const t of testers) {
    lines.push(`---`, "", `# ניסיין: ${t.label}`, "", toMarkdown(t.state).replace(/^# .*\n/, ""), "");
  }
  return lines.join("\n");
}
