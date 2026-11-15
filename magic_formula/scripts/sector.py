def sector(ind,name=''):
    i=ind or ''
    if name in('삼성전자','LG전자'): return '전기·전자'
    if i.startswith('264') or i.startswith('61'): return '통신'
    if i.startswith('26') or i.startswith('28'): return '전기·전자'
    if i.startswith('35') or i.startswith('19'): return '에너지'
    if i.startswith('21') or i.startswith('701'): return '바이오·제약'
    return None
