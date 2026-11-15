import json,urllib.request,time
H={'User-Agent':'Mozilla/5.0'}
def get(u):
    return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=30).read())
out={}
for mk in ['KOSPI','KOSDAQ']:
    p=1
    while True:
        d=get(f"https://m.stock.naver.com/api/stocks/marketValue/{mk}?page={p}&pageSize=100")
        st=d.get('stocks',[])
        if not st: break
        for s in st:
            if s.get('stockEndType')!='stock': continue
            out[s['itemCode']]=dict(name=s['stockName'],mkt=mk,close=int(s['closePrice'].replace(',','')),
              mcap_eok=int(s['marketValue'].replace(',',''))/1e2 if False else int(s['marketValue'].replace(',','')),
              at=s['localTradedAt'])
        p+=1; time.sleep(0.1)
    print(mk,p,len(out))
json.dump(out,open('prices.json','w'),ensure_ascii=False)
