import { findScreenIn, screenHrefIn } from "../paths";
import { ATTRIBUTE } from "./lessons/attribute";
import { DC_LESSON } from "./lessons/dc";
import { MAP } from "./lessons/map";
import { MEASURE } from "./lessons/measure";
import { ROLLFORWARD } from "./lessons/rollforward";
import { SHORT } from "./lessons/short";
import { TOOLKIT } from "./lessons/toolkit";

/** The employee-benefits course: twelve lessons, in four stages — foundations, the simple benefits, the defined benefit chain (one lesson leaning on the one before), and the extensions with two exam-level questions. */
export const IAS19_LESSONS = [MAP, TOOLKIT, SHORT, DC_LESSON, MEASURE, ATTRIBUTE, ROLLFORWARD];

/** The lesson and index of a concept screen of the course, by its id. */
export const findIas19Screen = (id: string) => findScreenIn(IAS19_LESSONS, id);

/** Where a concept screen of the course lives. Throws on an unknown id. */
export const ias19ScreenHref = (id: string) => screenHrefIn(IAS19_LESSONS, id);
