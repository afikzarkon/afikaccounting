# IAS 19 own-voice videos: handoff to another computer

> **למשתמש:** פותחים את Claude Code במחשב שבו נמצאות ההקלטות, בתיקיית הפרויקט, ואומרים לו:
> "תקרא את videos/HANDOFF-ias19.md ותמשיך משם. ההקלטות נמצאות ב-Downloads."
> לפני כן מעתיקים למחשב הזה את שני קבצי המפתחות (ראו "Keys" למטה). Claude לא יכול להעביר אותם, ואסור לו לראות אותם.

This file is everything a Claude session needs to finish the remaining videos of the "הטבות עובד" (IAS 19) course
on a computer where the user's recordings are. Read it all before starting.

## Where things stand (2026-11-15)

| Video | Status |
|---|---|
| 1, 2, 3, 4a, 4b, 5a, 5b, 6a, 6b, 7 | **Done and live on the site.** Do not touch. (1, 2 and 7 finished 2026-11-15.) |
| 8 | Not recorded yet. Deck and script are ready. |

Lessons 4–6 are each split into two videos, "a" and "b". Lessons 1, 2, 7 and 8 are one video each.

## Working with the user

- Explain in Hebrew, short and clear. Write human Hebrew, not chatbot phrasing.
- The user said (2026-11-14) **not to ask for approvals right now.** Transcribe, upload, commit and push without asking.
  Report what was done afterwards: number of cuts, seconds removed, final length, and anything that sounded like a slip.
- Work on Opus.
- Finish one video completely before starting the next.
- **Never print, echo or ask for the API keys.** Read them only inside a command, as the commands below do.

## Setup on a new computer

1. `git fetch --all`, then make sure local `main` has the newest of `origin/main` and `vercel/main`.
   This file and all the tools arrive through git.
2. The tools in `videos/tools/` need:
   - Python 3 (standard library only)
   - Node and Git Bash
   - ffmpeg and ffprobe on PATH
   - Google Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`. If it is elsewhere, edit the path in `render.mjs`, line 37.

   Then run once:
   ```
   cd videos/tools && npm install
   ```
   This installs puppeteer-core, which uses the system Chrome.
3. **Keys.** The user copies them by hand to these exact paths:
   - `C:\Users\afik1\elevenlabs-key.txt` (ElevenLabs, Speech to Text only)
   - `C:\Users\afik1\bunny-key.txt` (Bunny Stream library 808661)

   If a file is missing, tell the user which one to copy. Never ask for the key text.
4. The scripts find the repo from their own location, so the repo can be in any folder.
   Two exceptions:
   - `bunny_upload_ias19.py` reads the Bunny key path above.
   - The Scribe curl below reads the ElevenLabs key path above.

## What is in the repo for each video

- `videos/ias19-<n>/deck/`: the slide deck. `deck.json` has the slide `order`. `slides/<id>.html` has each slide, with the script in its `<aside>` notes and silent cue markers `[1]`, `[2]`… for each element that animates in.
- **The deck folder is the source of truth.** It was edited by hand, so never regenerate it.
- `videos/scripts-ias19.html`: the script page the user reads from while recording. If you change any notes, rebuild it with `node videos/tools/build_scripts_ias19.js`.
- Audio, transcripts and mp4 files are **not** in git. They stay local in `videos/ias19-<n>/`.

## The pipeline for one video (example: video 1)

All commands run from the repo root in Git Bash, with `export PYTHONIOENCODING=utf-8`. `B=videos/ias19-1`.

### 1. Find and identify the recording
Copy the file from Downloads to `$B/raw.m4a`. File names can be garbled. Confirm which lesson it is from the first words of
the transcript in step 3. Video 1 opens with lesson 1's welcome and the "goals" slide.

### 2. Clean (before transcribing)
```
python -I videos/tools/clean_join.py $B/lesson-clean.m4a $B/offsets.json $B/raw.m4a
```
This runs mono, high-pass, a 50 Hz notch, a light denoise, a soft gate and loudnorm to -16 LUFS.

### 3. Transcribe with ElevenLabs Scribe
```
cd $B && curl -s -X POST https://api.elevenlabs.io/v1/speech-to-text \
  -H "xi-api-key: $(tr -d '\r\n ' < /c/Users/afik1/elevenlabs-key.txt)" \
  -F model_id=scribe_v1 -F language_code=heb -F timestamps_granularity=word \
  -F file=@lesson-clean.m4a -o scribe-lesson.json && cd -
