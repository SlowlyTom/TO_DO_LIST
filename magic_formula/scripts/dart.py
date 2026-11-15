import os,json,urllib.request,urllib.parse,time
K=os.environ['dart_api_key'].strip()
def api(ep,**p):
    p['crtfc_key']=K
    u=f"https://opendart.fss.or.kr/api/{ep}?"+urllib.parse.urlencode(p)
    for i in range(4):
        try:
            r=urllib.request.urlopen(u,timeout=60).read()
            return json.loads(r) if ep.endswith('.json') else r
        except Exception as e:
            time.sleep(2*(i+1)); err=e
    raise err
