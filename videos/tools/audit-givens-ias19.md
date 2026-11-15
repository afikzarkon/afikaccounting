# Audit: can a student solve every IAS 19 exercise from what the screen shows?

We just found a real bug: in lesson 6 ("פותרים יחד", hotel chain), the solution multiplied by 30 grade-א employees, but the question's table only showed 35 (the 30.6 headcount). The 30 lived only in the code (EXAM_B) and inside the solution hint. A student working alone could not solve it. We fixed it by adding the missing column.

Your job: find every other place like that in your lesson. Read-only — do not edit any file.

## What counts as a bug

A question, quiz, task, worked example, booklet question, mastery check, exam, drill/generator template, or exercise where the solution (hint, answer, `why`, worked steps, or the code that computes the expected answer) uses a figure or fact that the student cannot get from:
- the question's own text, tables, stories and visuals as rendered on screen, or
- values the question explicitly asks the student to derive (unknowns found along the way are fine — e.g. extracting a rate from a note, or a balancing figure), or
- general course rules taught earlier (formulas, which rate to use, signs), or clearly stated earlier data that the question explicitly refers back to ("same company as before").

Also report:
- a given that is shown, but with a different value than the solution uses;
- a given that is ambiguous enough that two readings give different answers, where the solution silently picks one (e.g. date of an event not stated, "start of year" vs "end of year", which employees count);
- a multiple-choice question whose correct option cannot be reached from the stem.

Not bugs: style, wording you would phrase differently, rounding of ±1 that the site already notes.

## Where to look

Repo: C:\Users\afik1\Desktop\AfikAccounting.
- Course assembly: `src/lib/study/ias19/index.ts` (which screens and questions each lesson shows), `shared.ts`.
- Lesson data: `src/lib/study/ias19/lessons/*.ts` (quizzes `check`, `exercises`, `traps`, drills), `worked.ts`, `tools-worked.ts`.
- Numbers/solvers: `src/lib/learn/ias19*.ts`.
- Screens: `src/components/basics/ias19-*.tsx` — find each `emp-…` id; read what is rendered (story text, DataTable rows, visuals' props) and compare with what the hints/solutions/computed answers use. Follow every constant used in a solution back to whether it is rendered anywhere on that screen.
- Booklet questions `emp-bk-*`, exams `emp-mx-*` / `emp-exam-*`, drills/generators: check the template renders every input the answer uses.

You may run the site's code with `npx tsx` to see rendered values. You may open http://localhost:3005/study/<lesson-slug> (dev server already running; `?step=N` jumps to a screen) if it helps, but reading the code is usually enough.

## Report (English, concise)

For each bug: lesson + screen id (or question id), file:line, what the student is told, what the solution uses that is missing/different, and the smallest fix (e.g. "add 'עובדים ב-2024' column from EXAM_B.grades[].heads to the DataTable at file:line"). Then a one-line list of what you checked and found clean. If nothing is wrong, say so plainly.
