"""Upload IAS 19 videos to the Bunny Stream library and record their ids in src/lib/study/ias19/videos.ts.

Usage: python -I videos/tools/bunny_upload_ias19.py <video keys…>   e.g. 4a 4b

The library's API key is read from C:\\Users\\afik1\\bunny-key.txt; it is never printed.
A video that already has an id in videos.ts is skipped. Run gen_ias19_chapters.py first.
"""
import json, re, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TS = ROOT / 'src/lib/study/ias19/videos.ts'
KEY = Path(r'C:\Users\afik1\bunny-key.txt').read_text(encoding='utf8').strip()
LIBRARY = '808661'
API = f'https://video.bunnycdn.com/library/{LIBRARY}'

TITLES = {'1': 'יסודות: ארבעת סוגי ההטבות, וכלי המימון', '2': 'הטבות לזמן קצר', '3': 'הפקדה מוגדרת',
          '4a': 'מדידה בנקודת זמן', '4b': 'לאיזו שנה שייך כל חלק', '5a': 'תנועה בהתחייבות', '5b': 'שינוי תנאים באמצע השנה',
          '6a': 'נכסי תכנית ותקרת נכס', '6b': 'הצגה בדוחות', '7': 'הטבות אחרות לזמן ארוך ופיטורין', '8': 'מבחנים'}


def call(method, url, data=None, ctype='application/json'):
    req = urllib.request.Request(url, data=data, method=method, headers={'AccessKey': KEY, 'Content-Type': ctype, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=1800) as r:
        return json.loads(r.read() or b'{}')


def write_id(key, guid):
    s = TS.read_text(encoding='utf8')
    m = re.search(r'const BUNNY_IDS: Record<string, string> = \{(.*?)\};', s, re.S)
    ids = dict(re.findall(r'"?(\w+)"?: "([0-9a-f-]+)"', m.group(1)))
    ids[key] = guid
    body = ''.join(f'\n  "{k}": "{ids[k]}",' for k in sorted(ids))
    s = s[:m.start()] + f'const BUNNY_IDS: Record<string, string> = {{{body}\n}};' + s[m.end():]
    TS.write_text(s, encoding='utf8', newline='\n')


for key in sys.argv[1:]:
    if re.search(rf'"{key}": "[0-9a-f-]+"', TS.read_text(encoding='utf8').split('const RECORDINGS')[0]):
        print(f'{key}: already uploaded'); continue
    f = ROOT / f'videos/ias19-{key}/ias19-{key}.mp4'
    n = re.match(r'\d+', key).group()
    guid = call('POST', f'{API}/videos', json.dumps({'title': f'הטבות עובד · שיעור {key.replace("a", "א").replace("b", "ב")}: {TITLES[key]}'}).encode())['guid']
    print(f'{key}: created {guid}, uploading {f.stat().st_size / 1e6:.0f} MB…', flush=True)
    res = call('PUT', f'{API}/videos/{guid}', f.read_bytes(), 'application/octet-stream')
    if not res.get('success', True):
        raise SystemExit(f'{key}: upload failed: {res}')
    write_id(key, guid)
    print(f'{key}: done', flush=True)
