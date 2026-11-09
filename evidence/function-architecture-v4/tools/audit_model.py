from pathlib import Path
from lxml import etree as E
import json,csv,re
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--root',default=str(Path(__file__).resolve().parents[1]));args=parser.parse_args();P=Path(args.root);D=json.loads((P/'model/architecture.json').read_text(encoding='utf-8'));T=E.parse(str(P/'model/PANTRI_Function_Architecture_Live_Export.xml'));R=T.getroot();DB=R.find('database');ES={e.findtext('globalId'):e for e in DB.findall('entity')};NUM={e.findtext('number'):e for e in ES.values()if e.findtext('number')};RN={x.findtext('name'):x.get('id')for x in R.find('schema').findall('schemaRelation')};RELS={(x.findtext('sourceId'),x.findtext('schemaRelationId'),x.findtext('targetId')):x for x in DB.findall('relationship')}
def check(a,rel,b):return (NUM[a].findtext('globalId'),RN[rel],NUM[b].findtext('globalId'))in RELS
checks=[]
def test(name,valid):checks.append(dict(check=name,passed=bool(valid)));assert valid,name
test('Six first-level children of P-F.0',sum(check('P-F.0','decomposed by',f['id'])for f in D['functions'])==6)
test('All 21 leaf functions have the intended parent',all(check(f['id'],'decomposed by',c['id'])for f in D['functions']for c in f['children']))
test('All 17 carried-down boundary connections exist',all(check(b['function'],'receives'if b['role']!='O'else'generates',b['id'])for b in D['boundary']))
for f in D['flows']:
 test(f['id']+' source and destination closure',all(check(s,'generates',f['id'])for s in f['sources'])and all(check(t,'receives',f['id'])for t in f['targets']))
test('All derived requirements have upper-level requirement traces',all(check(q['id'],'traced from','P-SFR.01')and all(check(q['id'],'traced from',s)for s in q['sources']if s!='P-SFR.01')for q in D['requirements']))
test('All derived requirements have leaf-function allocation',all(check(q['function'],'satisfies',q['id'])for q in D['requirements']))
test('Every new requirement has a planned native verification case',all(check(q['id'],'verified by',q['id'].replace('AFR','AVT'))for q in D['requirements']))
test('Sequence event names and numbers are unique',len({x['step']for x in D['traces']})==len(D['traces'])and len({x['name']for x in D['traces']})==len(D['traces']))
test('UC.1 trace passes the continuous endpoint pencil test',all(a['target']==b['source']for a,b in zip(D['traces'],D['traces'][1:])))
for x in D['traces']:
 if x['flow'].startswith('P-IF'):
  f=next(f for f in D['flows']if f['id']==x['flow']);test('Trace '+x['step']+' matches modeled interface',x['source']in f['sources']and x['target']in f['targets'])
 else:
  source=x['source']if not x['source'].startswith('P-F.0.')else'P-F.0';target=x['target']if not x['target'].startswith('P-F.0.')else'P-F.0'
  test('Trace '+x['step']+' matches Metafunction I/O',check(source,'generates',x['flow'])and check(target,'receives',x['flow']))
all_io={}
for i in list(range(1,23))+['9A']:
 e=NUM[f'UC.1.{i}'];g=e.findtext('globalId')
 for (src,rid,tgt),rel in RELS.items():
  if src==g and rid in [RN['generates'],RN['receives']]:
   io=ES[tgt]
   if io.findtext('schemaClassId')==next(x.get('id')for x in R.find('schema').findall('schemaClass')if x.findtext('name')=='Input/Output'):
    row=all_io.setdefault(tgt,dict(global_id=tgt,name=io.findtext('name'),producers=[],consumers=[]));row['producers'if rid==RN['generates']else'consumers'].append(f'UC.1.{i}')
