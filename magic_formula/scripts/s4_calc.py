import json,os,re
from sector import sector
c=json.load(open('corp.json'));p=json.load(open('prices.json'))
def num(x):
    try: return float(str(x).replace(',',''))
    except: return None
def load(cc,y,r):
    fn=f'raw/{cc}_{y}_{r}.json'
    if not os.path.exists(fn): return None
    d=json.load(open(fn)); return d if d.get('status')=='000' else None
def oi(d,col):
    for sj in('IS','CIS'):
        for r in d['list']:
            if r['sj_div']!=sj: continue
            nm=re.sub(r'\s','',r['account_nm'])
            if r['account_id'] in('dart_OperatingIncomeLoss','ifrs-full_ProfitLossFromOperatingActivities') or re.match(r'^영업(이익|손실|손익)',nm) or re.match(r'^[ⅤVⅣIVX\.\d\(\)]*영업(이익|손실|손익)',nm):
                v=num(r.get(col))
                if v is not None: return v
    return None
DEBT=re.compile(r'차입금|사채|유동성장기부채|리스부채')
NODEBT=re.compile(r'전환권|할증|할인|이자|충당|상환권|파생')
CASHX=re.compile(r'단기금융상품|단기예금|단기금융자산|단기투자자산')
def bs(d):
    sec=None; o=dict(CA=None,CL=None,TL=None,cash=0.0,stdebt=0.0,ltdebt=0.0,ppe=None); fl={'CL':0.0,'NCL':0.0}
    for r in d['list']:
        if r['sj_div']!='BS': continue
        aid=r['account_id']; nm=re.sub(r'\s','',r['account_nm']); v=num(r.get('thstrm_amount'))
        if aid=='ifrs-full_CurrentAssets' or nm=='유동자산': sec='CA'; o['CA']=o['CA'] or v; continue
        if aid=='ifrs-full_NoncurrentAssets' or nm=='비유동자산': sec='NCA'; continue
        if aid=='ifrs-full_CurrentLiabilities' or nm=='유동부채': sec='CL'; o['CL']=o['CL'] or v; continue
        if aid=='ifrs-full_NoncurrentLiabilities' or nm=='비유동부채': sec='NCL'; continue
        if aid=='ifrs-full_Liabilities' or nm=='부채총계': o['TL']=v; sec=None; continue
        if aid=='ifrs-full_Equity' or nm=='자본총계': sec=None; continue
        if v is None: continue
        if sec=='CA' and (aid=='ifrs-full_CashAndCashEquivalents' or nm=='현금및현금성자산' or CASHX.search(nm)): o['cash']+=v
        if sec=='NCA' and o['ppe'] is None and (aid.startswith('ifrs-full_PropertyPlantAndEquipment') or nm=='유형자산'): o['ppe']=v
        if sec in('CL','NCL') and DEBT.search(nm) and not NODEBT.search(nm):
            o['stdebt' if sec=='CL' else 'ltdebt']+=v
        elif sec in('CL','NCL') and '금융부채' in nm and not NODEBT.search(nm): fl[sec]+=v
    if o['stdebt']==0: o['stdebt']=fl['CL']; o['fl']=o.get('fl',0)+(fl['CL']>0)
    if o['ltdebt']==0: o['ltdebt']=fl['NCL']; o['fl']=o.get('fl',0)+(fl['NCL']>0)
    return o
rows=[];skip={}
for k,v in c.items():
    nm=p[k]['name']; s=sector(v['induty'],nm)
    if not s: continue
    if v['acc_mt']!='12': skip[nm]='12월 결산 아님'; continue
    if re.search(r'홀딩스|지주|스팩',nm) or (v['induty'] or '').startswith('64'): skip[nm]='지주·금융'; continue
    cc=v['corp_code']; fy=load(cc,'2025','11011')
    cur=load(cc,'2026','11014'); base='2026.3Q'
    if not cur: cur=load(cc,'2026','11012'); base='2026.2Q'
    if not cur or not fy: skip[nm]='재무데이터 없음'; continue
    a=oi(fy,'thstrm_amount'); b=oi(cur,'thstrm_add_amount'); pr=oi(cur,'frmtrm_add_amount')
    if None in(a,b,pr): skip[nm]='영업이익 항목 불명'; continue
    ebit=a+b-pr; B=bs(cur)
    if None in(B['CA'],B['CL'],B['TL']): skip[nm]='재무상태표 불명'; continue
    mcap=p[k]['mcap_eok']*1e8; debt=B['stdebt']+B['ltdebt']
    ev=mcap+debt-B['cash']
    nwc=max(0.0,(B['CA']-B['cash'])-(B['CL']-B['stdebt']))
    cap=nwc+(B['ppe'] or 0)
    rows.append(dict(code=k,name=nm,mkt=p[k]['mkt'],sector=s,base=base,fs=cur['fs'],close=p[k]['close'],
        mcap=mcap,ebit=ebit,debt=debt,cash=B['cash'],ev=ev,nwc=nwc,ppe=B['ppe'] or 0,cap=cap,
        CA=B['CA'],TL=B['TL'],ncav=B['CA']-B['TL'],
        debt_proxy=bool(B.get('fl')),ey=ebit/ev if ev>0 else None, roc=ebit/cap if cap>0 else None))
json.dump(dict(rows=rows,skip=skip),open('calc.json','w'),ensure_ascii=False)
import collections
print(len(rows),collections.Counter(r['base'] for r in rows),collections.Counter(skip.values()))
