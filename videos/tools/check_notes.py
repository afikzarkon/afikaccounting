import json,re,html,sys,difflib
sys.stdout.reconfigure(encoding='utf-8')
V='C:/Users/afik1/Desktop/AfikAccounting/videos'
for n in range(3,10):
    new=json.load(open(f'l{n}_notes.json',encoding='utf-8'))
    order=json.load(open(f'{V}/basics{n}/deck/deck.json',encoding='utf-8'))['order']
    assert list(new)==order,(n,'order')
    odd=[];longl=0;maxw=0
    for sid in order:
        s=open(f'{V}/basics{n}/deck/slides/{sid}.html',encoding='utf-8').read()
        old=html.unescape(re.search(r'<aside>(.*?)</aside>',s,re.S).group(1))
        assert re.findall(r'\[\d+\]',old)==re.findall(r'\[\d+\]',new[sid]),(n,sid)
        a=old.split();b=new[sid].split()
        for op,i1,i2,j1,j2 in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
            if op=='equal':continue
            nb=' '.join(b[j1:j2])
            if not re.search(r'\d',nb) or (i2-i1)>6:
                odd.append(f'{sid}: {" ".join(a[i1:i2])!r} -> {nb!r}')
        for l in new[sid].split('\n'):
            w=len(l.split());maxw=max(maxw,w);longl+=w>30
    print(f'L{n}: {len(order)} slides, max line {maxw} words, lines>30w: {longl}')
    for o in odd: print('   ',o)
