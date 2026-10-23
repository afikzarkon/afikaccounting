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
      items: [{ href: "/ias16-lab", label: "IAS 16", description: "רכוש קבוע — מהקל לקשה" }],
    },
    { href: "/content", label: "מרכז התוכן" },
    { href: "/about", label: "אודות" },
  ],
} as const;
