"""Check documented interfaces against the executable contract without HTTP claims."""
import json, unittest
from pathlib import Path
import yaml
ROOT=Path(__file__).resolve().parents[1]
class ContractMapping(unittest.TestCase):
 def test_purchase_yaml_preserves_runtime_packet_schemas_and_endpoints(self):
  source=json.loads((ROOT/'contracts/api-v1.json').read_text(encoding='utf-8'))
  target=yaml.safe_load((ROOT/'contracts/api-v1.yaml').read_text(encoding='utf-8'))
  expected=[o for o in source['operations'] if 'P-F.0.3' in o['sources']+o['destinations']]
  self.assertEqual(len(expected),10)
  for op in expected:
   p=target['paths']['/internal/'+op['flow'].lower().replace('.','-')]['post']
   self.assertEqual(p['x-producers'],op['sources']);self.assertEqual(p['x-consumers'],op['destinations'])
   self.assertEqual(p['requestBody']['content']['application/json']['schema'],op['request'])
   self.assertEqual(p['responses']['200']['content']['application/json']['schema'],op['response'])
 def test_second_level_contracts_are_explicitly_design_only(self):
  d=yaml.safe_load((ROOT/'contracts/api-v1.yaml').read_text(encoding='utf-8'))
  for i in range(1,4):
   op=d['paths'][f'/design/purchase/pc-if-0{i}']['post']
   self.assertEqual(op['x-flow-id'],f'PC-IF.0{i}')
   self.assertEqual(op['x-function-id'],f'P-F.0.3.{i}')
   self.assertEqual(op['x-consumer'],f'P-F.0.3.{i+1}')
   self.assertIn('Design only',op['x-status'])
class OriginalProductMapping(unittest.TestCase):
 def test_original_product_operations_reference_actual_functions(self):
  d=yaml.safe_load((ROOT/'contracts/api-v1.yaml').read_text(encoding='utf-8'))
  s=(ROOT/'PANTRI_App.html').read_text(encoding='utf-8')
  for i,name in enumerate(['editDraft','approveDraft','sendApprovedOrder','recordSupplierEvent'],1):
   op=d['paths']['/product/'+name]['post'];self.assertEqual(op['x-function-id'],'P-F.0.3.'+str(i));self.assertIn('function '+name+'(',s);self.assertIn('NOT an HTTP endpoint',op['x-transport'])
 def test_original_app_only_adds_model_annotations(self):
  import hashlib,re
  p=json.loads((ROOT/'evidence/original-app/drive-provenance.json').read_text(encoding='utf-8'))
  s=(ROOT/'PANTRI_App.html').read_text(encoding='utf-8')
  clean,n=re.subn(r'/\*\* PMC2_MODEL: [^\n]* \*/\n','',s)
  self.assertEqual(n,4);self.assertEqual(hashlib.sha256(clean.encode('utf-8')).hexdigest(),p['original_normalized_sha256'])
if __name__=='__main__':unittest.main(verbosity=2)
