# PANTRI function architecture evidence v4

2026-10-25. AI-assisted technical revision. Six-person allocation in the report is SIMULATED; actual contribution confirmation and human review are pending.

## Reproduce

Use Python 3 and install tools/requirements.txt. From this evidence directory run `python tools/audit_model.py --root .`. It writes only the local architecture.json / CSV and audit result; use a working copy to preserve original hashes. Expected: 62 assertions passed, 21 distinct UC1 source I/O objects, 19 UC1 architecture events. UC2 has four additional mapped interactions, not four new architecture flows.

The original core has 52 checks. Ten checks cover current UC2 endpoints/path and the manager-local completeness outcome. A prior run exposed an unmapped newer UC1 object; the repair and scope are recorded in evidence/audit-change-log.json.

Product: run `npm test` and `npm run demo:architecture` from the repository root. Current prepared run: 38 passed (12 retained baseline + 26 architecture tests). Raw output and prepared demo JSON are included. Node 24.19.0. No representative-user or operational acceptance is claimed.

Model snapshot: 339 entities, 2146 relationships. All 228 baseline identities and baseline relationships remain. Four descriptions were already refined by the team (P-IO.08, UC.1, UC.2, UC.1.8); all 339 pre-edit identities and relationships were retained. See model-readback-audit.json for exact hash.

The latest UC2 refinement describes a correction-history view. Current prototype inventory queries do not yet return a complete correction-history view; structural mapping is not a software acceptance claim. P-AVT cases remain Not Run.

Figure 1a/1b and 9a–9f are model-derived readable ICOM detail projections, not screenshots of newly edited native layouts. Every boundary flow and every internal source/target incidence is covered. J-IF.xx refers to the same P-IF.xx on companion detail pages. Original native overviews and five UC1 trace figures are retained.

Access was verified with the signed-in team account. Independent grader-account access and human pencil review remain pending. Do not submit the simulated contribution table as actual contributions.
