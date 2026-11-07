/**
 * A lesson's address. Its own module, free of lesson data: browser code imports it from here, since
 * importing it from "@/lib/study" would ship every course's lessons with it.
 */
export const studyHref = (slug: string) => `/study/${slug}`;
