"""Clean each slide's recording and join them into one narration track.

usage: python -I clean_join.py <out.m4a> <out_offsets.json> <file1> <file2> ...
  (one recording per slide, in slide order)

Per clip: mono, rumble/hum removal (high-pass + 50 Hz notch), light FFT denoise,
trim to the speech (silence detected on the cleaned audio) with a short lead and tail,
soft fades. Clips are joined with a fixed pause; then one loudness pass over the whole.
offsets.json: per clip, where it starts in the joined track and how much was trimmed
from its front (to shift word times from an earlier transcription, if any).
"""
import json, re, subprocess, sys, os, tempfile

LEAD, TAIL, GAP, FADE = 0.45, 0.45, 0.20, 0.06
CLEAN = ("pan=mono|c0=.5*c0+.5*c1,aresample=48000,"
         "highpass=f=85:poles=2,highpass=f=85:poles=2,"
         "bandreject=f=50:width_type=h:w=6,bandreject=f=100:width_type=h:w=6,"
         "afftdn=nr=12:nf=-52:tn=1,"
         "agate=threshold=0.012:range=0.2:ratio=3:attack=5:release=200")

def run(args):
    return subprocess.run(["ffmpeg", "-hide_banner", "-y", *args], capture_output=True, text=True, encoding="utf-8", errors="replace")

def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(out.stdout.strip())

def speech_bounds(path, dur):
    """First and last non-silent moment of a cleaned clip."""
    err = run(["-i", path, "-af", "silencedetect=n=-42dB:d=0.15", "-f", "null", "-"]).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    first = ends[0] if starts and starts[0] < 0.05 and ends else 0.0
    last = starts[-1] if starts and (len(ends) < len(starts) or ends[-1] >= dur - 0.05) else dur
    return first, last

def main():
    out, offsets_path, *files = sys.argv[1:]
    tmp = tempfile.mkdtemp()
    parts, info, t = [], [], 0.0
    for i, f in enumerate(files):
        clean = os.path.join(tmp, f"c{i}.wav")
        run(["-i", f, "-af", CLEAN, clean])
        dur = duration(clean)
        first, last = speech_bounds(clean, dur)
        a, b = max(0.0, first - LEAD), min(dur, last + TAIL)
        seg = os.path.join(tmp, f"s{i}.wav")
        length = b - a
        run(["-i", clean, "-af", f"atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d={FADE},afade=t=out:st={length - FADE:.3f}:d={FADE}", seg])
        info.append({"file": os.path.basename(f), "start": round(t, 3), "trimmed_front": round(a, 3), "length": round(length, 3)})
        parts.append(seg)
        t += length + (GAP if i < len(files) - 1 else 0)
    # join with silent gaps, then one loudness pass
    inputs, chain = [], ""
    for i, p in enumerate(parts):
        inputs += ["-i", p]
        pad = f",apad=pad_dur={GAP}" if i < len(parts) - 1 else ""
        chain += f"[{i}:a]anull{pad}[p{i}];"
    chain += "".join(f"[p{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11[o]"
    r = run([*inputs, "-filter_complex", chain, "-map", "[o]", "-ar", "48000", "-c:a", "aac", "-b:a", "160k", out])
    if r.returncode:
        sys.exit(r.stderr[-2000:])
    json.dump({"total": round(t, 3), "clips": info}, open(offsets_path, "w", encoding="utf-8"), indent=1)
    for c in info:
        print(c)
    print("total", round(t, 3))

main()
