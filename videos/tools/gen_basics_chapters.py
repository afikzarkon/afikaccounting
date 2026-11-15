"""Write src/lib/study/basics/videos.ts: each basics lesson's video chapters, from the slide timings (videos/basicsN/spans.txt)."""
import re, subprocess

ROOT = 'C:/Users/afik1/Desktop/AfikAccounting'
LESSONS = [
    ('intro', 'basics-intro', [('language', 'language'), ('standard', 'grammar'), ('pipeline', 'landscape'), ('itai-pl', 'what'), ('entity', 'entity'), ('types', 'types')]),
    ('double-entry', None, [('equation', 'equation'), ('expense-question', 'expense'), ('double-rule', 'double'), ('lab-intro', 'lab'), ('credit-rule', 'credit'), ('advances-customer', 'advances'), ('split-purchase', 'advance-split'), ('checks-kinds', 'checks'), ('loan-run', 'loan'), ('actions-terms', 'actions')]),
    ('books', None, [('t-stages', 'taccounts'), ('trial-what', 'trial'), ('retained-what', 'retained'), ('reports-split', 'reports'), ('carry-rule', 'carry')]),
    ('year', None, [('method-a', 'year-method'), ('noga-1', 'year-example'), ('ofek-3', 'year-case'), ('ofek-tb', 'year-tb'), ('next-rules', 'year-next')]),
    ('adjust', None, [('accrual-matching', 'accrual'), ('prepaid-case', 'prepaid'), ('accrued-case', 'accrued'), ('unearned-case', 'unearned'), ('receivable-case', 'receivable'), ('odd-month-1', 'odd-month'), ('interest-period', 'interest-period'), ('inventory-cogs', 'inventory'), ('ppe-idea', 'ppe-idea'), ('ppe-straight', 'ppe-straight'), ('ppe-accum', 'ppe-accum'), ('ppe-sell-steps', 'ppe-sell'), ('shachar-tb', 'adj-example')]),
    ('review', None, [('method', 'rev-method'), ('contract-states-1', 'rev-contract'), ('multi-formulas', 'rev-multiyear'), ('ppe-intro', 'rev-ppe'), ('fix-intro', 'rev-fix'), ('profit', 'rev-profit'), ('gilad-tb', 'rev-booklet')]),
    ('credit', None, [('idea-pinkas', 'cl-idea'), ('net', 'cl-net'), ('allowance-entry', 'cl-allowance'), ('terms', 'cl-terms'), ('einav-sales', 'cl-entries'), ('method', 'cl-method'), ('extract', 'cl-extract'), ('erez-given', 'cl-first'), ('scen-c-q', 'cl-scenarios'), ('moria-given', 'cl-specific'), ('nevo-given', 'cl-booklet'), ('carmel-given', 'cl-exam')]),
    ('final', None, [('ws-columns', 'worksheet'), ('ws-given', 'ws-question'), ('rimon-a-b', 'ws-solve'), ('almog-intro', 'ws-exam')]),
]

out = []
for n, (file, _, mapping) in enumerate(LESSONS, 1):
    src = open(f'{ROOT}/src/lib/study/basics/{file}.ts', encoding='utf8').read()
    titles = dict(re.findall(r'\{ id: "([^"]+)", title: "([^"]+)"', src))
    spans = dict((a.split('=')[0], float(a.split('=')[1])) for a in open(f'{ROOT}/videos/basics{n}/spans.txt').read().split())
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{ROOT}/videos/basics{n}/lesson{n}.mp4']).decode())
    chapters = [(0, 'פתיחה', None)]
    for slide, screen in mapping:
        chapters.append((round(spans[slide]), titles[screen], screen))
    chapters.append((round(spans['summary']), 'סיכום', None))
    assert [c[0] for c in chapters] == sorted(c[0] for c in chapters), n
    lines = []
    for at, title, screen in chapters:
        lines.append(f'      {{ at: {at}, title: "{title}"' + (f', screen: "{screen}"' if screen else '') + ' },')
    out.append(f'  {n}: {{\n    duration: {round(dur)},\n    chapters: [\n' + '\n'.join(lines) + '\n    ],\n  },')

ts = f'''import type {{ LessonVideo }} from "../types";

/**
 * The basics course's recorded lessons, hosted on Bunny Stream (lesson 9 has none).
 * Each chapter starts where its slide starts in the recording; a chapter that
 * names a screen is offered on that screen too.
 */
const BUNNY_LIBRARY = "";

/** Each lesson's video id in the Bunny library, by lesson number; a lesson without one shows no video. */
const BUNNY_IDS: Record<number, string> = {{}};

const RECORDINGS: Record<number, Omit<LessonVideo, "src" | "title">> = {{
{chr(10).join(out)}
}};

/** Lesson `n`'s video, once it is on Bunny; none before. */
export function basicsVideos(n: number, title: string): LessonVideo[] {{
  const id = BUNNY_IDS[n];
  const rec = RECORDINGS[n];
  if (!BUNNY_LIBRARY || !id || !rec) return [];
  return [{{ src: `https://iframe.mediadelivery.net/embed/${{BUNNY_LIBRARY}}/${{id}}`, title, ...rec }}];
}}
'''
open(f'{ROOT}/src/lib/study/basics/videos.ts', 'w', encoding='utf8', newline='\n').write(ts)
print('ok')
