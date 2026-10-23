export const site = {
  name: "AfikAccounting",
  tagline: "מנוע החשבונאות והכספים של הדור הבא",
  description:
    "פתרונות חשבונאיים מבוססי תקינה — פקודות יומן, לוחות סילוקין ובאורים — לצד שיעורי וידאו של מומחים ב-IFRS ובמיסוי ישראלי.",
  nav: [
    { href: "/", label: "ראשי" },
    { href: "/engine", label: "מחשבונים חכמים" },
    {
      label: "לימוד תקנים",
      title: "IAS 16 · רכוש קבוע",
      items: [
        { href: "/ias16-lab", label: "רכוש קבוע מהקל לקשה", description: "דרכים לפתור שאלה, יסודות, סימולטור פחת וטיפים" },
        { href: "/ias16-lab/exchange", label: "החלפת נכסים", description: "שלושה שלבים, פקודות יומן ומחשבון החלפה" },
        { href: "/ias16-lab/renovation", label: "שיפוצים ואירועים עוקבים", description: "נכנס לנכס או הוצאה, דוגמאות בכל השיטות ומחשבון" },
      ],
    },
    { href: "/content", label: "מרכז התוכן" },
    { href: "/about", label: "אודות" },
  ],
} as const;
