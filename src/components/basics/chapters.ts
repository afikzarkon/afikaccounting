import type { ChapterLink } from "./chapter-nav";

/** The page's chapters, in order. A chapter's number is its place here, so the nav, the headings and the prev/next links always agree. */
export const CHAPTERS: ChapterLink[] = [
  { id: "what", title: "מהי חשבונאות" },
  { id: "entity", title: "ישות נפרדת" },
  { id: "types", title: "חמשת סוגי החשבונות" },
  { id: "equation", title: "הזהות החשבונאית" },
  { id: "expense", title: "הוצאה מול השקעה" },
  { id: "double", title: "רישום כפול ופקודת יומן" },
  { id: "lab", title: "פקודות יומן לפי סוגיהן" },
  { id: "credit", title: "עסקאות באשראי" },
  { id: "loan", title: "הלוואה: קבלה, פירעון וריבית" },
  { id: "taccounts", title: "כרטיסי T" },
  { id: "trial", title: "מאזן בוחן" },
  { id: "retained", title: "עודפים" },
  { id: "reports", title: "מאזני, תוצאתי ודוחות" },
  { id: "accrual", title: "בסיס מצטבר והתאמות" },
  { id: "inventory", title: "מלאי סגירה" },
  { id: "creditloss", title: "הפסדי אשראי" },
  { id: "worksheet", title: "גיליון רב-טורי" },
  { id: "practice", title: "תרגול" },
  { id: "summary", title: "סיכום וכלי עזר" },
];

export const chapterIndex = (id: string) => {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  if (i < 0) throw new Error(`Unknown chapter ${id}`);
  return i;
};
