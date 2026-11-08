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
