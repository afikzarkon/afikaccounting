import { withLtrFormulas } from "../ias19/ltr";
import { CONTROL } from "./lessons/control";
import { WHAT } from "./lessons/what";

/** The consolidated statements course; every formula in its practice reads left to right. */
export const CONSOLIDATED_LESSONS = [WHAT, CONTROL].map(withLtrFormulas);
