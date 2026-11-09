from pathlib import Path
s=Path('wish-map/style.css').read_text(encoding='utf-8')
# strip comments and strings approximately
out=[]; i=0; n=len(s); comment=False; quote=None
while i<n:
    ch=s[i]
    if comment:
        if ch=='*' and i+1<n and s[i+1]=='/': comment=False; i+=2; continue
        i+=1; continue
    if quote:
        if ch=='\\': i+=2; continue
        if ch==quote: quote=None
        i+=1; continue
    if ch=='/' and i+1<n and s[i+1]=='*': comment=True; i+=2; continue
    if ch in "'\"": quote=ch; i+=1; continue
    out.append(ch); i+=1
clean=''.join(out)
bal=0; line=1; events=[]
for ch in clean:
    if ch=='\n': line+=1
    elif ch=='{': bal+=1
    elif ch=='}':
        bal-=1
        if bal<0: events.append(('neg',line)); bal=0
print('final balance',bal,'events',events[:10])
# report at end of each top-level block? Show line of modal
for needle in ['.modal {','.video-grid {','.video-map-section','.image-modes']:
    idx=clean.find(needle)
    print(needle, 'line', clean[:idx].count('\n')+1 if idx>=0 else None)