MAP={'Checked Ingredient Information':('P-F.1 / P-IO.09','Added manager-local completeness review; deferral produces no approval and does not add an architectural crossing.'),'Purchasing Recommendation Request':('P-IO.01','Scoped planning control entering P-F.0.5.'),'Current Inventory Data':('P-IO.04 / P-IF.03','Preloaded operational record subset; retrieved within P-F.0.1.'),'Historical Usage Data':('P-IO.04 / P-IF.03','Preloaded historical usage subset; no new external data source.'),'Expiration Data':('P-IO.04 / P-IF.03','Recorded batch dates, including explicit unknowns.'),'Demand Forecast':('P-IF.05 / P-IO.09','Internal planning result; forecast is a field of the reviewable recommendation basis.'),'Purchasing Recommendation':('P-IF.05 / P-IF.06 / P-IO.09','Distinguish internal advice from the manager-facing reviewable draft using producer/consumer IDs.'),'Reviewed Purchasing Recommendation':('P-F.1 / P-IO.09','Local manager review state; no additional cross-boundary I/O is asserted.'),'Adjusted Purchase Quantities':('P-IO.02','Manager revision input to P-F.0.3.'),'Updated Proposed Purchase Order':('P-IF.06 / P-IO.09','Revised unapproved reviewable draft; added feedback message 4 makes approval basis explicit.'),'Order Approval':('P-IO.03','Explicit approval control, separate from revision.'),'Approved Order Data':('P-IF.19 / P-F.0.3','Internal retained approval state, version and quantities.'),'Official Purchase Order':('P-F.0.3 / P-IO.11','Internal official-order object becomes the unchanged approved outgoing order.'),'Purchase Order':('P-IO.11','Cross-boundary supplier handoff.'),'Received Purchase Order':('P-F.3 / P-IO.11','Supplier-local received copy, not a second PANTRI transmission.'),'Order Confirmation':('P-F.3 / P-IO.05','Supplier-local confirmation before the response crosses to PANTRI.'),'Delivery Information':('P-IO.05','Aggregate response includes order association, confirmation and delivery context.'),'Supplier Confirmation Record':('P-IF.19 / P-IF.07','Retained supplier-response event and associated recorded state.'),'Updated Order Status':('P-IF.07 / P-IO.13','Internal state to presentation then external status.'),'Order Status Information':('P-IO.13','Recorded status delivered to the manager.')}
for row in all_io.values():
 assert row['name']in MAP,row['name'];row['architecture'],row['interpretation']=MAP[row['name']]
test('All distinct UC.1 I/O objects have an explicit aggregation or refinement',all(row.get('architecture')for row in all_io.values()))
uc2=[]
for step,io,producer,consumer,flow,source,target in [
 ('1','UC.2.IO.01','UC.2.1','UC.2.2','P-IO.01','P-F.1','P-F.0.5'),
 ('1.1','UC.2.IO.02','UC.2.2','UC.2.3','P-IF.01','P-F.0.5','P-F.0.1'),
 ('1.2','UC.2.IO.03','UC.2.3','UC.2.4','P-IF.08','P-F.0.1','P-F.0.5'),
 ('2','UC.2.IO.04','UC.2.4','UC.2.5','P-IO.08','P-F.0.5','P-F.1')]:
 test('UC2 '+step+' behavior producer and consumer',check(producer,'generates',io) and check(consumer,'receives',io))
 test('UC2 '+step+' architecture endpoints',check(source if not source.startswith('P-F.0.') else ('P-F.0' if flow.startswith('P-IO') else source),'generates',flow) and check(target if not target.startswith('P-F.0.') else ('P-F.0' if flow.startswith('P-IO') else target),'receives',flow))
 uc2.append(dict(step=step,behavior_io=io,producer=producer,consumer=consumer,flow=flow,source=source,target=target))
test('Added UC1 completeness outcome stays within manager review',check('UC.1.9A','generates','UC.1.IO.DQ') and check('UC.1.10','receives','UC.1.IO.DQ'))
test('UC2 architecture path is continuous',all(a['target']==b['source'] for a,b in zip(uc2,uc2[1:])))
D['uc2_traces']=uc2
with(P/'model/UC2_Trace_Matrix.csv').open('w',encoding='utf-8-sig',newline='')as fp:
 w=csv.DictWriter(fp,fieldnames=list(uc2[0]));w.writeheader();w.writerows(uc2)
D['action_io_mapping']=list(all_io.values());D['structural_checks']=checks
(P/'model/architecture.json').write_text(json.dumps(D,indent=2,ensure_ascii=False),encoding='utf-8')
(P/'evidence/structural-and-trace-audit.json').write_text(json.dumps(dict(checks=checks,checks_passed=len(checks),distinct_source_io_objects=len(all_io),traced_events=len(D['traces']),note='Structural graph and declared-path checks. Does not assert operational acceptance or production implementation.'),indent=2),encoding='utf-8')
with(P/'model/UC1_Source_IO_Mapping.csv').open('w',encoding='utf-8-sig',newline='')as fp:
 w=csv.DictWriter(fp,fieldnames=list(next(iter(all_io.values()))));w.writeheader();w.writerows({k:'; '.join(v)if isinstance(v,list)else v for k,v in x.items()}for x in all_io.values())
print('Structural and trace checks passed:',len(checks),'Distinct source I/O objects:',len(all_io),'Traced events:',len(D['traces']))
