import "server-only";
import type { ScreenContent } from "@/components/study-mode/shell";
import type { StudyModule } from "@/lib/study/types";
import { ADJUST_SCREENS } from "./adjust";
import { BOOKS_SCREENS } from "./books";
import { CHECKS_SCREENS } from "./checks";
import { CREDIT_SCREENS } from "./credit";
import { ENTRIES_SCREENS } from "./entries";
import { FINAL_SCREENS } from "./final";
import { IAS16_COURSE_SCREENS } from "./ias16-course";
import { IAS16_COURSE_MORE_SCREENS } from "./ias16-course-more";
import { IAS16_COURSE_NEW_SCREENS } from "./ias16-course-new";
import { IAS16_SCREENS } from "./ias16-screens";
import { IAS19_BASICS_SCREENS } from "./ias19-course";
import { IAS19_BOOKLET_SCREENS } from "./ias19-course-booklet";
import { IAS19_DB_SCREENS } from "./ias19-course-db";
import { IAS19_DB2_SCREENS } from "./ias19-course-db2";
import { IAS19_END_SCREENS } from "./ias19-course-end";
import { IAS19_SHORT_SCREENS } from "./ias19-course-short";
import { IAS19_SIMPLE_SCREENS } from "./ias19-course-simple";
import { IAS19_TOOLS_SCREENS } from "./ias19-course-tools";
import { CONSOLIDATED_BASICS_SCREENS } from "./consolidated-course";
import { CONSOLIDATED_ACQUISITION_SCREENS } from "./consolidated-course-acquisition";
import { CONSOLIDATED_CONTROL_SCREENS } from "./consolidated-course-control";
import { CONSOLIDATED_GOODWILL_SCREENS } from "./consolidated-course-goodwill";
import { CONSOLIDATED_RETURNS_SCREENS } from "./consolidated-course-returns";
import { CONSOLIDATED_WORKSHEET_SCREENS } from "./consolidated-course-worksheet";
import { CONSOLIDATED_POLICY_SCREENS } from "./consolidated-course-policy";
import { CONSOLIDATED_FINANCE_SCREENS } from "./consolidated-course-finance";
import { CONSOLIDATED_IMPAIRMENT_SCREENS } from "./consolidated-course-impairment";
import { CONSOLIDATED_INTERCOMPANY_SCREENS } from "./consolidated-course-intercompany";
import { CONSOLIDATED_LEASEBONDS_SCREENS } from "./consolidated-course-leasebonds";
import { CONSOLIDATED_HOLDING_SCREENS } from "./consolidated-course-holding";
import { IFRS16_BASICS_SCREENS } from "./ifrs16-course";
import { IFRS16_CHANGES_SCREENS } from "./ifrs16-course-changes";
import { IFRS16_EXAM_SCREENS } from "./ifrs16-course-exam";
import { IFRS16_LESSOR_SCREENS } from "./ifrs16-course-lessor";
import { IFRS16_LESSOR_CHANGES_SCREENS } from "./ifrs16-course-lessor-changes";
import { IFRS16_MEASURE_SCREENS } from "./ifrs16-course-measure";
import { IFRS16_SPECIAL_SCREENS } from "./ifrs16-course-special";
import { IFRS16_SUBSEQUENT_SCREENS } from "./ifrs16-course-subsequent";
import { IFRS16_TERM_SCREENS } from "./ifrs16-course-term";
import { ltrLeads } from "@/lib/study/ias19/ltr";
import { INTRO_SCREENS } from "./intro";
import { INVENTORY_SCREENS } from "./inventory";
import { COURSE_SCREENS } from "./inventory-course";
import { COURSE_EXAM_SCREENS } from "./inventory-course-exams";
import { EXAM_SCREENS } from "./inventory-exam";
import { METHOD_SCREENS } from "./inventory-methods";
import { LAB_SCREENS } from "./lab-chapter";
import { BOOKLET_SCREENS } from "./booklet-screens";
import { DRILL_SCREENS } from "./drill-screens";
import { EXAM_LESSON_SCREENS } from "./exam-screens";
import { PPE_SCREENS } from "./ppe";
import { REVIEW_SCREENS } from "./review";
import { YEAR_SCREENS } from "./year";

