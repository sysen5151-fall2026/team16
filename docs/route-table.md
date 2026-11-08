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
