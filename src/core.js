/* PANTRI UC.1 walking skeleton. Source action IDs are preserved verbatim. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PANTRI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const round = value => Math.round(value * 100) / 100;
  const definitions = [
    ['Restaurant Manager', 'Initiate Purchasing Session', [], [], ['Session']],
    ['Restaurant Manager', 'Request Purchasing Recommendation', ['N.02'], ['SR.02'], ['Purchasing Recommendation Request']],
    ['PANTRI', 'Retrieve Inventory Data', ['N.02'], ['SR.02'], ['Current Inventory']],
    ['PANTRI', 'Retrieve Historical Usage Data', ['N.02'], ['SR.02'], ['Historical Usage Data']],
    ['PANTRI', 'Retrieve Expiration Data', ['N.02'], ['SR.02'], ['Expiration Data']],
    ['PANTRI', 'Generate Demand Forecast', ['N.02'], ['SR.02'], ['Demand Forecast']],
    ['PANTRI', 'Generate Purchasing Recommendation', ['N.02'], ['SR.02'], ['Purchasing Recommendation']],
    ['PANTRI', 'Provide Purchasing Recommendation', ['N.02'], ['SR.02'], ['Purchasing Recommendation']],
    ['Restaurant Manager', 'Review Purchasing Recommendation', ['N.02'], ['SR.02'], ['Reviewed Purchasing Recommendation']],
    ['Restaurant Manager', 'Adjust Purchase Quantities', ['N.03'], ['SR.03A'], ['Adjusted Purchase Quantities']],
    ['PANTRI', 'Update Proposed Purchase', ['N.03'], ['SR.03A'], ['Updated Proposed Purchase']],
    ['Restaurant Manager', 'Approve Purchase Order', ['N.03'], ['SR.03'], ['Order Approval']],
    ['PANTRI', 'Record Order Approval', ['N.03'], ['SR.03'], ['Approved Order Data']],
    ['PANTRI', 'Generate Official Purchase', ['N.03'], ['SR.03'], ['Official Purchase Order']],
    ['PANTRI', 'Send Purchase Order', ['N.03'], ['SR.03'], ['Purchase Order']],
    ['Ingredient Supplier', 'Receive Purchase Order', ['N.03', 'N.04'], ['SR.03', 'SR.04'], ['Received Purchase Order']],
    ['Ingredient Supplier', 'Confirm Purchase Order', ['N.04'], ['SR.04'], ['Order Confirmation']],
    ['Ingredient Supplier', 'Provide Confirmation and Delivery Information', ['N.04'], ['SR.04'], ['Order Confirmation', 'Delivery Information']],
    ['PANTRI', 'Record Supplier Confirmation', ['N.04'], ['SR.04'], ['Supplier Confirmation Report']],
    ['PANTRI', 'Update Order Status', ['N.04'], ['SR.04'], ['Updated Order Status']],
    ['PANTRI', 'Provide Order Status', ['N.04'], ['SR.04'], ['Order Status Information']],
    ['Restaurant Manager', 'Review Order Status', ['N.04'], ['SR.04'], ['Reviewed Order Status']]
  ];
  const ACTIONS = definitions.map((d, i) => ({id: `UC.1.${i + 1}`, actor: d[0], name: d[1], needs: d[2], requirements: d[3], outputs: d[4]}));
  const REQUIREMENTS = {
    'SR.02': {need:'N.02', needName:'Explainable purchasing advice', needText:'I need purchasing advice that I can judge against demand, usable inventory, and expiration information.', text:'PANTRI shall present the expected demand, usable recorded inventory, expiration horizon, and material data limitations used to generate each purchasing recommendation.'},
    'SR.03': {need:'N.03', needName:'Purchasing authority', needText:'I need to review and change proposed purchase quantities and approve the final order before it commits my restaurant.', text:'Upon explicit Restaurant Manager approval, PANTRI shall transmit the final approved purchase order to the Ingredient Supplier without changing its approved quantities.'},
    'SR.03A': {need:'N.03', needName:'Purchasing authority', needText:'I need to review and change proposed purchase quantities and approve the final order before it commits my restaurant.', text:'PANTRI shall allow the Restaurant Manager to revise proposed purchase-order quantities before approval.'},
    'SR.04': {need:'N.04', needName:'Order and exception visibility', needText:'I need to know whether my approved order is confirmed and what requires follow-up when delivery changes.', text:'PANTRI shall present the current recorded confirmation, delivery, or exception status associated with each approved purchase order.'}
  };
  const FIXTURE = {
    scenarioDate:'2026-10-06', horizonDays:2, restaurant:'Demo Buffet Hot Pot Restaurant',
    manager:'Demo Restaurant Manager', supplier:'Demo Ingredient Supplier',
    deliveryWindow:'2026-10-07, 09:00–11:00 America/New_York (simulated)',
    ingredients:[
      {id:'beef', name:'Sliced beef', unit:'kg', usage:[5,6,7], batches:[{id:'B-01',quantity:8,expires:'2026-10-08'},{id:'B-02',quantity:2,expires:'2026-10-05'}]},
      {id:'tofu', name:'Tofu', unit:'kg', usage:[4,5,6], batches:[{id:'T-01',quantity:4,expires:'2026-10-07'},{id:'T-02',quantity:1.5,expires:null}]},
      {id:'mushrooms', name:'Mushrooms', unit:'kg', usage:[3,3,3], batches:[{id:'M-01',quantity:5,expires:'2026-10-10'}]}
    ]
  };
  function assert(ok, message) { if (!ok) throw new Error(message); }
  function validateQuantities(quantities, ingredients) {
    assert(quantities && typeof quantities === 'object' && !Array.isArray(quantities), 'Enter a quantity for every ingredient.');
    assert(Object.keys(quantities).length === ingredients.length, 'The order must contain exactly the scenario ingredients.');
    const clean = {};
    for (const item of ingredients) {
      const value = quantities[item.id];
      assert(typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100000, `${item.name}: enter a finite quantity between 0 and 100000 kg.`);
      assert(Math.abs(round(value) - value) < 1e-9, `${item.name}: use at most two decimal places.`);
      clean[item.id] = value;
    }
    assert(Object.values(clean).some(value => value > 0), 'At least one purchase quantity must be greater than zero.');
    return clean;
  }
  class Skeleton {
    #state; #fixture; #clock;
    constructor(fixture = FIXTURE, clock = () => new Date().toISOString()) {
      this.#fixture = clone(fixture); this.#clock = clock;
      this.#state = {step:0, status:'NOT_STARTED', events:[], inventory:null, usage:null, expiration:null, forecast:null, recommendation:null, draft:null, revised:null, managerDecision:null, approval:null, officialOrder:null, sentOrder:null, supplierReceived:null, supplierConfirmation:null, supplierResponse:null, recordedConfirmation:null, presentedStatus:null};
    }
    snapshot() { return clone(this.#state); }
    fixture() { return clone(this.#fixture); }
    nextAction() { return this.#state.step < ACTIONS.length ? clone(ACTIONS[this.#state.step]) : null; }
    execute(actionId, input = {}) {
      const next = this.nextAction();
      assert(next && actionId === next.id, `Out-of-order action blocked. Next action: ${next ? next.id : 'none (completed)'}.`);
      const s = clone(this.#state), f = this.#fixture;
      let payload;
      switch (next.id) {
        case 'UC.1.1':
          s.session = {id:'DEMO-SESSION-001', restaurant:f.restaurant, manager:f.manager};
          s.status = 'SESSION_OPEN'; payload = s.session; break;
        case 'UC.1.2':
          s.request = {restaurant:f.restaurant,horizonDays:f.horizonDays,scenarioDate:f.scenarioDate};
          payload = s.request; break;
        case 'UC.1.3':
          s.inventory = f.ingredients.map(i => ({id:i.id,name:i.name,unit:i.unit,batches:i.batches.map(b => ({id:b.id,quantity:b.quantity}))}));
          payload = {source:'Prepared restaurant-data fixture (stub)',inventory:s.inventory}; break;
        case 'UC.1.4':
          s.usage = f.ingredients.map(i => ({id:i.id,dailyUsageKg:i.usage}));
          payload = {source:'Prepared historical-usage fixture (stub)',usage:s.usage}; break;
        case 'UC.1.5':
          s.expiration = f.ingredients.map(i => ({id:i.id,batches:i.batches.map(b => ({id:b.id,expires:b.expires}))}));
          payload = {source:'Prepared expiration fixture (stub)',expiration:s.expiration}; break;
        case 'UC.1.6':
          s.forecast = s.usage.map(i => ({id:i.id,averageDailyKg:round(i.dailyUsageKg.reduce((a,b) => a+b,0)/i.dailyUsageKg.length),demandKg:round(i.dailyUsageKg.reduce((a,b) => a+b,0)/i.dailyUsageKg.length*f.horizonDays)}));
          payload = {method:'Deterministic average × horizon; forecasting stand-in, not trained AI',forecast:s.forecast}; break;
        case 'UC.1.7':
          s.recommendation = s.inventory.map(i => {
            const dates = s.expiration.find(x => x.id === i.id).batches;
            const batches = i.batches.map(b => ({...b,expires:dates.find(d => d.id === b.id).expires}));
            const usableKg = round(batches.filter(b => b.expires && b.expires >= f.scenarioDate).reduce((a,b) => a+b.quantity,0));
            const expectedDemandKg = s.forecast.find(x => x.id === i.id).demandKg;
            const warnings = batches.filter(b => !b.expires || b.expires < f.scenarioDate).map(b => `${b.id}: ${b.expires ? 'recorded expired' : 'expiration unknown'}; excluded from demo usable stock`);
            return {id:i.id,name:i.name,unit:i.unit,recordedKg:round(batches.reduce((a,b) => a+b.quantity,0)),usableKg,expectedDemandKg,horizonDays:f.horizonDays,batches,warnings,recommendedKg:round(Math.max(0,expectedDemandKg-usableKg))};
          });
          payload = {recommendation:s.recommendation,limitations:['All records are synthetic.', 'Two-day horizon is a demo assumption.', 'Date filtering is a planning stand-in, not a physical food-suitability assessment.', 'No forecast-accuracy or waste-reduction validation.']}; break;
        case 'UC.1.8':
          s.draft = Object.fromEntries(s.recommendation.map(i => [i.id,i.recommendedKg]));
          s.status = 'DRAFT'; payload = {recommendation:s.recommendation,draft:s.draft}; break;
        case 'UC.1.9':
          assert(input.reviewed === true,'The manager must acknowledge reviewing the recommendation basis.');
          payload = {reviewedBy:f.manager,reviewed:true}; break;
        case 'UC.1.10':
          s.revised = validateQuantities(input.quantities,f.ingredients);
          payload = {previous:s.draft,adjusted:s.revised}; break;
        case 'UC.1.11':
          assert(s.revised,'Adjusted purchase quantities are missing.');
          s.draft = clone(s.revised); payload = {draft:s.draft}; break;
        case 'UC.1.12':
          assert(input.approved === true,'Explicit manager approval is required; an unchecked box is not approval.');
          s.managerDecision = {approved:true,manager:f.manager,restaurant:f.restaurant,quantities:clone(s.draft),approvedAt:this.#clock()};
          s.status = 'APPROVED'; payload = s.managerDecision; break;
        case 'UC.1.13':
          assert(s.managerDecision?.approved === true,'No explicit approval to record.');
          s.approval = clone(s.managerDecision); payload = s.approval; break;
        case 'UC.1.14':
          assert(s.approval?.approved === true,'No recorded approval; official order cannot be generated.');
          s.officialOrder = {id:'DEMO-PO-001',restaurant:f.restaurant,supplier:f.supplier,quantities:clone(s.approval.quantities),approvalReference:s.approval.approvedAt};
          payload = s.officialOrder; break;
        case 'UC.1.15':
          assert(s.approval?.approved === true && equal(s.officialOrder.quantities,s.approval.quantities),'Blocked: order quantities must match explicit recorded approval.');
          s.sentOrder = clone(s.officialOrder); s.status = 'SENT_AWAITING_CONFIRMATION';
          payload = {destination:'In-process supplier adapter (stub)',order:s.sentOrder}; break;
        case 'UC.1.16':
          assert(s.sentOrder,'Supplier cannot receive an unsent order.');
          s.supplierReceived = clone(s.sentOrder); payload = {stub:true,received:s.supplierReceived}; break;
        case 'UC.1.17':
          assert(s.supplierReceived,'Supplier has not received the order.');
          s.supplierConfirmation = {orderId:s.supplierReceived.id,confirmationId:'DEMO-CONF-001',confirmed:true,quantities:clone(s.supplierReceived.quantities)};
          payload = {stub:true,confirmation:s.supplierConfirmation}; break;
        case 'UC.1.18':
          s.supplierResponse = {...clone(s.supplierConfirmation),deliveryWindow:f.deliveryWindow,supplier:f.supplier};
          payload = {stub:true,response:s.supplierResponse}; break;
        case 'UC.1.19':
          assert(s.supplierResponse?.orderId === s.sentOrder.id && equal(s.supplierResponse.quantities,s.sentOrder.quantities),'Supplier response does not match the transmitted order.');
          s.recordedConfirmation = clone(s.supplierResponse); payload = s.recordedConfirmation; break;
        case 'UC.1.20':
          assert(s.recordedConfirmation?.confirmed === true,'An unconfirmed order cannot be marked confirmed.');
          s.status = 'CONFIRMED'; payload = {orderId:s.sentOrder.id,status:s.status}; break;
        case 'UC.1.21':
          s.presentedStatus = {orderId:s.sentOrder.id,status:s.status,confirmationId:s.recordedConfirmation.confirmationId,deliveryWindow:s.recordedConfirmation.deliveryWindow,quantities:clone(s.sentOrder.quantities)};
          payload = s.presentedStatus; break;
        case 'UC.1.22':
          assert(input.reviewed === true,'The manager must acknowledge reviewing the final order status.');
          payload = {reviewedBy:f.manager,reviewedStatus:s.presentedStatus}; break;
      }
      s.events.push({...next,timestamp:this.#clock(),payload:clone(payload)});
      s.step += 1;
      // Commit only after all guards pass; failed actions leave state and audit unchanged.
      this.#state = s;
      return this.snapshot();
    }
    evidence() {
      return {project:'PANTRI',useCase:'UC.1',scope:'Milestone 1 baseline walking skeleton',dataMode:'Synthetic fixtures and in-process supplier stub',scenario:this.fixture(),requirements:clone(REQUIREMENTS),state:this.snapshot(),limitations:['No external order is placed.', 'In-memory run; use Export run evidence before reset or closing.', 'No authentication, real database, API, trained AI, or pilot outcome validation.']};
    }
  }
  return {ACTIONS,REQUIREMENTS,FIXTURE,Skeleton};
});