/** Every concept screen of every course, by id: the basics course, then inventory, then fixed assets, then employee benefits. */
const SCREENS: Record<string, ScreenContent> = {
  ...INTRO_SCREENS,
  ...ENTRIES_SCREENS,
  ...LAB_SCREENS,
  ...BOOKS_SCREENS,
  ...YEAR_SCREENS,
  ...CHECKS_SCREENS,
  ...ADJUST_SCREENS,
  ...PPE_SCREENS,
  ...DRILL_SCREENS,
  ...BOOKLET_SCREENS,
  ...EXAM_LESSON_SCREENS,
  ...REVIEW_SCREENS,
  ...CREDIT_SCREENS,
  ...FINAL_SCREENS,
  ...INVENTORY_SCREENS,
  ...METHOD_SCREENS,
  ...EXAM_SCREENS,
  ...COURSE_SCREENS,
  ...COURSE_EXAM_SCREENS,
  ...IAS16_SCREENS,
  ...IAS16_COURSE_SCREENS,
  ...IAS16_COURSE_MORE_SCREENS,
  ...IAS16_COURSE_NEW_SCREENS,
  // The employee-benefits course lays every formula in a plain-text lead out left to right.
  ...ltrLeads({ ...IAS19_BASICS_SCREENS, ...IAS19_TOOLS_SCREENS, ...IAS19_SIMPLE_SCREENS, ...IAS19_SHORT_SCREENS, ...IAS19_DB_SCREENS, ...IAS19_DB2_SCREENS, ...IAS19_END_SCREENS, ...IAS19_BOOKLET_SCREENS }),
  // The consolidated statements course, formulas laid out the same way.
  ...ltrLeads({ ...CONSOLIDATED_BASICS_SCREENS, ...CONSOLIDATED_CONTROL_SCREENS, ...CONSOLIDATED_RETURNS_SCREENS, ...CONSOLIDATED_ACQUISITION_SCREENS, ...CONSOLIDATED_GOODWILL_SCREENS, ...CONSOLIDATED_WORKSHEET_SCREENS, ...CONSOLIDATED_POLICY_SCREENS, ...CONSOLIDATED_FINANCE_SCREENS, ...CONSOLIDATED_IMPAIRMENT_SCREENS, ...CONSOLIDATED_INTERCOMPANY_SCREENS, ...CONSOLIDATED_LEASEBONDS_SCREENS, ...CONSOLIDATED_HOLDING_SCREENS }),
  // The leases course, formulas laid out the same way.
  ...ltrLeads({ ...IFRS16_BASICS_SCREENS, ...IFRS16_TERM_SCREENS, ...IFRS16_MEASURE_SCREENS, ...IFRS16_SUBSEQUENT_SCREENS, ...IFRS16_CHANGES_SCREENS, ...IFRS16_LESSOR_SCREENS, ...IFRS16_LESSOR_CHANGES_SCREENS, ...IFRS16_SPECIAL_SCREENS, ...IFRS16_EXAM_SCREENS }),
};

/** A lesson's concept screens, in its order. A screen listed in the lesson but missing here fails the build. */
export function screensFor(m: StudyModule): ScreenContent[] {
  return m.screens.map((s) => {
    const c = SCREENS[s.id];
    if (!c) throw new Error(`${m.slug}: no content for screen ${s.id}`);
    return c;
  });
}

/** Screens with content that no lesson lists — kept honest by the build. */
export function orphanScreens(modules: StudyModule[]) {
  const listed = new Set(modules.flatMap((m) => m.screens.map((s) => s.id)));
  return Object.keys(SCREENS).filter((id) => !listed.has(id));
}
