#!/bin/bash
# usage: finish_ias19.sh N   (N = 1, 2, 3, 4a, 4b, 5a, 5b, 6a, 6b, 7, 8)
# in videos/ias19-N: cuts.txt → cut audio → spans → align → render → encode
# expects lesson-clean.m4a and scribe-lesson.json there; renders from videos/tools (has node_modules)
set -e
N=$1; V=$(cd "$(dirname "$0")/.." && pwd); B=$V/ias19-$N
F=${TEMP:-/tmp}/ias19-frames-$N-$$
export PYTHONIOENCODING=utf-8
cd $B
python -I $V/tools/cut_audio.py lesson-clean.m4a scribe-lesson.json lesson-final.m4a scribe-lesson-final.json $(cat cuts.txt)
python -I $V/tools/spans.py scribe-lesson-final.json deck > spans.txt
python -I $V/tools/align.py scribe-lesson-final.json deck/slides cues.json $(cat spans.txt) > align.log
rm -rf $F; cd $V/tools; node render.mjs $B/cues.json $B/deck/slides $B/deck/deck.json $F | tail -1
cd $F; ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i frames.txt -i $B/lesson-final.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -crf 20 -tune stillimage -c:a copy -shortest -movflags +faststart $B/ias19-$N.mp4
cd $B; rm -rf $F
echo "ias19-$N: $(ffprobe -v error -show_entries format=duration -of csv=p=0 $B/ias19-$N.mp4)s"
