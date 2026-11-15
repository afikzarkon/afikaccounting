"""Replace each slide's <aside> narration from a JSON file {slide_id: text}; cue markers must stay the same.
usage: python -I set_notes.py <slides_dir> <notes.json>"""
import re, sys, json, pathlib, html
D = pathlib.Path(sys.argv[1])
N = json.load(open(sys.argv[2], encoding="utf-8"))
for sid, text in N.items():
    p = D / f"{sid}.html"
    s = p.read_text(encoding="utf-8")
    old = re.search(r"<aside>(.*?)</aside>", s, re.S).group(1)
    oc, nc = re.findall(r"\[\d+\]", old), re.findall(r"\[\d+\]", text)
    assert oc == nc, (sid, oc, nc)
    s = s.replace(f"<aside>{old}</aside>", f"<aside>{html.escape(text, quote=False)}</aside>")
    p.write_text(s, encoding="utf-8")
print("ok", len(N))
