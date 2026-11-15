"""Write src/lib/study/ias19/videos.ts: each IAS 19 video's chapters, from the slide timings (videos/ias19-<v>/spans.txt).
Only videos that are rendered (ias19-<v>.mp4 exists) are written; Bunny ids already in the file are kept.
usage: python -I gen_ias19_chapters.py"""
import re, subprocess, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))).replace(os.sep, '/')
TS = f'{ROOT}/src/lib/study/ias19/videos.ts'
# video → (lesson files whose screen titles to use, [(slide id, screen id)])
VIDEOS = {
    '4a': (['measure'], [('hook', 'emp-measure-hook'), ('puc-units', 'emp-measure-puc'), ('assume', 'emp-measure-assume'),
                         ('rate-which', 'emp-measure-rate'), ('recipe', 'emp-measure-recipe'), ('template', 'emp-measure-template'),
                         ('solved-story', 'emp-measure-solved'), ('group-story', 'emp-measure-together')]),
    '4b': (['attribute'], [('hook-gym', 'emp-attr-hook'), ('formula-rule', 'emp-attr-formula'), ('cap', 'emp-attr-cap'),
                           ('dual-rule', 'emp-attr-dual'), ('rule', 'emp-attr-rule'), ('template', 'emp-attr-template'),
                           ('solved-story', 'emp-attr-solved'), ('together-jump', 'emp-attr-together')]),
    '5a': (['rollforward'], [('hook-bank', 'emp-roll-hook'), ('lines', 'emp-roll-lines'), ('rates-timeline', 'emp-roll-rates'),
                             ('paid-idea', 'emp-roll-paid'), ('rule', 'emp-roll-rule'), ('where', 'emp-roll-where'),
                             ('template', 'emp-roll-template'), ('solved-story', 'emp-roll-solved')]),
    '5b': (['amend'], [('hook', 'emp-amend-hook'), ('past-what', 'emp-amend-what'), ('split-year', 'emp-amend-split'),
                       ('settle', 'emp-amend-settle'), ('rule', 'emp-amend-rule'), ('cto-story', 'emp-amend-solved'),
                       ('exit-settle', 'emp-amend-together')]),
    '6a': (['assets', '../index'], [('hook', 'emp-assets-hook'), ('qualify', 'emp-assets-qualify'), ('net', 'emp-assets-what'),
                                    ('ceiling', 'emp-assets-ceiling'), ('reimburse', 'emp-assets-reimburse'), ('mfr', 'emp-assets-mfr'),
                                    ('rule', 'emp-assets-rule'), ('solved-story', 'emp-assets-solved'), ('together-1', 'emp-assets-together')]),
    '6b': (['present'], [('hook', 'emp-present-hook'), ('three-pl', 'emp-present-three'), ('reverse-rate', 'emp-present-reverse'),
                         ('rule', 'emp-present-rule'), ('solved-story', 'emp-present-solved'), ('policy', 'emp-present-together')]),
    '3': (['dc'], [('hook', 'emp-dc-hook'), ('what', 'emp-dc-what'), ('two-story', 'emp-dc-two'), ('test', 'emp-dc-test'),
                   ('record-rule', 'emp-dc-record'), ('template-check', 'emp-dc-template'), ('solved-calc', 'emp-dc-solved'),
                   ('insurer', 'emp-dc-together')]),
    # drafted before recording — check each slide id still starts its screen once spans.txt exists
    '1': (['map', 'toolkit'], [('why-salary', 'emp-map-why'), ('groups', 'emp-map-welcome'), ('principle-story', 'emp-map-principle'),
                               ('types-short', 'emp-map-types'), ('ladder', 'emp-map-ladder'), ('sort-1', 'emp-map-sort'),
                               ('tool-hook', 'emp-tool-hook'), ('tool-fv', 'emp-tool-fv'), ('tool-pv', 'emp-tool-pv'),
                               ('tool-part', 'emp-tool-part'), ('tool-roll', 'emp-tool-roll')]),
    '2': (['short'], [('hook-avi', 'emp-short-hook'), ('absence-kinds', 'emp-short-absence'), ('vest-kinds', 'emp-short-vest'),
                      ('daycost', 'emp-short-daycost'), ('lifo', 'emp-short-lifo'), ('fifo', 'emp-short-fifo'), ('steps', 'emp-short-map'),
                      ('classify', 'emp-short-classify'), ('opening-a', 'emp-short-opening'), ('payments', 'emp-short-payments'),
                      ('closing', 'emp-short-closing'), ('movement', 'emp-short-movement'), ('traps', 'emp-short-traps'),
                      ('bonus-conditions', 'emp-short-bonus')]),
    '7': (['other'], [('hook-award', 'emp-other-hook'), ('olt-def', 'emp-other-olt'), ('kinds', 'emp-other-kinds'),
                      ('disability', 'emp-other-disability'), ('template', 'emp-other-template'), ('solved-story', 'emp-other-solved'),
                      ('term-def', 'emp-other-term'), ('term-test', 'emp-term-test'), ('term-when', 'emp-term-when'),
                      ('term-measure', 'emp-other-rule'), ('term-template', 'emp-term-template'), ('together-task', 'emp-other-together')]),
    '8': (['exams'], [('exam-day', 'emp-exam-hook'), ('scan', 'emp-exam-scan'), ('order', 'emp-exam-order'), ('q1-assembly', 'emp-exam-a'),
                      ('asm-table', 'emp-exam-a-solve'), ('fld-table', 'emp-exam-a-field'), ('sheet-recipe', 'emp-cheatsheet')]),
}

