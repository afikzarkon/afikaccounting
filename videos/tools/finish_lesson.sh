#!/bin/bash
# usage: finish_lesson.sh N  — cuts (cuts.txt) → spans → align → render → encode, in videos/basicsN
set -e
N=$1; V=/c/Users/afik1/Desktop/AfikAccounting/videos; B=$V/basics$N
R=/c/Users/afik1/AppData/Local/Temp/claude/6ae09ff363016878/70580d38-a23d-45e5-bfb4-eb48958d9233/scratchpad/tools/render
F=$(dirname $R)/../frames$N
export PYTHONIOENCODING=utf-8
cd $B
python -I $V/tools/cut_audio.py lesson$N-clean.m4a scribe-lesson$N.json lesson$N-final.m4a scribe-lesson$N-final.json $(cat cuts.txt)
python -I $V/tools/spans.py scribe-lesson$N-final.json deck > spans.txt
python -I $V/tools/align.py scribe-lesson$N-final.json deck/slides cues-lesson$N.json $(cat spans.txt) > align.log
rm -rf $F; cd $R; node render.mjs $B/cues-lesson$N.json $B/deck/slides $B/deck/deck.json $F | tail -1
cd $F; ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i frames.txt -i $B/lesson$N-final.m4a -vf "fps=30,format=yuv420p" -c:v libx264 -crf 20 -tune stillimage -c:a copy -shortest -movflags +faststart $B/lesson$N.mp4
echo "lesson $N: $(ffprobe -v error -show_entries format=duration -of csv=p=0 $B/lesson$N.mp4)s"
