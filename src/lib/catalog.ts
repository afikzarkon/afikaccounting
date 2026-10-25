/**
 * The site's map: every learning page and every calculator, in one place.
 *
 * The menu, the footer, the home page and the learning map are all built from
 * these lists, so a new page added here shows up everywhere at once. Kept free
 * of engine imports, because the menu ships to the browser; a test checks the
 * engine calculators listed here against the engine's own registry.
 */

export type CatalogLink = { href: string; label: string; description?: string };

export type Topic = {
  id: string;
  title: string;
  /** The standard, when the topic is one ("IAS 2"). */
  standard?: string;
  href: string;
  description: string;
  /** What is inside, in a few words each. */
  covers: string[];
  /** Sub-pages, when the topic spans several. */
  pages?: CatalogLink[];
  tools: CatalogLink[];
};

export type Stage = { id: string; step: number; title: string; lead: string; topics: Topic[] };

/** The learning path: foundations first, then the topics built on them, then the standards. */
export const LEARNING_PATH: Stage[] = [
  {
    id: "foundations",
    step: 1,
    title: "יסודות",
    lead: "למי שמתחיל מאפס: חובה וזכות, פקודות יומן ודוחות כספיים",
    topics: [
      {
        id: "basics",
        title: "חשבונאות מאפס",
        href: "/basics",
        description: "17 פרקים קצרים, מ״מה זה בכלל חשבונאות״ ועד גיליון רב-טורי עם התאמות סוף שנה.",
        covers: ["חובה וזכות", "פקודות יומן", "כרטיסי T", "מאזן בוחן", "דוחות כספיים", "התאמות סוף שנה"],
        tools: [
          { href: "/basics#lab", label: "פקודות יומן לפי סוגיהן" },
          { href: "/basics#practice", label: "15 שאלות תרגול" },
        ],
      },
    ],
  },
  {
    id: "topics",
    step: 2,
    title: "העמקה",
    lead: "נושאים שמופיעים כמעט בכל שאלת מבחן — כל אחד במדריך מלא",
    topics: [
      {
        id: "inventory",
        title: "מלאי",
        standard: "IAS 2",
        href: "/basics/inventory",
        description: "רישום תקופתי ותמידי, FIFO וממוצעים, שווי מימוש נטו, חילוץ נעלמים ושריפה.",
        covers: ["תקופתי ותמידי", "FIFO", "ממוצע משוקלל", "שמ״נ", "חילוץ נעלמים", "שריפה וביטוח"],
        tools: [{ href: "/basics/inventory#inv-calc", label: "מחשבון מלאי" }],
      },
      {
        id: "credit-losses",
        title: "הפסדי אשראי",
        href: "/basics/credit-losses",
        description: "ההפרשה להפסדי אשראי חזויים: מתווה 3 הכללים, שני כרטיסי T, וחילוץ נעלמים.",
        covers: ["לקוחות ברוטו ונטו", "הפרשה ספציפית וכללית", "חוב אבוד", "חוב שחזר"],
        tools: [{ href: "/basics/credit-losses#cl-tools", label: "מחשבון הפסדי אשראי" }],
      },
    ],
  },
  {
    id: "standards",
    step: 3,
    title: "תקנים",
    lead: "תקן אחר תקן, מהקל לקשה — עם הדרך לפתור כל סוג שאלה",
    topics: [
      {
        id: "ias16",
        title: "רכוש קבוע",
        standard: "IAS 16",
        href: "/ias16-lab",
        description: "עלות, פחת וכל מה שקורה לנכס אחר כך — על שאלה מרכזית אחת שעוברת בין הדפים.",
        covers: ["עלות הנכס", "שיטות פחת", "החלפה", "שיפוצים", "הערכה מחדש"],
        pages: [
          { href: "/ias16-lab", label: "יסודות ודרכים לפתור שאלה", description: "מושגים, תשעה שלבים, סימולטור פחת וטיפים" },
          { href: "/ias16-lab/exchange", label: "החלפת נכסים", description: "שלושה שלבים, פקודות יומן והמשך השנה" },
          { href: "/ias16-lab/renovation", label: "שיפוצים ואירועים עוקבים", description: "נכנס לנכס או הוצאה, ובכל שיטות הפחת" },
          { href: "/ias16-lab/revaluation", label: "מודל הערכה מחדש", description: "קרן הערכה מחדש, קרקע מול מבנה וטיפ הזהב" },
        ],
        tools: [
          { href: "/ias16-lab#simulator", label: "סימולטור פחת" },
          { href: "/ias16-lab/exchange#calculator", label: "מחשבון החלפה" },
          { href: "/ias16-lab/renovation#calculator", label: "מחשבון שיפוץ" },
          { href: "/ias16-lab/revaluation#calculator", label: "מחשבון הערכה מחדש" },
        ],
      },
    ],
  },
];

/** The solution engine's calculators (titles as in the engine registry). */
export const ENGINE_TOOLS: (CatalogLink & { slug: string; standard: string })[] = [
  { slug: "ifrs-16-leases", standard: "IFRS 16", href: "/engine?calc=ifrs-16-leases", label: "חכירות", description: "לוח סילוקין, נכס זכות שימוש ובאור" },
  { slug: "ias-16-property-plant-equipment", standard: "IAS 16", href: "/engine?calc=ias-16-property-plant-equipment", label: "רכוש קבוע", description: "ציר זמן מלא של נכס, עם פקודות ובאור" },
  { slug: "ias-37-provisions", standard: "IAS 37", href: "/engine?calc=ias-37-provisions", label: "הפרשות", description: "עץ ההחלטות, אומדן והיוון" },
  { slug: "corporate-tax-ias-12", standard: "IAS 12", href: "/engine?calc=corporate-tax-ias-12", label: "מס הכנסה על חברות", description: "מס שוטף, מסים נדחים והתאמה" },
];

/** Every calculator inside a learning page, in learning-path order. */
export const LEARNING_TOOLS: (CatalogLink & { topic: string })[] = LEARNING_PATH.flatMap((s) =>
  s.topics.flatMap((t) => t.tools.filter((x) => !x.href.startsWith("/basics#")).map((x) => ({ ...x, topic: t.standard ? `${t.standard} · ${t.title}` : t.title }))),
);

export const LEARN_HUB = { href: "/learn", label: "מפת הלימוד" };
export const ENGINE_HUB = { href: "/engine", label: "מנוע הפתרונות" };
