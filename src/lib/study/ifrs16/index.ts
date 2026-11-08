import { withLtrFormulas } from "../ias19/ltr";
import { CHANGES } from "./lessons/changes";
import { LESSOR } from "./lessons/lessor";
import { LESSOR_CHANGES } from "./lessons/lessor-changes";
import { MEASURE } from "./lessons/measure";
import { SUBSEQUENT } from "./lessons/subsequent";
import { SPECIAL } from "./lessons/special";
import { TERM } from "./lessons/term";
import { WHAT } from "./lessons/what";

/** The leases course. Each lesson joins as it is built; every formula in its practice reads left to right. */
export const IFRS16_LESSONS = [WHAT, TERM, MEASURE, SUBSEQUENT, CHANGES, LESSOR, LESSOR_CHANGES, SPECIAL].map(withLtrFormulas);
