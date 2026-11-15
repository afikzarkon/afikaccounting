"""Turn a readable retake spec into pairs.txt for make_cuts.py.
usage: python -I resolve_pairs.py <scribe.json> <spec.txt> > pairs.txt
spec line:  t0 word n | t1 word m     (n-th 'word' at/after t0 starts the cut; m-th 'word' at/after t1 is kept)
words are compared without punctuation (,.?!"-–) ; # comments ok"""
import json,sys,re
sys.stdout.reconfigure(encoding="utf-8")
W=[w for w in json.load(open(sys.argv[1],encoding="utf-8"))["words"] if w["type"]=="word"]
norm=lambda s:re.sub(r'[,.?!\-–—:;]','',s)
def find(t,word,n):
    c=0
    for w in W:
        if w["start"]>=t-0.05 and norm(w["text"])==word:
            c+=1
            if c==n: return w["start"]
    sys.exit(f"not found: {t} {word} {n}")
for l in open(sys.argv[2],encoding="utf-8"):
    l=l.split("#")[0].strip()
    if not l: continue
    a,b=[x.split() for x in l.split("|")]
    print(f"{find(float(a[0]),a[1],int(a[2])):.3f} {find(float(b[0]),b[1],int(b[2])):.3f}")
