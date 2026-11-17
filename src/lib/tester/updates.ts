/** An update published to the testers (public.tester_updates). */
export type TesterUpdate = {
  id: string;
  /** The course it is about: only that course's testers see it. Null: every tester. */
  courseId: string | null;
  title: string;
  body: string;
  /** A page of the site the update is about, and the words on its button. */
  linkHref: string | null;
  linkLabel: string | null;
  createdAt: string;
};

/** An update as the admin sees it: how many of the testers it was meant for have seen it. */
export type AdminTesterUpdate = TesterUpdate & { seen: number; audience: number };

/**
 * Whether changes found in the lessons may be published or skipped from this copy of the site:
 * only the live site, whose lessons are the ones testers see. A local copy holds work not yet up.
 */
export const canDecideHere = () => process.env.VERCEL_ENV === "production";
