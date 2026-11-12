import "server-only";
import type { Values } from "@/lib/engine/types";
import { effectiveTier } from "@/lib/access";
import { parseBlocks, parseSteps } from "@/lib/exams/parse";
import type { ExamBlock, ExamMeta, SolutionStep } from "@/lib/exams/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin reads. They run as the signed-in user, so the database's admin policies
 * (`public.is_admin()`) decide what comes back; pages also call requireAdmin().
 */

/** Postgres / PostgREST codes for "this table or function doesn't exist yet". */
const MISSING = new Set(["42P01", "42883", "PGRST202", "PGRST205"]);
export class SetupRequiredError extends Error {}
function check<T>(res: { data: T | null; error: { code?: string; message: string } | null }): T {
  if (res.error) {
    if (res.error.code && MISSING.has(res.error.code)) throw new SetupRequiredError(res.error.message);
    throw new Error(res.error.message);
  }
  return res.data as T;
}

// ---- analytics -------------------------------------------------------------

export type DailyPoint = { day: string; pageViews: number; calcRegular: number; calcSolve: number; downloads: number; videoPlays: number; sessions: number };
export type Analytics = {
  totals: { events: number; sessions: number; pageViews: number; calcRuns: number; downloads: number; videoPlays: number; presetLoads: number };
  daily: DailyPoint[];
  calculators: { slug: string; runs: number; regular: number; solve: number; ok: number; failed: number; invalid: number }[];
  solver: { regularOk: number; regularFailed: number; regularInvalid: number; solveOk: number; solveFailed: number; solveInvalid: number };
  presets: { loads: number; runsFromPreset: number; runs: number };
  topPresets: { id: string; title: string | null; count: number }[];
  downloads: { url: string; title: string | null; kind: string | null; count: number }[];
  videoSources: { source: string; count: number }[];
  videos: { slug: string; title: string | null; source: string | null; count: number }[];
  modules: { module: string; count: number; sessions: number }[];
  pages: { path: string; count: number }[];
  timing: { samples: number; avgMs: number | null; p95Ms: number | null };
};
export type StorageUse = { kind: string; source: string; files: number; bytes: number }[];

/** Every dashboard figure since `days` days ago, aggregated in the database. */
export async function getAnalytics(days: number): Promise<Analytics> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const supabase = await createClient();
  return check(await supabase.rpc("admin_analytics", { since }));
}

export async function getStorageUse(): Promise<StorageUse> {
  const supabase = await createClient();
  return check(await supabase.rpc("admin_storage"));
}

// ---- media -------------------------------------------------------------------

export type MediaKind = "excel" | "pdf" | "video" | "image" | "other";
export type MediaSource = "upload" | "youtube" | "vimeo";
export type MediaAsset = {
  id: string;
  kind: MediaKind;
  source: MediaSource;
  title: string;
  description: string;
  url: string;
  storagePath: string | null;
  mimeType: string | null;
  sizeBytes: number;
  category: string;
  module: string;
  tags: string[];
  createdAt: string;
};

export async function listMedia(): Promise<MediaAsset[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("media_assets")
      .select("id, kind, source, title, description, url, storage_path, mime_type, size_bytes, category, module, tags, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    source: r.source,
    title: r.title,
    description: r.description,
    url: r.url,
    storagePath: r.storage_path,
    mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes),
    category: r.category,
    module: r.module,
    tags: r.tags ?? [],
    createdAt: r.created_at,
  }));
}

// ---- presets -------------------------------------------------------------------

export type AdminPreset = {
  id: string;
  calculatorSlug: string;
  title: string;
  description: string;
  inputs: Values;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: string;
};

export async function listPresetsAdmin(): Promise<AdminPreset[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("scenario_presets")
      .select("id, calculator_slug, title, description, inputs, sort_order, is_published, updated_at")
      .order("calculator_slug")
      .order("sort_order"),
  );
  return rows.map((r) => ({
    id: r.id,
    calculatorSlug: r.calculator_slug,
    title: r.title,
    description: r.description,
    inputs: r.inputs,
    sortOrder: r.sort_order,
    isPublished: r.is_published,
    updatedAt: r.updated_at,
  }));
}

