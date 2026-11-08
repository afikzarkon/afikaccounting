import assert from "node:assert/strict";
import { test } from "node:test";
import { dayOfDate, israelDay, reminderFor } from "./reminders";
import { mergeHabits, sanitizeHabits } from "./study/habits";

const base = { today: 20_000, days: [19_998], exams: {}, remindedOn: null, due: 0, courseName: (id: string) => (id === "ias16" ? "IAS 16" : id) };

test("no reason, no reminder; studied or reminded today, no reminder", () => {
  assert.equal(reminderFor(base), null);
  assert.equal(reminderFor({ ...base, due: 3, days: [20_000] }), null);
  assert.equal(reminderFor({ ...base, due: 3, remindedOn: 20_000 }), null);
});

test("due reviews remind, with the count", () => {
  const r = reminderFor({ ...base, due: 3 })!;
  assert.equal(r.subject, "3 שאלות מחכות לכם לחזרה");
  assert.equal(r.lines.length, 1);
});

test("an exam within two weeks reminds and comes first; a later or past one doesn't", () => {
  const date = (d: number) => new Date(d * 86_400_000).toISOString().slice(0, 10);
  const r = reminderFor({ ...base, due: 1, exams: { ias16: date(20_005) } })!;
  assert.equal(r.subject, "עוד 5 ימים למבחן ב־IAS 16");
  assert.equal(r.lines.length, 2);
  assert.equal(reminderFor({ ...base, exams: { ias16: date(20_030) } }), null);
  assert.equal(reminderFor({ ...base, exams: { ias16: date(19_990) } }), null);
  assert.equal(reminderFor({ ...base, exams: { ias16: date(20_000) } })!.subject, "היום המבחן ב־IAS 16");
});

test("israelDay turns over at Israel's midnight", () => {
  // 22:30 UTC on 1 Jan 2027 is already 00:30 on 2 Jan in Israel (UTC+2); 21:30 UTC is still the 1st.
  assert.equal(israelDay(new Date("2027-01-01T22:30:00Z")), dayOfDate("2027-01-02"));
  assert.equal(israelDay(new Date("2027-01-01T21:30:00Z")), dayOfDate("2027-01-01"));
});

test("habits are sanitized and merged: days joined, the browser's exam date wins", () => {
  assert.deepEqual(sanitizeHabits({ days: [3, 1, 3, -2, 1.5, "x"], exams: { ias16: "2027-01-20", "Bad Key": "2027-01-01", ias19: "soon" } }), { days: [1, 3], exams: { ias16: "2027-01-20" } });
  assert.deepEqual(mergeHabits({ days: [1, 2], exams: { ias16: "2027-01-20", ias2: "2027-02-01" } }, { days: [2, 3], exams: { ias16: "2027-01-25" } }), {
    days: [1, 2, 3],
    exams: { ias16: "2027-01-25", ias2: "2027-02-01" },
  });
});
