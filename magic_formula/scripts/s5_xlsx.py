import json
from openpyxl import Workbook
from openpyxl.styles import Font,PatternFill,Alignment,Border,Side
from openpyxl.utils import get_column_letter
D=json.load(open('calc.json')); rows=D['rows']
SECT=['전기·전자','통신','에너지','바이오·제약']
ASOF='2026-11-13(금) 종가'
eok=lambda x:round(x/1e8)
HF=PatternFill('solid',fgColor='1F3864'); HFont=Font(bold=True,color='FFFFFF'); TF=Font(bold=True,size=13,color='1F3864')
AF=PatternFill('solid',fgColor='EEF3FA'); thin=Side(style='thin',color='BFBFBF')
def elig(r): return r['ebit']>0 and r['roc'] is not None
def eyval(r): return r['ey'] if r['ev']>0 else 99  # EV<=0(순현금>시총+차입금)은 최상위
wb=Workbook(); wb.remove(wb.active)
def sheet(title,cols,blocks,note):
    ws=wb.create_sheet(title); ws.append([title+'  |  기준: '+ASOF]); ws['A1'].font=TF
    ws.append([note]); ws['A2'].font=Font(italic=True,size=9,color='595959')
    for sec,data in blocks:
        ws.append([]); ws.append([f'■ {sec}  (적격 {data[1]}개 중 상위 {len(data[0])})']); ws.cell(ws.max_row,1).font=Font(bold=True,size=12,color='1F3864')
        ws.append([c[0] for c in cols]); hr=ws.max_row
        for i in range(1,len(cols)+1):
            x=ws.cell(hr,i); x.fill=HF; x.font=HFont; x.alignment=Alignment(horizontal='center',wrap_text=True)
        for j,r in enumerate(data[0]):
            ws.append([c[1](r) for c in cols])
            for i,c in enumerate(cols,1):
                x=ws.cell(ws.max_row,i); x.border=Border(bottom=thin)
                if j%2: x.fill=AF
                if len(c)>2: x.number_format=c[2]
    for i,c in enumerate(cols,1): ws.column_dimensions[get_column_letter(i)].width=max(9,len(c[0])*1.6+2)
    ws.column_dimensions['B'].width=18; ws.freeze_panes='A3'
base=[('순위',lambda r:r['_rk']),('종목명',lambda r:r['name']),('코드',lambda r:r['code']),('시장',lambda r:r['mkt']),
      ('시총(억)',lambda r:eok(r['mcap']),'#,##0'),('TTM영업이익(억)',lambda r:eok(r['ebit']),'#,##0')]
tail=[('재무기준',lambda r:r['base']+('' if r['fs']=='CFS' else '(별도)'))]
by={s:sorted([r for r in rows if r['sector']==s and elig(r)],key=lambda r:-eyval(r)) for s in SECT}
# ranks
for s in SECT:
    L=by[s]
    for i,r in enumerate(sorted(L,key=lambda r:-eyval(r)),1): r['ey_rk']=i
    for i,r in enumerate(sorted(L,key=lambda r:-r['roc']),1): r['roc_rk']=i
    for r in L: r['tot']=r['ey_rk']+r['roc_rk']
def top(s,key,n=30):
    L=sorted(by[s],key=key)[:n]
    out=[]
    for r in L: r=dict(r); out.append(r)
    return out,len(by[s])
B=[]
for s in SECT:
    L,n=top(s,lambda r:r['ey_rk'])
    for r in L: r['_rk']=r['ey_rk']
    B.append((s,(L,n)))
sheet('1_이익수익률',base+[('총차입금(억)',lambda r:eok(r['debt']),'#,##0'),('현금성(억)',lambda r:eok(r['cash']),'#,##0'),('EV(억)',lambda r:eok(r['ev']),'#,##0'),
   ('이익수익률',lambda r:'EV≤0' if r['ev']<=0 else r['ey'],'0.0%')]+tail,B,'이익수익률 = TTM 영업이익 ÷ EV(시총+총차입금−현금및현금성·단기금융상품). EV≤0(순현금이 시총보다 큰 경우)은 최상위 처리.')
B=[]
for s in SECT:
    L,n=top(s,lambda r:r['roc_rk'])
    for r in L: r['_rk']=r['roc_rk']
    B.append((s,(L,n)))
