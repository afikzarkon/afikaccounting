"""Slide start times for a one-file lesson: the pause before each slide's first spoken word.

usage: python -I spans.py <scribe.json> <deck_dir>   → prints "id=sec id=sec ..." for align.py
"""
import json, re, subprocess, sys, os

scribe, deck = sys.argv[1:]
w = [x for x in json.load(open(scribe, encoding="utf-8"))["words"] if x["type"] == "word"]
out = subprocess.run([sys.executable, "-I", os.path.join(os.path.dirname(__file__), "retakes.py"), scribe, deck],
                     capture_output=True, text=True, encoding="utf-8").stdout
starts = re.findall(r"^(\S+) ([\d.]+) ", out.split("slide starts")[1], re.M)
args = []
for i, (sid, t) in enumerate(starts):
    t = float(t)
    if i == 0:
        args.append(f"{sid}=0"); continue
    k = min(range(len(w)), key=lambda j: abs(w[j]["start"] - t))
    # words said just before the first matched one (a paraphrased lead-in) belong to this slide
    while k > 0 and w[k]["start"] - w[k - 1]["end"] < 0.45 and t - w[k - 1]["start"] < 1.6:
        k -= 1
    pe, s = w[k - 1]["end"], w[k]["start"]
    args.append(f"{sid}={max(pe + 0.05, (pe + s) / 2, s - 0.6):.2f}")
print(" ".join(args))
