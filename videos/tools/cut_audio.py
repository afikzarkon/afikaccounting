"""Remove stretches (false starts, retakes, fillers) from a narration track and shift the transcript to match.

usage: python -I cut_audio.py <in.m4a> <scribe.json> <out.m4a> <out_scribe.json> <start-end> [<start-end> ...]
Each cut is removed with 15 ms fades on both sides. Words inside a cut are dropped; later words shift back.
"""
import json, subprocess, sys

src, scribe, out, out_scribe, *spans = sys.argv[1:]
cuts = sorted(tuple(map(float, s.split("-"))) for s in spans)
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout)
keep, t = [], 0.0
for a, b in cuts:
    keep.append((t, a)); t = b
keep.append((t, dur))
F = 0.015
parts = []
for i, (a, b) in enumerate(keep):
    L = b - a
    parts.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d={F},afade=t=out:st={L - F:.3f}:d={F}[k{i}]")
chain = ";".join(parts) + ";" + "".join(f"[k{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[o]"
r = subprocess.run(["ffmpeg", "-hide_banner", "-y", "-i", src, "-filter_complex", chain, "-map", "[o]", "-c:a", "aac", "-b:a", "160k", out], capture_output=True, text=True, encoding="utf-8", errors="replace")
if r.returncode:
    sys.exit(r.stderr[-1500:])

def shift(x):
    s = 0.0
    for a, b in cuts:
        if x >= b: s += b - a
        elif x > a: return None
    return round(x - s, 3)

d = json.load(open(scribe, encoding="utf-8"))
words = []
for w in d["words"]:
    s, e = shift(w["start"]), shift(w["end"])
    if s is None or e is None:
        continue
    words.append({**w, "start": s, "end": e})
json.dump({**d, "words": words}, open(out_scribe, "w", encoding="utf-8"), ensure_ascii=False)
sys.stdout.reconfigure(encoding="utf-8")
print(f"removed {sum(b - a for a, b in cuts):.2f}s in {len(cuts)} cuts; {len(d['words']) - len(words)} tokens dropped; new length {dur - sum(b - a for a, b in cuts):.2f}s")
