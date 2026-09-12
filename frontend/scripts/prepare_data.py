"""Build a reproducible demo from repository CSVs. No external queries.

Source records are preserved as evidence. Portfolio exposure, risk dimensions,
groups and historical series are intentionally synthetic scenario fixtures.
"""
import csv, hashlib, json, shutil, re, ast
from pathlib import Path
from collections import defaultdict, Counter

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'frontend/src/data'
PUBLIC = ROOT / 'frontend/public/mocks'
PUBLIC.mkdir(parents=True, exist_ok=True)
DEST.mkdir(parents=True, exist_ok=True)
files = [
    ('ibama', 'auto_infracao_normalizado.csv', 'Ibama', 'Ambiental', 'CNPJ_NORMALIZADO'),
    ('pgfn', 'nao_previdenciario_normalizado.csv', 'PGFN • não previdenciária', 'Fiscal', 'CNPJ_NORMALIZADO'),
    ('previdencia', 'previdenciario_normalizado.csv', 'PGFN • previdenciária', 'Fiscal', 'CNPJ_NORMALIZADO'),
    ('fgts', 'fgts_normalizado.csv', 'PGFN • FGTS', 'Trabalhista', 'CNPJ_NORMALIZADO'),
    ('zarc', 'siszarc_normalizado.csv', 'SISZARC', 'Agronômica', None),
    ('inmet', 'inmet_normalizado.csv', 'INMET • estação A999', 'Climática', None),
]

def identifier(s): return ''.join(c for c in s.upper() if c.isalnum())
def money(s): return float(s.replace('.', '').replace(',', '.')) if ',' in s else float(s or 0)

for obsolete in ['mock_auto_infracao.csv', 'mock_dados_abertos_nao_previdenciario.csv', 'mock_dados_abertos_previdenciario.csv', 'mock_dados_abertos_FGTS.csv', 'mock_siszarc_cronograma.csv', 'mock_INMET_2026.csv']:
    (PUBLIC / obsolete).unlink(missing_ok=True)

