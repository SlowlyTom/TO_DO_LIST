import json,os
from concurrent.futures import ThreadPoolExecutor
from dart import api
from sector import sector
c=json.load(open('corp.json'));p=json.load(open('prices.json'))
os.makedirs('raw',exist_ok=True)
def get(cc,y,r):
    fn=f'raw/{cc}_{y}_{r}.json'
    if os.path.exists(fn): return json.load(open(fn))
    for fs in('CFS','OFS'):
        d=api('fnlttSinglAcntAll.json',corp_code=cc,bsns_year=y,reprt_code=r,fs_div=fs)
        if d.get('status')=='000' and d.get('list'):
            d['fs']=fs; json.dump(d,open(fn,'w'),ensure_ascii=False); return d
    d={'status':'013'}; json.dump(d,open(fn,'w')); return d
def f(k):
    cc=c[k]['corp_code']
    q3=get(cc,'2026','11014')
    if q3.get('status')!='000': get(cc,'2026','11012')
    get(cc,'2025','11011')
    return k
targets=[k for k,v in c.items() if sector(v['induty'],p[k]['name']) and v['acc_mt']=='12']
print(len(targets),flush=True)
with ThreadPoolExecutor(6) as ex:
    for i,_ in enumerate(ex.map(f,targets)):
        if i%100==0: print(i,flush=True)
print('done')
