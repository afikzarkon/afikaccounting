"""Upload the basics lesson videos to a Bunny Stream library and record their ids in the site.

Usage: python -I videos/tools/bunny_upload.py <library_id> [lesson numbers…]   (default: 1–8)

The library's API key is read from C:\\Users\\afik1\\bunny-key.txt (Stream → library →
API → "API Key"); it is never printed. Each lesson is created, uploaded, and its
GUID written into src/lib/study/basics/videos.ts. A lesson that already has an id
there is skipped, so the script can be run again after a failure.
"""
import json, re, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TS = ROOT / 'src/lib/study/basics/videos.ts'
KEY = Path(r'C:\Users\afik1\bunny-key.txt').read_text(encoding='utf8').strip()
API = 'https://video.bunnycdn.com/library'

TITLES = {1: 'מהי חשבונאות', 2: 'הרישום הכפול ופקודות יומן', 3: 'מכרטיסי T ועד הדוחות', 4: 'שנה שלמה: מפקודה ראשונה ועד מאזן בוחן',
          5: 'התאמות סוף שנה', 6: 'מאזן בוחן ראשוני: לזהות, לתקן, להשלים', 7: 'הפסדי אשראי', 8: 'גיליון רב-טורי ותרגול מסכם'}


def call(method, url, data=None, ctype='application/json'):
    req = urllib.request.Request(url, data=data, method=method, headers={'AccessKey': KEY, 'Content-Type': ctype, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=1800) as r:
        return json.loads(r.read() or b'{}')


def ids_in_ts():
    m = re.search(r'const BUNNY_IDS: Record<number, string> = \{(.*?)\};', TS.read_text(encoding='utf8'), re.S)
    return {int(k): v for k, v in re.findall(r'(\d+): "([0-9a-f-]+)"', m.group(1))}


def write_ts(library, ids):
    s = TS.read_text(encoding='utf8')
    s = re.sub(r'const BUNNY_LIBRARY = "[^"]*";', f'const BUNNY_LIBRARY = "{library}";', s)
    body = ''.join(f'\n  {n}: "{ids[n]}",' for n in sorted(ids))
    s = re.sub(r'const BUNNY_IDS: Record<number, string> = \{.*?\};', f'const BUNNY_IDS: Record<number, string> = {{{body}\n}};', s, flags=re.S)
    TS.write_text(s, encoding='utf8', newline='\n')


def main():
    library = sys.argv[1]
    lessons = [int(a) for a in sys.argv[2:]] or list(range(1, 9))
    ids = ids_in_ts()
    for n in lessons:
        if n in ids:
            print(f'lesson {n}: already uploaded ({ids[n]})')
            continue
        f = ROOT / f'videos/basics{n}/lesson{n}.mp4'
        guid = call('POST', f'{API}/{library}/videos', json.dumps({'title': f'שיעור {n}: {TITLES[n]}'}).encode())['guid']
        print(f'lesson {n}: created {guid}, uploading {f.stat().st_size / 1e6:.0f} MB…', flush=True)
        res = call('PUT', f'{API}/{library}/videos/{guid}', f.read_bytes(), 'application/octet-stream')
        if not res.get('success', True):
            raise SystemExit(f'lesson {n}: upload failed: {res}')
        ids[n] = guid
        write_ts(library, ids)
        print(f'lesson {n}: done', flush=True)


if __name__ == '__main__':
    main()
