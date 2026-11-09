# Primary product: original PANTRI_App.html

2026-11-08 review/adoption: this product is the classroom UI from Drive file 1SrqhizVi4SRNGfkZ9Xod9E2k0jVsW0tc. Its UI and business code are retained; only four PMC2_MODEL JSDoc comments were added. The provenance hash and contract test enforce this. PANTRI_PMC2.html and its orders.js table below are now reference evidence, NOT the primary product.

| Function ID | Actual primary product implementation | Requirement ID | Python test in tests/test_functional_requirements.py |
|---|---|---|---|
| P-F.0.3.1 / PA.3.1 | PANTRI_App.html::editDraft(state,id,version,edits) | P-AFR.08; P-PCR.F.01 bounded behavior | OriginalAppRequirements.test_P_AFR_08_original_revision; test_P_AFR_08_original_invalid_quantity |
| P-F.0.3.2 / PA.3.2 | PANTRI_App.html::approveDraft(state,id,version,operationId) | P-AFR.09; P-PCR.F.02 bounded behavior | OriginalAppRequirements.test_P_AFR_09_original_version_bound_snapshot; test_P_AFR_09_original_approval_survives_reload |
| P-F.0.3.3 / PA.3.3 | PANTRI_App.html::sendApprovedOrder(state,id,operationId) | P-AFR.10; P-PCR.F.03 bounded behavior | OriginalAppRequirements.test_P_AFR_10_original_unchanged_send_and_one_commitment |
| P-F.0.3.4 / PA.3.4 | PANTRI_App.html::recordSupplierEvent(state,event) | P-AFR.11; P-PCR.F.04 bounded behavior | OriginalAppRequirements.test_P_AFR_11_original_confirmation_is_not_receipt; test_P_AFR_11_original_alternate_states_and_scope |
| P-F.0.3.1 | PANTRI_App.html::editDraft | P-PCR.IO.01 sent edit criterion | OriginalAppRequirements.test_P_PCR_IO_01_original_sent_edit_rejected |

`tools/load_original_app.js` extracts and executes the actual embedded business layer for tests. The UI continues using those same embedded functions; the adapter is test-only, not a substituted product implementation. Function JSDoc in the HTML and adapter explain ICOM state inputs, control/version gates and outputs. The primary product exposes camelCase local state transitions; contracts/api-v1.yaml /product operations document those actual signatures. /internal paths describe the separate reference architecture, not messages emitted by the original UI.

Original product amount: one Sliced beef line, 8 kg stock, 12 kg two-day demand, 4 kg suggested, revised to 5 kg v2 and $72.50. Do not use the reference CLI's three-ingredient fixture as a claim about this UI.

Production authentication and full P-PCR.SW.02 percentage criteria are not established by a prepared manager demo. All model Draft/Planned states remain unchanged.

---

## Preserved reference architecture evidence (not primary UI)

# PMC2 purchase coordination traceability

Runtime base: function-architecture 62c3ad0. Model reference: 2026-11-01 local snapshot and 2026-11-03 online review; live model must be rechecked. Tests below call the real JS implementation from Python. They establish bounded prepared behavior, not full operational acceptance.

| Function ID | Module path and symbol | Requirement ID | Python test in tests/test_functional_requirements.py |
|---|---|---|---|
| P-F.0.3.1 | src/architecture/orders.js: revise | P-AFR.08 | test_P_AFR_08_revision_is_versioned_and_unapproved; test_P_AFR_08_invalid_quantity_preserves_state |
| P-F.0.3.2 | src/architecture/orders.js: approve | P-AFR.09 | test_P_AFR_09_explicit_approval_required; test_P_AFR_09_approval_binds_final_version |
| P-F.0.3.3 | src/architecture/orders.js: transmit | P-AFR.10 | test_P_AFR_10_unapproved_and_stale_orders_rejected; test_P_AFR_10_sent_lines_match_approved_quantities; test_P_AFR_10_repeat_send_records_one_transmission |
| P-F.0.3.4 | src/architecture/orders.js: response | P-AFR.11 | test_P_AFR_11_confirmation_is_retained_and_presented; test_P_AFR_11_invalid_response_preserves_order |
| P-F.0.3 / PA.3 | src/architecture/index.js: gate | P-NFR.02 (prepared subset only) | test_P_NFR_02_prepared_unauthorized_cases_preserve_state |

Component design crosswalk: P-PCR.F.01-04 correspond respectively to the four rows above. These are NOT full verified claims for P-PCR.F: durable retention, complete policies and dispatch implementation remain unverified. P-PCR.SW.02's 100% denial / 95% legitimate-completion thresholds require predeclared nonzero sets and complete verification; the two negative unit cases do not establish those metrics.

The authoritative executable contract remains contracts/api-v1.json. api-v1.yaml exposes operations for its purchase-related flows and separately marks PC-IF.01-03 as design-only internal exchanges. There is no deployed HTTP API.

## Preserved earlier UC.1 behavior mapping

# Model-to-product traceability

Each model action is executed by its matching `case` in `src/core.js`, recorded as a run event and displayed by `src/app.js`. No new model entity identifiers have been invented. Select a row in the UI model view or inspect the exported event with the same ID.

## Requirement slice

