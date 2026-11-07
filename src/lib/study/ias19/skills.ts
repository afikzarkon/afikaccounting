import type { Ias19Slug } from "./shared";

/** "What you need to know": the eleven skills every question of the course is solved with, and the lessons that teach each. */
export const SKILLS: { skill: string; does: string; lessons: Ias19Slug[] }[] = [
  { skill: "סיווג", does: "מחליטים לאיזה מארבעת הסוגים ההטבה שייכת, ובהטבה לאחר סיום העסקה: הפקדה מוגדרת או הטבה מוגדרת", lessons: ["ias19-map", "ias19-dc"] },
  { skill: "ערך נוכחי וריבית חלקית", does: "מהוונים סכום עתידי, ומחשבים ריבית על חלק משנה בריבית דריבית", lessons: ["ias19-map"] },
  { skill: "מעגל ו-P.N.", does: "פתיחה + שינויים = סגירה, והפער שנשאר הוא ה-P.N.", lessons: ["ias19-map", "ias19-rollforward"] },
  { skill: "הטבות לזמן קצר", does: "היעדרויות (נצברת, מבשילה, LIFO) ובונוסים לפי נוסחה", lessons: ["ias19-short"] },
  { skill: "מדידה בנקודת זמן", does: "הטבה שנתית × שנות שירות × עובדים צפויים ÷ (1+i)ⁿ", lessons: ["ias19-measure"] },
  { skill: "ייחוס ההטבה", does: "נוסחת ההטבה מול קו ישר, תקרה, תנאי זכאות", lessons: ["ias19-measure"] },
  { skill: "ריבית ו-n נכונים לכל רכיב", does: "מחליטים לכל שורה במעגל באיזו ריבית ובכמה שנים לחשב", lessons: ["ias19-rollforward"] },
  { skill: "אירועים באמצע שנה", does: "פיצול תקופות, שירות עבר, סילוק מול עזיבה בלתי צפויה", lessons: ["ias19-rollforward"] },
  { skill: "נכסי תכנית ותקרת נכס", does: "מעגל נכסים נפרד, התחייבות נטו, הגבלת הנכס", lessons: ["ias19-assets"] },
  { skill: "הצגה והנדסה לאחור", does: "מה הולך לרווח והפסד, מה ל-OCI, מה למאזן; חילוץ שיעורים מביאור", lessons: ["ias19-assets"] },
  { skill: "הטבות אחרות לזמן ארוך ופיטורין", does: "אותה מדידה בלי OCI; מועד ההכרה בפיטורין", lessons: ["ias19-other"] },
];