sheet('2_자본수익률',base+[('순운전자본(억)',lambda r:eok(r['nwc']),'#,##0'),('순유형자산(억)',lambda r:eok(r['ppe']),'#,##0'),('투하자본(억)',lambda r:eok(r['cap']),'#,##0'),
   ('자본수익률',lambda r:r['roc'],'0.0%')]+tail,B,'자본수익률 = TTM 영업이익 ÷ (순운전자본 + 순유형자산). 순운전자본 = (유동자산−현금성) − (유동부채−단기차입성부채), 음수는 0.')
B=[]
for s in SECT:
    L,n=top(s,lambda r:(r['tot'],r['ey_rk']))
    for i,r in enumerate(L,1): r['_rk']=i
    B.append((s,(L,n)))
sheet('3_총합점(마법공식)',base+[('이익수익률',lambda r:'EV≤0' if r['ev']<=0 else r['ey'],'0.0%'),('이익수익률 순위',lambda r:r['ey_rk']),
   ('자본수익률',lambda r:r['roc'],'0.0%'),('자본수익률 순위',lambda r:r['roc_rk']),('총합점',lambda r:r['tot'])]+tail,B,
   '총합점 = 이익수익률 순위 + 자본수익률 순위 (섹터 내 적격 종목 전체 기준 순위, 낮을수록 상위). 동점은 이익수익률 순위 우선.')
# net-net
nn=sorted([r for r in rows if r['ncav']>r['mcap']],key=lambda r:-r['ncav']/r['mcap'])
B=[]
for s in SECT:
    L=[dict(r) for r in nn if r['sector']==s]
    for i,r in enumerate(L,1): r['_rk']=i
    B.append((s,(L,len([r for r in rows if r['sector']==s]))))
sheet('4_넷넷주',[('순위',lambda r:r['_rk']),('종목명',lambda r:r['name']),('코드',lambda r:r['code']),('시장',lambda r:r['mkt']),
   ('시총(억)',lambda r:eok(r['mcap']),'#,##0'),('유동자산(억)',lambda r:eok(r['CA']),'#,##0'),('총부채(억)',lambda r:eok(r['TL']),'#,##0'),
   ('순유동자산(억)',lambda r:eok(r['ncav']),'#,##0'),('NCAV/시총',lambda r:r['ncav']/r['mcap'],'0.00"배"'),('시총/NCAV',lambda r:r['mcap']/r['ncav'],'0.0%'),
   ('TTM영업이익(억)',lambda r:eok(r['ebit']),'#,##0')]+tail,B,'넷넷 = 순유동자산(유동자산−총부채) > 시가총액. 적자 기업 포함(영업이익 열 참고). 그레이엄 기준 매수선은 시총/NCAV ≤ 66.7%.')
ws=wb.create_sheet('기준·방법')
for l in [['항목','내용'],['주가·시총','네이버증권 '+ASOF+', 보통주 시총'],['재무','DART OpenAPI 전체재무제표(연결 우선, 없으면 별도)'],
  ['TTM 영업이익','FY2025 + 2026 누적(3Q 또는 2Q) − 2025 동기 누적'],['재무상태표','2026.09.30(3Q 공시분) / 미공시 시 2026.06.30(2Q) — "재무기준" 열 참조'],
  ['섹터(KSIC)','전기·전자: 26·28(통신장비 제외, 삼성전자·LG전자 포함) / 통신: 61 통신서비스 + 264 통신·방송장비 / 에너지: 35 전기·가스 + 19 석유정제 / 바이오·제약: 21 의약품 + 701 연구개발'],
  ['제외','금융·지주(홀딩스·지주·스팩), 12월 결산 외, 영업이익(TTM) ≤ 0, 데이터 누락'],
  ['한계','3분기 보고서 마감(11/16) 직전이라 일부는 2Q 기준. 차입금·현금은 계정명 매칭이라 개별 오차 가능 → 투자 전 공시 원문 확인 필요'],
  ['제외 종목 수',str(len(D['skip']))]]:
    ws.append(l)
ws.column_dimensions['A'].width=16; ws.column_dimensions['B'].width=110
for x in ws[1]: x.fill=HF; x.font=HFont
wb.save('마법공식_4개섹터_20261113.xlsx'); print('saved')
