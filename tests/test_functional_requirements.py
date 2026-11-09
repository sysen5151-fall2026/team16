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
# Test discovery loads both the original App and reference architecture cases.


class OriginalAppRequirements(unittest.TestCase):
 """Primary classroom product: calls the actual embedded PANTRI_App core."""
 @classmethod
 def setUpClass(cls):
  p=subprocess.run([os.environ.get('NODE_BINARY','node'),'tools/original_app_scenario.js'],cwd=ROOT,capture_output=True,text=True,check=True)
  cls.r=json.loads(p.stdout);cls.c=cls.r['checkpoints'];cls.bad={x['name']:x for x in cls.r['rejections']}
 def denied(self,key):
  self.assertFalse(self.bad[key]['ok']);self.assertTrue(self.bad[key]['unchanged'])
 def test_P_AFR_08_original_revision(self):
  self.assertEqual(self.c['initial']['draft']['lines'][0]['managerQty'],4);s=self.c['revised'];self.assertEqual(s['draft']['version'],2);self.assertEqual(s['draft']['lines'][0]['managerQty'],5);self.assertEqual(s['draft']['status'],'draft');self.assertEqual(s['orders'],[])
 def test_P_AFR_08_original_invalid_quantity(self): self.denied('negative-quantity')
 def test_P_AFR_09_original_version_bound_snapshot(self):
  self.denied('stale-approval');o=self.c['approved']['orders'][0];self.assertEqual(o['approvedVersion'],2);self.assertEqual(o['approvedLines'][0]['managerQty'],5);self.assertEqual(o['approvedLines'][0]['unit'],'kg');self.assertIsNone(o['sentAt'])
 def test_P_AFR_10_original_unchanged_send_and_one_commitment(self):
  self.denied('unapproved-send');a=self.c['approved']['orders'][0];s=self.c['sent']['orders'][0];self.assertEqual(a['approvedLines'],s['approvedLines']);self.assertEqual(s['supplierStatus'],'awaiting_confirmation');self.assertEqual(sum(e['kind']=='sent' for e in s['events']),1)
 def test_P_PCR_IO_01_original_sent_edit_rejected(self): self.denied('sent-edit')
 def test_P_AFR_11_original_confirmation_is_not_receipt(self):
  s=self.c['confirmed'];self.assertEqual(s['orders'][0]['supplierStatus'],'confirmed');self.assertEqual(s['orders'][0]['fulfillmentStatus'],'not_received');self.assertEqual(s['stock'],8);self.assertTrue(s['partnerEvents'][0]['simulated'])
 def test_P_AFR_11_original_alternate_states_and_scope(self):
  self.denied('wrong-restaurant')
  for k in ['partial','delayed','exception']:
   s=self.c[k];self.assertEqual(s['orders'][0]['supplierStatus'],k);self.assertEqual(s['orders'][0]['approvedLines'][0]['managerQty'],5);self.assertEqual(s['stock'],8)
 def test_P_AFR_09_original_approval_survives_reload(self):
  self.assertEqual(self.r['rehydrated']['approvedVersion'],2);self.assertEqual(self.r['rehydrated']['approvedLines'][0]['managerQty'],5)

if __name__=='__main__': unittest.main(verbosity=2)
