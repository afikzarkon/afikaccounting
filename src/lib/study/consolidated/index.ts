import { withLtrFormulas } from "../ias19/ltr";
import { ACQUISITION } from "./lessons/acquisition";
import { CONTROL } from "./lessons/control";
import { GOODWILL } from "./lessons/goodwill";
import { RETURNS } from "./lessons/returns";
import { WHAT } from "./lessons/what";
import { WORKSHEET } from "./lessons/worksheet";
import { POLICY } from "./lessons/policy";
import { FINANCE } from "./lessons/finance";
import { IMPAIRMENT } from "./lessons/impairment";
import { INTERCOMPANY } from "./lessons/intercompany";
import { LEASEBONDS } from "./lessons/leasebonds";
import { HOLDING } from "./lessons/holding";

/** The consolidated statements course; every formula in its practice reads left to right. */
export const CONSOLIDATED_LESSONS = [WHAT, CONTROL, RETURNS, ACQUISITION, GOODWILL, WORKSHEET, POLICY, FINANCE, IMPAIRMENT, INTERCOMPANY, LEASEBONDS, HOLDING].map(withLtrFormulas);