sources, clients, source_rows = [], [], {}
for sid, fname, label, dim, idcol in files:
    fpath = ROOT / fname
    with fpath.open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f, delimiter=';'))
    source_rows[sid] = rows
    shutil.copy2(fpath, PUBLIC / fname)
    sources.append(dict(id=sid, file=fname, name=label, dimension=dim, count=len(rows),
                        hash=hashlib.sha256(fpath.read_bytes()).hexdigest(), skip=0,
                        masked=sum('XXX' in r.get('CPF_CNPJ',r.get('CPF_CNPJ_INFRATOR','')) for r in rows),
                        description={'ibama':'Autos de infração. Auto não cancelado não comprova embargo ativo.',
                        'zarc':'Catálogo de cultivares. Não contém janela de plantio, solo ou nível de risco.',
                        'inmet':'Observações horárias sintéticas no DF. Sem vínculo com imóveis da carteira.'}.get(sid,'Inscrições sintéticas; valores e situações preservados do CSV.')))
    if not idcol: continue
    eligible=[(idx,r) for idx,r in enumerate(rows) if re.fullmatch(r'[A-Z0-9]{12}[0-9]{2}', r[idcol])]
    for idx, row in eligible[:9]:
        n=len(clients); cid=identifier(row[idcol]); active=row.get('SIT_CANCELADO')=='N'
        raw_flag='EMBARGO_AMBIENTAL' if sid=='ibama' and active else 'DIVIDA_FGTS' if sid=='fgts' else 'DIVIDA_ATIVA_PGFN' if sid in ('pgfn','previdencia') else None
        ev=dict(id=row['ID_REGISTRO_NORMALIZADO'], title='Auto de infração ambiental' if sid=='ibama' else 'Inscrição de FGTS' if sid=='fgts' else 'Inscrição em dívida ativa',
                source=sid, file=fname, line=idx+2, origin='csv', date=row.get('DATA_INSCRICAO',row.get('DT_FATO_INFRACIONAL','')),
                status=row.get('SITUACAO_INSCRICAO', 'Cancelado' if not active else 'Não cancelado'),
                amount=float(row['VALOR_NUMERICO']),
                description=row.get('DES_AUTO_INFRACAO',row.get('RECEITA_PRINCIPAL',row.get('TIPO_CREDITO',''))),raw=row)
        # Deliberately synthetic product scenarios, not a production risk inference.
        risks=[(n*17+20)%75,(n*11+10)%60,(n*7+15)%70,60 if sid!='ibama' else 15,55 if active else 0]
        if n%7==0: risks=[7,12,15,12,0]
        clients.append(dict(id=cid,name=row.get('NOME_DEVEDOR',row.get('NOME_INFRATOR')).title(),cnpj=row.get('CPF_CNPJ',row.get('CPF_CNPJ_INFRATOR',cid)),
              state=row.get('UF_DEVEDOR',row.get('UF')),city=row.get('MUNICIPIO',''),
              segment=['Distribuidor','Agroindústria','Parceiro B2B'][n%3],crop=['Soja','Milho','Cana-de-açúcar','Algodão'][n%4],
              exposure=85000+(n*37000)%610000,securedRatio=[.2,.65,.4,.8,.35][n%5],
              modality=['prazo','barter','cpr','a_vista'][n%4],term=[60,90,120,180][n%4],
              group=['Independente','Grupo Cerrado','Grupo Horizonte','Independente'][n%4],
              risks=risks,legacyFlags=[raw_flag] if raw_flag else [],evidence=[ev],
              embargoConfirmed=False,rj=False,coverage='insufficient' if n==35 else 'demo',
              earlySignal='Execução distribuída' if n%6==1 else 'Alteração societária' if n%7==2 else None,
              change=-15-(n*11)%135,lastReview=f'2026-09-{12-n%10:02d}',origin='csv',
              sourceNote='Identidade e evidência do CSV. Exposição, contexto, grupos, histórico e pilares são cenários simulados.'))

pitch=[
 ('11222333000181','Fazenda Santa Aurora','MT','Soja',520000,'prazo',[0,0,0,0,0],[],False,False,None),
 ('22333444000192','Agroindustrial Horizonte','GO','Milho',820000,'prazo',[100,60,40,80,20],['RECUPERACAO_JUDICIAL','DIVIDA_ATIVA_PGFN'],False,True,None),
 ('33444555000103','Fazenda Campo Verde','MS','Algodão',640000,'prazo',[40,30,50,20,100],['EMBARGO_AMBIENTAL'],True,False,'Execução distribuída'),
 ('44555666000114','Cooperativa Vale do Sol','PR','Milho',280000,'cpr',[20,35,30,80,10],['DIVIDA_FGTS'],False,False,'Alteração societária'),
]
pc=[]
for i,(cid,name,state,crop,exp,mod,risks,flags,env,rj,early) in enumerate(pitch):
    evidence=[dict(id=f'pitch-{i}-{j}',title={'EMBARGO_AMBIENTAL':'Embargo ativo em área vinculada','RECUPERACAO_JUDICIAL':'Pedido de recuperação judicial','DIVIDA_ATIVA_PGFN':'Dívida ativa','DIVIDA_FGTS':'Inscrição de FGTS'}[flag],
             source={'EMBARGO_AMBIENTAL':'ibama','RECUPERACAO_JUDICIAL':'receita','DIVIDA_ATIVA_PGFN':'pgfn','DIVIDA_FGTS':'fgts'}[flag],
             file='consultar_red_flags.py • MOCK_OVERRIDES',line=0,origin='scenario',date='10/09/2026',status='Cenário fictício do pitch',amount=0,
             description='Ocorrência fixa do roteiro. Datas e vínculo territorial são hipóteses de demonstração, sem consulta oficial.',raw={'flag':flag,'fixture':cid}) for j,flag in enumerate(flags)]
    pc.append(dict(id=cid,name=name,cnpj=f'{cid[:2]}.{cid[2:5]}.{cid[5:8]}/{cid[8:12]}-{cid[12:]}',state=state,city='',segment='Produtor rural' if i in(0,2) else 'Agroindústria' if i==1 else 'Cooperativa',crop=crop,
          exposure=exp,securedRatio=[.7,.25,.4,.65][i],modality=mod,term=120,group='Grupo Horizonte' if i==1 else 'Independente',
          risks=risks,legacyFlags=flags,evidence=evidence,embargoConfirmed=env,rj=rj,coverage='demo',earlySignal=early,
          change=[0,-260,-180,-70][i],lastReview='2026-09-12',origin='scenario',sourceNote='CNPJ e flags dos casos fixos do agente. Nome, operação, valores, datas e contexto fictícios.'))

