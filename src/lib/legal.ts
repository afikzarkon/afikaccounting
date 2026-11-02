/**
 * Who stands behind the site, for the terms, the privacy policy and the
 * accessibility statement. Every legal page reads these from here.
 */

// ⚠️ PLACEHOLDERS — the owner fills in the real details. Until LEGAL_DETAILS_FINAL
// is true, every legal page shows a note that the details are being completed.
export const LEGAL_DETAILS_FINAL = false;

export const legal = {
  /** The legal name of the business or the person who runs the site. */
  owner: "[שם בעל האתר / שם העסק]",
  /** עוסק מורשה / ח.פ. */
  businessId: "[מספר עוסק / ח.פ.]",
  address: "[כתובת למשלוח דואר]",
  /** Where readers write about anything on these pages. */
  email: "[כתובת אימייל ליצירת קשר]",
  /** רכז/ת הנגישות — named in the accessibility statement, as the regulations require. */
  accessibilityContact: { name: "[שם רכז/ת הנגישות]", email: "[אימייל לפניות נגישות]", phone: "[טלפון]" },
  /** The district whose courts hear disputes. */
  jurisdiction: "[מחוז, למשל: תל אביב-יפו]",
  /** The date each page was last changed; update it with the text. */
  updated: { terms: "2 בנובמבר 2026", privacy: "2 בנובמבר 2026", accessibility: "2 בנובמבר 2026" },
};

export const LEGAL_LINKS = [
  { href: "/terms", label: "תנאי שימוש" },
  { href: "/privacy", label: "מדיניות פרטיות" },
  { href: "/accessibility", label: "הצהרת נגישות" },
];
