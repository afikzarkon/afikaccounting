"""Find where a one-file lesson recording strays from the script: false starts, repeated words, retaken sentences.

usage: python -I retakes.py <scribe.json> <deck_dir>
Prints each transcript stretch that does not match the script (with times and context), and each slide's
first matched word time (the slide starts). Retakes show up as an unmatched stretch whose words repeat
the matched words right after it.
"""
import json, re, sys, difflib, html, os

def norm(w):
    return re.sub(r"[֑-ׇ]", "", re.sub(r"[^\w֐-׿]", "", w))

scribe, deck = sys.argv[1:]
sys.stdout.reconfigure(encoding="utf-8")
words = [w for w in json.load(open(scribe, encoding="utf-8"))["words"] if w.get("type") == "word"]
order = json.load(open(os.path.join(deck, "deck.json"), encoding="utf-8"))["order"]
sw, owner = [], []
for i, sid in enumerate(order):
    s = open(os.path.join(deck, "slides", f"{sid}.html"), encoding="utf-8").read()
    notes = html.unescape(re.search(r"<aside>(.*?)</aside>", s, re.S).group(1))
    for t in re.sub(r"\[\d+\]", " ", notes).split():
        if norm(t):
            sw.append(norm(t)); owner.append(i)
tw = [norm(w["text"]) for w in words]
sm = difflib.SequenceMatcher(None, sw, tw, autojunk=False)
matched = set()
first = {}
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        matched.add(b + k)
        first.setdefault(owner[a + k], b + k)
print(f"script words {len(sw)}, spoken {len(tw)}, matched {len(matched)}")
print("\n== stretches not in the script ==")
j = 0
while j < len(tw):
    if j in matched:
        j += 1; continue
    k = j
    while k < len(tw) and k not in matched:
        k += 1
    if k - j >= 1:
        ctx_b = " ".join(w["text"] for w in words[max(0, j - 4):j])
        run = " ".join(w["text"] for w in words[j:k])
        ctx_a = " ".join(w["text"] for w in words[k:k + 6])
        print(f"{words[j]['start']:7.2f}-{words[k-1]['end']:7.2f}  …{ctx_b} [[{run}]] {ctx_a}…")
    j = k
print("\n== slide starts (first matched word) ==")
for i, sid in enumerate(order):
    b = first.get(i)
    print(sid, f"{words[b]['start']:.2f}" if b is not None else "?", words[b]["text"] if b is not None else "")
