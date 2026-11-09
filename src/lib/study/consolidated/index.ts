import { withLtrFormulas } from "../ias19/ltr";
import { ACQUISITION } from "./lessons/acquisition";
import { CONTROL } from "./lessons/control";
import { GOODWILL } from "./lessons/goodwill";
import { RETURNS } from "./lessons/returns";
import { WHAT } from "./lessons/what";
import { WORKSHEET } from "./lessons/worksheet";

/** The consolidated statements course; every formula in its practice reads left to right. */
export const CONSOLIDATED_LESSONS = [WHAT, CONTROL, RETURNS, ACQUISITION, GOODWILL, WORKSHEET].map(withLtrFormulas);
