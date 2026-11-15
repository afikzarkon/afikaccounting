"""Shift a transcription made on the raw joined clips onto the cleaned track from clean_join.py.

usage: python -I remap_words.py <scribe.json> <offsets.json> <out.json> <old_start1> <old_start2> ...
old_startN = where clip N began in the audio that was transcribed.
Also reports any word that the trim cut into (it must lie inside its clip's kept range).
"""
import json, sys

src, offs, out, *old = sys.argv[1:]
d = json.load(open(src, encoding="utf-8"))
clips = json.load(open(offs, encoding="utf-8"))["clips"]
old = [float(x) for x in old]
sys.stdout.reconfigure(encoding="utf-8")
words, bad = [], 0
for w in d["words"]:
    if w.get("type") != "word":
        continue
    i = max(k for k in range(len(old)) if w["start"] >= old[k] - 0.05)
    c = clips[i]
    s, e = w["start"] - old[i] - c["trimmed_front"], w["end"] - old[i] - c["trimmed_front"]
    if s < -0.02 or e > c["length"] + 0.02:
        bad += 1
        print(f"clip {i+1}: word '{w['text']}' {s:.2f}–{e:.2f} outside kept 0–{c['length']:.2f}")
    words.append({**w, "start": round(c["start"] + s, 3), "end": round(c["start"] + e, 3)})
for i, c in enumerate(clips):
    ws = [w for w in d["words"] if w.get("type") == "word" and old[i] - 0.05 <= w["start"] < (old[i + 1] if i + 1 < len(old) else 1e9)]
    first, last = ws[0]["start"] - old[i] - c["trimmed_front"], ws[-1]["end"] - old[i] - c["trimmed_front"]
    print(f"clip {i+1}: speech {first:.2f}–{last:.2f} of kept {c['length']:.2f} (lead {first:.2f}s, tail {c['length'] - last:.2f}s)")
json.dump({**d, "words": words}, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print("words cut:", bad)