// ---- settings ------------------------------------------------------------------

export async function listAdmins(): Promise<{ id: string; fullName: string; createdAt: string }[]> {
  const supabase = await createClient();
  const rows = check(await supabase.from("profiles").select("id, full_name, created_at").eq("role", "admin").order("created_at"));
  return rows.map((r) => ({ id: r.id, fullName: r.full_name, createdAt: r.created_at }));
}

/**
 * Run admin loads; null means the admin migration hasn't been applied yet, so
 * the page can show setup instructions. Any other failure propagates.
 */
export async function unlessSetupRequired<T>(load: Promise<T>): Promise<T | null> {
  try {
    return await load;
  } catch (e) {
    if (e instanceof SetupRequiredError) return null;
    throw e;
  }
}

// ---- subscriptions -------------------------------------------------------------

export type AdminSubscription = {
  userId: string;
  email: string;
  fullName: string;
  tier: "courses" | "exams";
  status: string;
  periodEnd: string | null;
  provider: string;
  updatedAt: string;
  /** No longer opens anything: canceled, unpaid, or past its end date. */
  ended: boolean;
};
export type AdminSubscriptions = {
  subscriptions: AdminSubscription[];
  /** Accounts that signed up from a paid plan's button, without a plan yet. */
  interested: { userId: string; email: string; plan: "courses" | "exams"; createdAt: string }[];
  waitlist: { email: string; topic: string; createdAt: string }[];
};

/** Every plan with its account, the accounts waiting on one, and the updates list. */
export async function listSubscriptions(): Promise<AdminSubscriptions> {
  const supabase = await createClient();
  const [subs, waitlist] = await Promise.all([
    supabase.rpc("admin_subscriptions"),
    supabase.from("waitlist").select("email, topic, created_at").order("created_at", { ascending: false }).limit(200),
  ]);
  const data = check<{ subscriptions: Omit<AdminSubscription, "ended">[]; interested: AdminSubscriptions["interested"] }>(subs);
  const now = new Date();
  return {
    ...data,
    subscriptions: data.subscriptions.map((s) => ({ ...s, ended: effectiveTier([{ tier: s.tier, status: s.status, current_period_end: s.periodEnd }], now) === "free" })),
    waitlist: check(waitlist).map((w) => ({ email: w.email, topic: w.topic, createdAt: w.created_at })),
  };
}

// ---- shared accounts ------------------------------------------------------------

export type DeviceAlert = {
  userId: string;
  email: string;
  fullName: string;
  devices: number;
  countries: number;
  signIns: number;
  lastAt: string;
  labels: string[];
  countryList: string[];
};

/** Accounts signed in from three or more devices, or two countries, in the window: possibly shared or resold. */
export async function listDeviceAlerts(days = 30): Promise<DeviceAlert[]> {
  const supabase = await createClient();
  const rows = check<DeviceAlert[]>(await supabase.rpc("admin_device_alerts", { p_days: days }));
  return rows.map((r) => ({ ...r, devices: Number(r.devices), countries: Number(r.countries), signIns: Number(r.signIns), labels: r.labels ?? [], countryList: r.countryList ?? [] }));
}

// ---- site visibility -------------------------------------------------------------

/** What is hidden or renamed now, read fresh for the admin's switches (not from the cache). */
export async function listVisibility(): Promise<{ hidden: Record<string, boolean>; labels: Record<string, string> }> {
  const supabase = await createClient();
  const rows = check<{ key: string; hidden: boolean; label: string | null }[]>(await supabase.from("site_visibility").select("key, hidden, label"));
  return {
    hidden: Object.fromEntries(rows.filter((r) => r.hidden).map((r) => [r.key, true])),
    labels: Object.fromEntries(rows.filter((r) => r.label).map((r) => [r.key, r.label as string])),
  };
}

// ---- watermark lookup -------------------------------------------------------------

export type MarkMatch = {
  id: string;
  fullName: string;
  createdAt: string;
  signIns: { device: string; country: string; at: string }[];
};

/**
 * The accounts whose id starts with a watermark's 8 hex digits (lib/watermark.ts):
 * one, almost always. The uuid range is exactly the ids with that prefix.
 */