old = open(TS, encoding='utf8').read() if os.path.exists(TS) else ''
m = re.search(r'const BUNNY_IDS: Record<string, string> = \{(.*?)\};', old, re.S)
ids = dict(re.findall(r'"?(\w+)"?: "([0-9a-f-]+)"', m.group(1))) if m else {}

out = []
for v, (files, mapping) in VIDEOS.items():
    mp4 = f'{ROOT}/videos/ias19-{v}/ias19-{v}.mp4'
    if not os.path.exists(mp4):
        continue
    titles = {}
    for f in files:
        titles.update(re.findall(r'\{ id: "([^"]+)", title: "([^"]+)"', open(f'{ROOT}/src/lib/study/ias19/lessons/{f}.ts', encoding='utf8').read()))
    spans = dict((a.split('=')[0], float(a.split('=')[1])) for a in open(f'{ROOT}/videos/ias19-{v}/spans.txt').read().split())
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).decode())
    chapters = [(0, 'פתיחה', None)] + [(round(spans[s]), titles[sc], sc) for s, sc in mapping] + [(round(spans['summary']), 'סיכום', None)]
    assert [c[0] for c in chapters] == sorted(c[0] for c in chapters), v
    lines = '\n'.join(f'      {{ at: {at}, title: "{t}"' + (f', screen: "{sc}"' if sc else '') + ' },' for at, t, sc in chapters)
    out.append(f'  "{v}": {{\n    duration: {round(dur)},\n    chapters: [\n{lines}\n    ],\n  }},')

body = ''.join(f'\n  "{k}": "{ids[k]}",' for k in sorted(ids))
ts = f'''import type {{ LessonVideo }} from "../types";

/**
 * The IAS 19 course's recorded videos, hosted on Bunny Stream. Lessons 4–6 have two
 * videos each ("4a", "4b"), split where the lesson's part ב׳ starts; the others one.
 * Each chapter starts where its slide starts in the recording; a chapter that
 * names a screen is offered on that screen too.
 */
const BUNNY_LIBRARY = "808661";

/** Each video's id in the Bunny library; a video without one is not shown. */
const BUNNY_IDS: Record<string, string> = {{{body}
}};

const RECORDINGS: Record<string, Omit<LessonVideo, "src" | "title" | "part">> = {{
{chr(10).join(out)}
}};

const PARTS: Record<number, [string, string][]> = {{
  4: [["4a", "חלק א׳"], ["4b", "חלק ב׳"]],
  5: [["5a", "חלק א׳"], ["5b", "חלק ב׳"]],
  6: [["6a", "חלק א׳"], ["6b", "חלק ב׳"]],
}};

/** Lesson `n`'s videos that are on Bunny, in order; none before. */
export function ias19Videos(n: number, title: string): LessonVideo[] {{
  const parts = PARTS[n] ?? [[String(n), ""]];
  return parts.flatMap(([key, part]) => {{
    const id = BUNNY_IDS[key];
    const rec = RECORDINGS[key];
    if (!id || !rec) return [];
    return [{{ src: `https://iframe.mediadelivery.net/embed/${{BUNNY_LIBRARY}}/${{id}}`, title, ...(part ? {{ part }} : {{}}), ...rec }}];
  }});
}}
'''
open(TS, 'w', encoding='utf8', newline='\n').write(ts)
print('ok', list(ids), [o.split('"')[1] for o in out])
