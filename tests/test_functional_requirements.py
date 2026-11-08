"""Requirement-scoped tests of the real JavaScript prototype via Node.
P-AFR tests cover the prepared behavior below, not full operational acceptance.
No Python reimplementation and no fixed successful response is used.
"""
import json, os, subprocess, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class PurchaseRequirements(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  p=subprocess.run([os.environ.get('NODE_BINARY','node'),'tools/pmc2_scenario.js'],cwd=ROOT,capture_output=True,text=True,check=True)
  cls.result=json.loads(p.stdout);cls.c=cls.result['checkpoints'];cls.errors={e['name']:e for e in cls.result['errors']}
 def denied(self,key):
  self.assertIsNotNone(self.errors[key]['error']);self.assertTrue(self.errors[key]['unchanged'])
 def test_P_AFR_08_revision_is_versioned_and_unapproved(self):
  a,b=self.c['initial'],self.c['revised'];self.assertEqual(b['draft']['version'],a['draft']['version']+1);self.assertEqual(b['draft']['quantities'],{'beef':5,'tofu':6,'mushrooms':1});self.assertIsNone(b['approval']);self.assertNotIn('order',b)
 def test_P_AFR_08_invalid_quantity_preserves_state(self): self.denied('invalid-quantity')
 def test_P_AFR_09_explicit_approval_required(self): self.denied('false-approval')
 def test_P_AFR_09_approval_binds_final_version(self):
  c=self.c['approved'];self.assertEqual(c['approval']['version'],c['draft']['version']);self.assertEqual(c['approval']['quantities'],c['draft']['quantities']);self.assertEqual(c['approval']['restaurant_id'],'R1')
 def test_P_AFR_10_unapproved_and_stale_orders_rejected(self):
  self.denied('unapproved');self.denied('stale-approval');self.denied('wrong-restaurant-send')
 def test_P_AFR_10_sent_lines_match_approved_quantities(self):
  a,s=self.c['approved']['approval'],self.c['sent']['order'];self.assertEqual(s['version'],a['version']);self.assertEqual(s['approval_reference'],a['id']);self.assertEqual({i['ingredient_id']:i['quantity'] for i in s['lines']},a['quantities']);self.assertTrue(all(i['unit']=='kg' for i in s['lines']))
 def test_P_PCR_IO_01_sent_version_edit_is_rejected(self): self.denied('sent-version-edit')
 def test_P_AFR_10_repeat_send_records_one_transmission(self):
  self.assertEqual(sum(t['event_type']=='TRANSMISSION' for t in self.c['sent']['transactions']),1)
 def test_P_AFR_11_confirmation_is_retained_and_presented(self):
  c=self.c['confirmed'];self.assertEqual(c['order']['state'],'CONFIRMED');self.assertEqual(c['views']['P-IF.07']['confirmation_reference'],'C1');self.assertTrue(any(t['event_type']=='SUPPLIER_CONFIRMED' for t in c['transactions']))
 def test_P_AFR_11_absent_response_is_not_confirmed(self):
  self.assertEqual(self.c['sent']['order']['state'],'SENT_AWAITING_CONFIRMATION')
 def test_P_AFR_11_partial_delayed_and_exception_remain_distinct(self):
  for state in ['PARTIAL','DELAYED','EXCEPTION']:
   c=self.c[state.lower()];self.assertEqual(c['order']['state'],state);self.assertEqual(c['views']['P-IF.07']['confirmation_reference'],'SIM-'+state)
 def test_P_AFR_11_invalid_response_preserves_order(self):
  for k in ['wrong-order-response','overwrite-lines','missing-confirmation']:self.denied(k)
 def test_P_NFR_02_prepared_unauthorized_cases_preserve_state(self):
  self.denied('staff-approval');self.denied('wrong-restaurant')
if __name__=='__main__': unittest.main(verbosity=2)