| Need | Requirement | Modeled actions | Executable evidence | Limit |
|---|---|---|---|---|
| N.02 | SR.02 | UC.1.2鈥揢C.1.9 | Input retrieval events; recommendation fields and batch dates; horizon and assumptions shown | Synthetic inputs and forecasting stand-in; no 90% interpretation validation |
| N.03 | SR.03A | UC.1.10鈥揢C.1.11 | Quantity form and revised/draft event payloads | No representative-user unaided task-rate validation |
| N.03 | SR.03 | UC.1.12鈥揢C.1.16 | Explicit approval; official/sent/received order; exact quantity comparison | Local stub handoff, not external ordering or real pilot compliance |
| N.04 | SR.04 | UC.1.16鈥揢C.1.22 | Separate supplier receipt/response, recorded confirmation, status and manager review | Normal confirmation only; partial/delayed/no-confirmation/exception cases remain open |

## Every Action Diagram entity

| Source action ID | Actor | Action | Source need / requirement | Output in the executable run |
|---|---|---|---|---|
| UC.1.1 | Restaurant Manager | Initiate Purchasing Session | UC.1 context / UC.1 context | Session |
| UC.1.2 | Restaurant Manager | Request Purchasing Recommendation | N.02 / SR.02 | Purchasing Recommendation Request |
| UC.1.3 | PANTRI | Retrieve Inventory Data | N.02 / SR.02 | Current Inventory |
| UC.1.4 | PANTRI | Retrieve Historical Usage Data | N.02 / SR.02 | Historical Usage Data |
| UC.1.5 | PANTRI | Retrieve Expiration Data | N.02 / SR.02 | Expiration Data |
| UC.1.6 | PANTRI | Generate Demand Forecast | N.02 / SR.02 | Demand Forecast |
| UC.1.7 | PANTRI | Generate Purchasing Recommendation | N.02 / SR.02 | Purchasing Recommendation |
| UC.1.8 | PANTRI | Provide Purchasing Recommendation | N.02 / SR.02 | Purchasing Recommendation |
| UC.1.9 | Restaurant Manager | Review Purchasing Recommendation | N.02 / SR.02 | Reviewed Purchasing Recommendation |
| UC.1.10 | Restaurant Manager | Adjust Purchase Quantities | N.03 / SR.03A | Adjusted Purchase Quantities |
| UC.1.11 | PANTRI | Update Proposed Purchase | N.03 / SR.03A | Updated Proposed Purchase |
| UC.1.12 | Restaurant Manager | Approve Purchase Order | N.03 / SR.03 | Order Approval |
| UC.1.13 | PANTRI | Record Order Approval | N.03 / SR.03 | Approved Order Data |
| UC.1.14 | PANTRI | Generate Official Purchase | N.03 / SR.03 | Official Purchase Order |
| UC.1.15 | PANTRI | Send Purchase Order | N.03 / SR.03 | Purchase Order |
| UC.1.16 | Ingredient Supplier | Receive Purchase Order | N.03, N.04 / SR.03, SR.04 | Received Purchase Order |
| UC.1.17 | Ingredient Supplier | Confirm Purchase Order | N.04 / SR.04 | Order Confirmation |
| UC.1.18 | Ingredient Supplier | Provide Confirmation and Delivery Information | N.04 / SR.04 | Order Confirmation, Delivery Information |
| UC.1.19 | PANTRI | Record Supplier Confirmation | N.04 / SR.04 | Supplier Confirmation Report |
| UC.1.20 | PANTRI | Update Order Status | N.04 / SR.04 | Updated Order Status |
| UC.1.21 | PANTRI | Provide Order Status | N.04 / SR.04 | Order Status Information |
| UC.1.22 | Restaurant Manager | Review Order Status | N.04 / SR.04 | Reviewed Order Status |

## Live N.03 trace

Open the original Needs and Requirements documents in Innoslate. Point to N.03 and SR.03/SR.03A. Show UC.1.10鈥揢C.1.16 in the original Action Diagram. Run the prototype, change beef from 4 to 5 kg, explicitly approve and execute the supplier receipt. Expand the events or compare their exported payloads. The revised, approved, transmitted and received values match 5 / 6 / 1 kg. Open the corresponding `case` in `src/core.js` to show the actual code.

## Outputs and stub boundaries

Source green I/O entities are represented by JSON payloads in the event log. Restaurant fixtures provide retrieval inputs at UC.1.3鈥揢C.1.5. The deterministic forecast provides UC.1.6 output. The supplier adapter consumes the actual sent-order payload at UC.1.16 and returns confirmation and delivery information at UC.1.17鈥揢C.1.18. Those outputs are then recorded inside PANTRI at UC.1.19鈥揢C.1.21. The event log exposes this handoff without omitting the supporting actor.

Workflow progress, reset and export are demonstration/evidence controls, not additional restaurant business capabilities. Data persistence, authentication, production integrations, all other use cases and pilot acceptance tests are not claimed implemented.

## 2026-11-08 completion of direct product witness

`PANTRI_PMC2.html` now runs `src/pmc2-ui.js` against the same `orders.js` and public role/scope gate used by the Python tests. `src/architecture/pmc2-session.js` fixes the independent prepared data to 4/6/1 kg. `tests/pmc2-ui.test.js` exercises the delivered bundle, rejects blank revisions and stale approval, and checks the exported result. This is a DOM-adapter test, complemented by actual in-app browser evidence under evidence/pmc2.

Additional requirement cases: `test_P_AFR_11_absent_response_is_not_confirmed`, `test_P_AFR_11_partial_delayed_and_exception_remain_distinct`, and `test_P_PCR_IO_01_sent_version_edit_is_rejected`. The latter addresses the live component IO.01 criterion that already-sent edits be rejected without changing the session.

The November 8 live model check confirms P-DFR.03 -> P-F.0.3 / PA.3, four one-to-one mechanism mappings, component functional/I-O/interface examples and P-NFR.02 -> P-PCR.SW.02 Equivalence. See live-model-audit-20261108.json for the exact observed text. No model verification status was promoted.
