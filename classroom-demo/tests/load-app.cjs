const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

module.exports = function loadApp() {
  const html = fs.readFileSync(path.join(__dirname, '../PANTRI_Final.html'), 'utf8');
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  if (!script) throw new Error('PANTRI module script not found.');
  const runtimeBoundary = script[1].indexOf("const root=document.getElementById('app');");
  if (runtimeBoundary < 0) throw new Error('The app controller boundary changed.');
  new vm.Script(script[1], { filename: 'PANTRI_Final.html' });

  const context = vm.createContext({ structuredClone });
  const exports = [
    'createSeed', 'editDraft', 'approveDraft', 'sendApprovedOrder', 'recordSupplierEvent',
    'getIngredientSummary', 'createDemoService', 'validateSaved', 'applyInventoryCommand',
    'requestRecovery', 'recordRecoveryEvent', 'cancelRecovery', 'recordCollection',
    'selectOverview', 'reportRange', 'calculateReport', 'selectWastePlanning',
    'selectWasteEvents', 'summarizeWaste', 'paginate', 'eligibleRecoveryBatches', 'STORAGE_KEY',
    'renderOverviewPage', 'renderInventory', 'renderPurchasingPage', 'renderWastePage',
    'renderReportsPage', 'ingredientDetails', 'draftOverlay', 'activityOverlay',
  ];
  new vm.Script(script[1].slice(0, runtimeBoundary) +
    '\nglobalThis.pantri = {' + exports.join(',') + '};').runInContext(context);
  return context.pantri;
};