export async function findByMarkCode(hex: string): Promise<MarkMatch[]> {
  const supabase = await createClient();
  const profiles = check<{ id: string; full_name: string; created_at: string }[]>(
    await supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .gte("id", `${hex}-0000-0000-0000-000000000000`)
      .lte("id", `${hex}-ffff-ffff-ffff-ffffffffffff`)
      .limit(5),
  );
  // Recent sign-ins, when the single-session migration has run; without it, none.
  const { data: signIns } = profiles.length
    ? await supabase.from("sign_ins").select("user_id, device, country, created_at").in("user_id", profiles.map((p) => p.id)).order("created_at", { ascending: false }).limit(20)
    : { data: [] };
  return profiles.map((p) => ({
    id: p.id,
    fullName: p.full_name,
    createdAt: p.created_at,
    signIns: (signIns ?? []).filter((x) => x.user_id === p.id).map((x) => ({ device: x.device, country: x.country, at: x.created_at })),
  }));
}

// ---- exams -------------------------------------------------------------------

export type AdminExamRow = ExamMeta & { hasSteps: boolean; updatedAt: string };
export type AdminExam = ExamMeta & {
  questionPath: string | null;
  solution: { question: ExamBlock[]; steps: SolutionStep[]; video: string | null; videoSeconds: number; solutionPath: string | null };
};

const EXAM_COLUMNS = "id, topic, year, session, title, description, subjects, question_path, is_sample, published, updated_at";
type ExamRow = { id: string; topic: string; year: number; session: string; title: string; description: string; subjects: string[]; question_path: string | null; is_sample: boolean; published: boolean; updated_at: string };
const examMeta = (r: ExamRow): ExamMeta => ({
  id: r.id,
  topic: r.topic,
  year: r.year,
  session: r.session,
  title: r.title,
  description: r.description,
  subjects: r.subjects ?? [],
  hasPaper: !!r.question_path,
  isSample: r.is_sample,
  published: r.published,
});

/** Every exam, drafts too, with whether its solution has steps yet. */
export async function listExamsAdmin(): Promise<AdminExamRow[]> {
  const supabase = await createClient();
  const [exams, solutions] = await Promise.all([
    supabase.from("exams").select(EXAM_COLUMNS).order("updated_at", { ascending: false }).limit(1000),
    supabase.from("exam_solutions").select("exam_id, steps").limit(1000),
  ]);
  const withSteps = new Set(check(solutions).filter((s) => Array.isArray(s.steps) && s.steps.length).map((s) => s.exam_id));
  return check(exams).map((r: ExamRow) => ({ ...examMeta(r), hasSteps: withSteps.has(r.id), updatedAt: r.updated_at }));
}

