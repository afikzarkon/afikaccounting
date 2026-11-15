"""Print a Scribe transcript as lines split at pauses > 0.6 s, each with its start time.
usage: python -I transcript_lines.py <scribe.json> > transcript.txt"""
import json,sys
sys.stdout.reconfigure(encoding="utf-8")
W=[w for w in json.load(open(sys.argv[1],encoding="utf-8"))["words"] if w["type"]=="word"]
line=[];st=W[0]["start"]
for i,w in enumerate(W):
    if line and w["start"]-W[i-1]["end"]>0.6:
        print(f"{st:7.2f} | "+" ".join(line)); line=[];st=w["start"]
    line.append(w["text"])
print(f"{st:7.2f} | "+" ".join(line))
