# Primary entry-point audit: PANTRI_App.html

Adopted from the actual Drive classroom product on 2026-11-08. This table supersedes the previous primary-product designation below; historical tables are retained as reference only.

| Actual UI entry | Handler in PANTRI_App.html | Model use case | Function | Status |
|---|---|---|---|---|
| Inventory > Sliced beef details | getIngredientSummary / selectInventory | UC.2 | P-F.0.1 / P-F.0.5 supporting context | Implemented |
| Purchasing > Review draft > Save changes | draft form submit -> editDraft | UC.1 | P-F.0.3.1 | Implemented; versioned, unapproved |
| Review & approve > Approve & send (demo) | approve-send click -> approveDraft, then sendApprovedOrder in separate commits | UC.1 | P-F.0.3.2 and .3 | Implemented; snapshot saved before send attempt |
| Orders > Simulate supplier response > Apply simulated response | supplier form submit -> recordSupplierEvent | UC.9 PANTRI boundary portion | P-F.0.3.4 | Implemented; simulated only; no stock receipt |
| Record receiving | inventory-record form -> applyInventoryCommand(kind=receipt) | UC.5 | P-F.0.1 | Separate from confirmation; not used to pretend confirmation is delivery |
| Demo tools > Download JSON | exportDemoState / download | Session evidence | Supporting control | Exports actual records and approved snapshots |
| Demo tools > Reset demo | createDemoService.resetDemo | Demo setup | Supporting control | Isolated original dataset reset |

No HTTP business routes or live supplier service are claimed. The test adapter runs the same embedded core as the browser. External interfaces and IAM remain prototype limitations.

---

## Previous product/reference entry tables

# Entry point to use case audit

Baseline read from Team 16 main commit 5e83b1fb66de4eb4f0338a164399fbb69af8af5a on 2026-10-23. The existing application is an offline HTML/JavaScript demo; it exposes no HTTP API endpoints. The list below includes its user controls and the new architecture demonstration.

| Entry point | Source | Disposition |
|---|---|---|
| next button and acknowledgments | UC.1 | Execute the next UC.1.1-UC.1.22 action; review/approval gates apply. |
| quantity inputs and adjustment submission | UC.1 / SR.03A | Revise unapproved ingredient quantities. |
| run tab and model tab | UC.1 demonstration | Navigate between the run and its behavior model; no business state mutation. |
| action and requirement inspection buttons | UC.1 trace review | Inspect modeled action and source requirements; no new operational use case. |
| reset button | UC.1 demonstration setup | Clear the isolated demo session; no production record deletion. |
| download run JSON | UC.1 demonstration evidence | Export this session evidence; does not claim SR.15 production handover. |
| node tools/run_architecture_demo.js | UC.1 first-level refinement | Exercise the modeled planning, revision, approval, retention, handoff and recorded-response path. |
| createArchitecture API | UC.1-UC.15 architecture prototype | In-process test adapter; no HTTP routes, external server or credentials added. |

No unsupported business endpoint was found in the inspected source. UC.2-UC.15 are covered by the architecture and selected prepared module checks, but no complete operational GUI for those use cases is claimed. Developer test/build/stub-generation commands are verification tooling, not business entry points.

## PMC2 selected branch

| Actual entry point | Handler | Use case | Functions | Status |
|---|---|---|---|---|
| node tools/pmc2_scenario.js | createArchitecture in src/architecture/index.js | UC.1 prepared purchase scenario | P-F.0.3.1-4 | Executable CLI; no network purchase |
| quantity/approval/next controls in PANTRI_Milestone1.html | src/app.js and src/core.js | UC.1 | Behavior demo; see separate architecture CLI for P-F.0.3 module evidence | Existing offline UI; not claimed to invoke orders.js |

The original UI and architecture CLI are separate execution surfaces. Do not present UI clicks as proof that orders.js was called. The PMC2 CLI is the direct executable witness for the selected module. Model flow-down and production authorization remain separate checks.

## Current PMC2 product (2026-11-08)

Open `PANTRI_PMC2.html` offline. It bundles `src/pmc2-ui.js`, `src/architecture/pmc2-session.js` and the actual architecture modules. This new interface, CLI and Python tests now share the same purchase implementation; the original Milestone1 HTML remains a separate legacy product.

| Product control / entry | Actual handler | Use case | Function | State |
|---|---|---|---|---|
| Save revised draft | pmc2-ui.js -> index.revise -> orders.revise | UC.1 | P-F.0.3.1 | Implemented; blank/invalid/sent-version edits rejected |
| Record approval | pmc2-ui.js -> index.approve -> orders.approve | UC.1 | P-F.0.3.2 | Implemented; explicit current-draft approval |
| Transmit approved order | pmc2-ui.js -> index.transmit -> orders.transmit | UC.1 | P-F.0.3.3 | Implemented; retained approval required |
| Record supplier response | pmc2-ui.js -> index.supplierResponse -> orders.response | UC.1 | P-F.0.3.4 | Implemented with simulated supplier input |
| Export run evidence | pmc2-ui.js | Evidence for UC.1 | Supporting control | Downloads actual session; no production handover claim |
| Reset demo session | pmc2-ui.js -> createPreparedSession | Prepared UC.1 setup | Supporting control | Resets isolated in-memory demo |

There are no HTTP business routes in this offline UI. This does not turn design PC-IF HTTP paths into deployed services.