python -I videos/tools/transcript_lines.py $B/scribe-lesson.json > $B/transcript.txt
```
Check that `scribe-lesson.json` has a `words` array. If it holds an error instead, show the user the error message (it contains no key).

### 4. Cut retakes: the part that needs judgment
Read **all** of `transcript.txt`. It has one line per stretch between pauses longer than 0.6 s, each with its start time. Compare it with the
script (the slide notes) and find every place the user went back.

**The user's rules:**
- When a sentence was started again, of any length and including 3–4 attempts, **keep only the LAST take**.
- **Never keep a wrong word the user repeated.**
- Cut false starts, broken-off words such as "מוגד…" before "מוגדרת", and fillers.
- A paraphrase that differs from the script but was said **once** stays.
- Scribe sometimes glues a stutter into one token, such as "ש-וחוזה". That cannot be cut at word level, so leave it.

Write `$B/spec.txt` with one cut per line:
```
t0 word n | t1 word m
```
The cut starts at the n-th occurrence of `word` at or after time t0. Speech resumes at the m-th occurrence of `word` at or after t1.
Words are compared without punctuation, and `#` starts a comment. Real examples from video 3:
```
81.02 וזה 1 | 98.70 וזה 1        # whole sentence retaken: cut from the first "וזה" to the last take's "וזה"
171.82 חופשה 1 | 171.82 חופשה 2   # word said twice: cut the first
277.56 מוגד 1 | 277.56 מוגדרת 1   # broken-off word
338.16 שאלה 2 | 356.30 שאלה 1    # several takes of one sentence, chained
```
Then:
```
python -I videos/tools/resolve_pairs.py $B/scribe-lesson.json $B/spec.txt > $B/pairs.txt
python -I videos/tools/make_cuts.py $B/scribe-lesson.json $B/pairs.txt > $B/cuts.txt
```
`make_cuts.py` prints every cut as `CUT[...] KEEP->...` to stderr. **Read all of it.** Each CUT must be only the bad take, and each
KEEP must continue the sentence naturally. Fix `spec.txt` and rerun until it reads right. Earlier videos had 19–34 cuts each.

`videos/tools/repeats.py` lists repeated 3-word runs. It can serve as a second check, but it gives false positives on repeated amounts.

### 5. Cut, time, render and encode
```
bash videos/tools/finish_ias19.sh 1
```
This runs `cut_audio.py` (cuts the audio and shifts the transcript), `spans.py` (slide starts), `align.py` (cue times, written to `cues.json`, with a log in
`align.log`), `render.mjs` (frames) and ffmpeg (libx264 crf 20), and writes `$B/ias19-1.mp4`. It takes a few minutes, so run it in the background.

**Check:**
- `align.log`: each slide line says `matched x/y`. A low ratio means the user strayed from the script there, so look at that slide.
- `spans.txt`: slide times should increase steadily, with no slide of zero length.

Optionally, extract a frame or two with ffmpeg at a cue time to confirm that slide and audio line up.

### 6. Chapters on the site
`videos/tools/gen_ias19_chapters.py` maps slides to lesson screens. Each chapter starts where its slide starts, and the site shows a
"בסרטון · m:ss" button on that screen. **Maps for videos 1, 2, 7 and 8 are already drafted** in the `VIDEOS` dict. They were
checked against the decks and the lesson files. Run:
```
python -I videos/tools/gen_ias19_chapters.py
```
This rewrites `src/lib/study/ias19/videos.ts`. Only videos whose mp4 exists are included, and existing Bunny ids are kept.
The script asserts that chapter times increase.

### 7. Upload to Bunny
```
python -I videos/tools/bunny_upload_ias19.py 1
```
This creates the video in library 808661, uploads the mp4 and writes its GUID into `videos.ts`. A video that already has an id is skipped.

Check encoding (status 4 means done):
```
curl -s -H "AccessKey: $(tr -d '\r\n ' < /c/Users/afik1/bunny-key.txt)" https://video.bunnycdn.com/library/808661/videos/<guid> | python -c "import json,sys;d=json.load(sys.stdin);print(d['status'],d['length'])"
```

### 8. Test
- `npx tsx --test src/lib/study/study.test.ts`: all tests must pass (48 at last count).
- Start the dev server `dev-demo-3005` from `.claude/launch.json` with preview_start, and open lesson 1 at `/study`.
  Check for the "סרטון השיעור" block and the "בסרטון · m:ss" buttons.
- A 403 from Bunny on localhost is **expected**: the library only plays on afikaccounting.vercel.app.

### 9. Publish
Only the `vercel` remote deploys. Push to both remotes:
```
git fetch --all
git checkout -b ias19-video-1
git add src/lib/study/ias19/videos.ts videos/tools/gen_ias19_chapters.py
git commit -m "IAS 19 lesson 1: the own-voice video on Bunny, with a chapter per screen"
git merge vercel/main
git merge origin/main
git push origin HEAD:main
git push vercel HEAD:main
git checkout main
git merge --ff-only ias19-video-1
```
End the commit message with the Co-Authored-By line your session uses.

Then confirm that production is on the new sha. The Vercel project is `prj_LTxVPvni2xxo6oSzfrlp0TaBfePi`, team slug
`afiks-projects-e6855209`. Use `list_deployments` with `sha`, and the state should reach READY. If no deployment appears, use
`create_deployment` with gitSource github afikzarkon/afikaccounting, ref main and the sha.

Do not try to confirm through the live page: anonymous fetches don't contain lesson content.

### 10. Report to the user
In Hebrew, tell the user:
- cuts and seconds removed
- the final length
- that it is live
- any spot where the recording said something different from the script that might be a slip, with its m:ss

Then move on to the next video.

## Good to know
- Both GitHub repos are **public**. Never commit audio, transcripts, keys or personal notes. Commit only `videos.ts` and tool changes.
- If a render is interrupted, a leftover process can lock the frames folder. The script uses a fresh folder each run (`-$$`), so just rerun it.
- When pushing, the vercel remote often has newer commits from other work. Always merge `vercel/main` and `origin/main` before you push.
- Recordings 7 and 8: when the user records them, use the same pipeline. Their chapter maps are already drafted.