export async function getExamAdmin(id: string): Promise<AdminExam | null> {
  const supabase = await createClient();
  const [exam, solution] = await Promise.all([
    supabase.from("exams").select(EXAM_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("exam_solutions").select("question, steps, video, video_seconds, solution_path").eq("exam_id", id).maybeSingle(),
  ]);
  const r = check(exam) as ExamRow | null;
  if (!r) return null;
  const s = check(solution);
  return {
    ...examMeta(r),
    questionPath: r.question_path,
    solution: {
      question: parseBlocks(s?.question),
      steps: parseSteps(s?.steps),
      video: s?.video ?? null,
      videoSeconds: s?.video_seconds ?? 0,
      solutionPath: s?.solution_path ?? null,
    },
  };
}

// ---- growth funnel -------------------------------------------------------------

export type FunnelSteps = { entered: number; answered: number; activated: number; signedUp: number; returned: number; paywall: number; plan: number; checkout: number; paid: number };
export type Funnel = {
  funnel: FunnelSteps;
  newVisitors: number;
  sources: { source: string; visitors: number; answered: number; activated: number; signedUp: number; paid: number }[];
  daily: { day: string; entries: number; learners: number; signups: number; payments: number }[];
  weekly: { week: string; learners: number }[];
  retention: { week: string; size: number; d1: number; d7: number; d30: number }[];
  habits: { reviewSessions: number; reviewers: number; studiers: number; examGoals: number; emailVisits: number; groups: number; groupMembers: number; remindersOn: number };
  streaks: { s1: number; s2: number; s4: number; s8: number };
  shares: { clicks: number; byKind: Record<string, number>; visits: number; visitsSignedUp: number };
  checks: { started: number; completed: number; avgRight: number | null; byCourse: { course: string; started: number; completed: number }[] };
  /** Exam mode runs; absent until the revised function is applied. */
  exams?: { started: number; completed: number; timed: number; avgShare: number | null; byCourse: { course: string; started: number; completed: number }[] };
  lessons: { slug: string; starts: number; learners: number; answers: number; firstTries: number; firstTryRight: number; traps: number; trapFalls: number }[];
  traps: { slug: string; id: string; answers: number; falls: number }[];
  paywalls: { gate: string; views: number; clicks: number }[];
};

/** The growth dashboard for the last `days` days, and the same length of time before it (for the change). */
export async function getFunnel(days: number, source?: string): Promise<{ now: Funnel; before: Funnel; asOf: number }> {
  const supabase = await createClient();
  const end = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const [now, before] = await Promise.all([
    supabase.rpc("admin_funnel", { since: iso(end - days * 86_400_000), until: iso(end), p_source: source ?? null }),
    supabase.rpc("admin_funnel", { since: iso(end - 2 * days * 86_400_000), until: iso(end - days * 86_400_000), p_source: source ?? null }),
  ]);
  return { now: check(now) as Funnel, before: check(before) as Funnel, asOf: end };
}

// ---- ambassadors ---------------------------------------------------------------

export type AmbassadorRow = { code: string; entered: number; answered: number; activated: number; signedUp: number; paid: number };

/** What each ?ref= link brought in: browsers that first came through it in the last `days` days, and what they did since. */
export async function getAmbassadors(days: number): Promise<AmbassadorRow[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return check(await supabase.rpc("admin_ambassadors", { since })) as AmbassadorRow[];
}

// ---- experiments ---------------------------------------------------------------

export type VariantResult = { variant: string; visitors: number; answered: number; activated: number; signedUp: number; paid: number };

/** Each experiment's variants over the last `days` days (lib/experiments.ts). Empty before the experiments migration. */
export async function getExperiments(days: number, ids: string[]): Promise<Record<string, VariantResult[]>> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const rows = await Promise.all(ids.map(async (id) => [id, (await supabase.rpc("admin_experiment", { p_exp: id, since })).data ?? []] as const));
  return Object.fromEntries(rows) as Record<string, VariantResult[]>;
}

// ---- accounts: approval and course access ---------------------------------------

export type AdminUser = {
  userId: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt: string | null;
  /** Topic ids from the catalog. */
  courses: string[];
};

/** Every account with its approval and the courses granted to it; pending ones first. */
export async function listUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  return check<AdminUser[]>(await supabase.rpc("admin_users"));
}

// ---- tester feedback -----------------------------------------------------------

export type TesterFeedbackRow = { userId: string; name: string; answers: unknown; createdAt: string; updatedAt: string };

/** Every tester's feedback form (public.tester_feedback), newest change first, with the tester's name. */
export async function getTesterFeedback(): Promise<TesterFeedbackRow[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase.from("tester_feedback").select("user_id, answers, created_at, updated_at").order("updated_at", { ascending: false }).limit(500),
  ) as { user_id: string; answers: unknown; created_at: string; updated_at: string }[];
  const ids = rows.map((r) => r.user_id);
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const names = new Map((people ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name ?? ""]));
  return rows.map((r) => ({ userId: r.user_id, name: names.get(r.user_id) ?? "", answers: r.answers, createdAt: r.created_at, updatedAt: r.updated_at }));
}

export type TesterRow = { userId: string; email: string; fullName: string; addedAt: string; lastFeedbackAt: string | null };

/** The accounts marked as testers, with their emails and when they last wrote feedback. */
export async function listTesters(): Promise<TesterRow[]> {
  const supabase = await createClient();
  return check(await supabase.rpc("admin_testers")) as TesterRow[];
}
