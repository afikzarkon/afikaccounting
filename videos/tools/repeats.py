"""List places where a run of 3+ words is said again within 25 s (a retake). usage: python -I repeats.py <scribe.json>
Repeated amounts ("אלף חמש מאות שקלים") give false positives: judge each one."""
# find spots where a run of >=3 words is said again within 20 s (speaker went back)
import json, re, sys
sys.stdout.reconfigure(encoding="utf-8")
W=[w for w in json.load(open(sys.argv[1],encoding="utf-8"))["words"] if w["type"]=="word"]
n=lambda s: re.sub(r"[^\w]","",s).replace("ה","",0)
T=[n(w["text"]) for w in W]
N=3; i=0; out=[]
while i < len(W)-N:
    best=None
    for j in range(i+N, len(W)-N):
        if W[j]["start"]-W[i]["start"]>25: break
        if T[i:i+N]==T[j:j+N] and T[i]:
            best=j; break
    if best:
        out.append((i,best)); i=best
    else: i+=1
ctx=lambda a,b:" ".join(w["text"] for w in W[a:b])
for i,j in out:
    print(f"{W[i]['start']:7.2f}-{W[j]['start']:7.2f} ({W[j]['start']-W[i]['start']:4.1f}s)  CUT[{ctx(i,j)}]  →KEEP[{ctx(j,j+10)}]   prev:{ctx(max(0,i-5),i)}")