weather=defaultdict(list)
for r in source_rows['inmet']: weather[r['DATA_HORA_UTC'][:10]].append(r)
daily=[]
for date,rs in weather.items():
    daily.append(dict(date=date,day=date[8:10]+'/'+date[5:7],observations=len(rs),rain=round(sum(float(r['PRECIPITACAO_MM']) for r in rs),1),temperature=round(sum(float(r['TEMPERATURA_AR_C']) for r in rs)/len(rs),1)))
# Build compatibility snapshots by executing the repository's actual deterministic
# functions. Only the IBM registration import/decorator is removed; no SDK calls.
agent_path = ROOT / 'consultar_red_flags.py'
tree = ast.parse(agent_path.read_text())
tree.body = [node for node in tree.body if not (isinstance(node, ast.ImportFrom) and (node.module or '').startswith('ibm_watsonx'))]
for node in tree.body:
    if isinstance(node, ast.FunctionDef): node.decorator_list = []
agent = {'__file__': str(agent_path)}
exec(compile(tree, str(agent_path), 'exec'), agent)
for client in pc + clients:
    cid = client['id']
    present = cid in agent['MOCK_OVERRIDES'] or cid in agent['_DIVIDAS'] or cid in agent['_AUTO_INFRACAO']
    flags = dict(agent['MOCK_OVERRIDES'][cid]) if cid in agent['MOCK_OVERRIDES'] else {**agent['_DIVIDAS'].get(cid,{}), **agent['_AUTO_INFRACAO'].get(cid,{})}
    client['agentFlagCodes'] = list(flags)
    client.pop('legacyFlags',None)
    client['agentAssessments'] = {}
    for modality in ['a_vista','prazo','barter','cpr']:
        result = agent['_calcular_score'](flags, modality, 'producao') if present else None
        client['agentAssessments'][modality] = dict(score=result['score'] if result else None,baseScore=result['score'] if result else None,rating=result['rating'] if result else 'NC',
            rules=[{'label':code,'points':value['pontos']} for code,value in result['pontos_por_flag'].items()] if result else [],override=None,policy='agent-v04')

dataset=dict(schemaVersion='1.2',agentReference={'version':'4','sourceHash':hashlib.sha256(agent_path.read_bytes()).hexdigest(),'scope':'finalidade=producao; sem parametros agronomicos'},asOf='2026-09-12',clients=pc+clients,sources=sources,weather=daily,
             cultivars=[{'name':name,'count':count} for name,count in Counter(r['Cultura'] for r in source_rows['zarc']).most_common()],
             disclaimer='Todos os CSVs são mocks. Dados comerciais e histórico da carteira são ilustrativos; não representam números da Krilltech.')
(DEST/'demo.json').write_text(json.dumps(dataset,ensure_ascii=False,indent=2))
print(f'Prepared {len(dataset["clients"])} portfolio scenarios; {sum(s["count"] for s in sources)} source records; {len(daily)} weather days.')
