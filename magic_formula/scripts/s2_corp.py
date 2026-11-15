import json,zipfile,io,xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from dart import api
z=zipfile.ZipFile(io.BytesIO(api('corpCode.xml')))
root=ET.fromstring(z.read(z.namelist()[0]))
m={}
for c in root.iter('list'):
    sc=(c.findtext('stock_code') or '').strip()
    if sc: m[sc]=c.findtext('corp_code')
pr=json.load(open('prices.json'))
codes=[c for c in pr if c in m]
print('mapped',len(codes),'of',len(pr))
def f(c):
    d=api('company.json',corp_code=m[c])
    return c,dict(corp_code=m[c],induty=d.get('induty_code'),acc_mt=d.get('acc_mt'),corp_name=d.get('corp_name'),cls=d.get('corp_cls'))
with ThreadPoolExecutor(6) as ex: res=dict(ex.map(f,codes))
json.dump(res,open('corp.json','w'),ensure_ascii=False)
