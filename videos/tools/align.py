"""Match the [N] cue markers in each slide's notes to the moment they were spoken.

usage: python -I align.py <scribe.json> <slides_dir> <out.json> <slide_id>=<start_sec> ...
Each slide runs from its start to the next slide's start (the last to the audio end).
A cue's time = start of the transcript word matched to the first script word after the marker.
"""
import json, re, sys, difflib, html

def norm(w):
    w = re.sub(r"[^\w֐-׿]", "", w)          # drop punctuation, quotes, gershayim
    w = re.sub(r"[֑-ׇ]", "", w)               # drop niqqud
    return w

def notes_of(path):
    s = open(path, encoding="utf-8").read()
    m = re.search(r"<aside>(.*?)</aside>", s, re.S)
    return html.unescape(m.group(1)) if m else ""

def script_tokens(text):
    """[(word or None, cue or None)] — a cue token marks the position before the next word."""
    out = []
    for tok in re.split(r"(\[\d+\])|\s+", text):
        if not tok:
            continue
        m = re.fullmatch(r"\[(\d+)\]", tok)
        if m:
            out.append((None, int(m.group(1))))
        elif norm(tok):
            out.append((norm(tok), None))
    return out

def main():
    scribe, slides_dir, out_path, *spans = sys.argv[1:]
    d = json.load(open(scribe, encoding="utf-8"))
    words = [w for w in d["words"] if w.get("type") == "word"]
    audio_end = words[-1]["end"]
    spans = [(s.split("=")[0], float(s.split("=")[1])) for s in spans]
    result = {"audio_end": audio_end, "slides": []}
    for i, (sid, start) in enumerate(spans):
        end = spans[i + 1][1] if i + 1 < len(spans) else audio_end + 0.8
        tw = [w for w in words if start - 0.05 <= w["start"] < end]
        toks = script_tokens(notes_of(f"{slides_dir}/{sid}.html"))
        sw = [t[0] for t in toks if t[0]]
        # index of each script word in toks → its position among words
        sm = difflib.SequenceMatcher(None, sw, [norm(w["text"]) for w in tw], autojunk=False)
        match = {}
        for a, b, n in sm.get_matching_blocks():
            for k in range(n):
                match[a + k] = b + k
        cues, wi, matched = [], 0, len(match)
        for word, cue in toks:
            if cue is not None:
                # first matched script word at or after this position
                j = next((k for k in range(wi, len(sw)) if k in match), None)
                t = tw[match[j]]["start"] if j is not None else end - 0.5
                anchor = sw[j] if j is not None else None
                if j != wi:
                    # the word right after the marker was misheard: take the spoken word that
                    # follows the last matched word before the marker, if it comes earlier
                    p = next((k for k in range(wi - 1, -1, -1) if k in match), None)
                    if p is not None and match[p] + 1 < len(tw) and tw[match[p] + 1]["start"] < t:
                        t, anchor = tw[match[p] + 1]["start"], "~" + tw[match[p] + 1]["text"]
                cues.append({"n": cue, "t": round(t - start, 2), "anchor": anchor})
            else:
                wi += 1
        first = tw[0]["start"] - start if tw else 0
        result["slides"].append({"id": sid, "start": start, "end": round(end, 3), "speech_from": round(first, 2),
                                 "matched_words": f"{matched}/{len(sw)}", "cues": cues})
    json.dump(result, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    sys.stdout.reconfigure(encoding="utf-8")
    for s in result["slides"]:
        print(s["id"], s["start"], "→", s["end"], "matched", s["matched_words"], [(c["n"], c["t"], c["anchor"]) for c in s["cues"]])

main()
