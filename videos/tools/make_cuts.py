"""Turn retake pairs into cut ranges for cut_audio.py.
usage: python -I make_cuts.py <scribe.json> <pairs.txt>   (pairs.txt: one 'first_cut_word_start keep_word_start' per line, # comments ok)
Prints each cut's words to stderr for checking, and the cut ranges on stdout."""
import json,sys
sys.stdout.reconfigure(encoding="utf-8"); sys.stderr.reconfigure(encoding="utf-8")
W=[w for w in json.load(open(sys.argv[1],encoding="utf-8"))["words"] if w["type"]=="word"]
P=[tuple(map(float,l.split("#")[0].split())) for l in open(sys.argv[2],encoding="utf-8") if l.split("#")[0].strip()]
idx=lambda t:min(range(len(W)),key=lambda j:abs(W[j]["start"]-t))
out=[]
for a,b in P:
    i,k=idx(a),idx(b)
    pe=W[i-1]["end"]; fs=W[i]["start"]; le=W[k-1]["end"]; ks=W[k]["start"]
    s=min(pe+(fs-pe)/2, fs-0.02); e=max(ks-min((ks-le)/2,0.12), le+0.02)
    out.append(f"{s:.3f}-{e:.3f}")
    print(f"CUT[{' '.join(w['text'] for w in W[i:k])}]  KEEP-> {' '.join(w['text'] for w in W[k:k+6])}", file=sys.stderr)
print(" ".join(out))
