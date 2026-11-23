# Purchase state persistence for the PANTRI classroom build

**Decision date** 2026-11-21  
**Scope** Single active writer, single restaurant, same browser origin and a simulated supplier.  
**Status** Selected for the classroom release and implemented in [PR #4](https://github.com/sysen5151-fall2026/team16/pull/4). The November 22 Task 6 report records Team 16’s adoption of the planning scenario and swing weights.

## Context

Main at 76b2c89 persisted a single browser record and provided no prior checkpoint. No prior decision on the next recovery architecture surfaced in the repository, shared Drive search or related email search. The older S1/S2 simulation considered queueing and used different timing boundaries.

## Decision

Adopt a versioned localStorage envelope containing a current snapshot and the immediately preceding verified snapshot. Migrate on the next successful write after reading an existing state. Quarantine inconsistent approved orders, retain the exact saved bytes and offer an export of a validated prior checkpoint for reconciliation. The application blocks transaction writes in quarantine. Reconciliation is manual because replacing the current state with a prior one could hide a completed approval or supplier dispatch.

The Windows Chromium 158 experiment exercised the real approval and simulated dispatch domain transitions and varied only the storage adapter. Each candidate passed 30/30 normal readback signatures. P95 of two saves and their domain transitions was 2.4 ms for A and 8.4 ms for B. Estimated 12-month labor cost is USD 400 for A and USD 760 for B at an assumed USD 40/h. These are planning estimates. The value model gives A 84.00 and B 65.33 on a 100-point scale. The raw weights are 80, 40 and 60 for normal readback integrity, persistence wait and incremental life-cycle cost. The 12-month planning scenario uses an $800 cap and 20 available engineering hours. Raising the integrity weight from 44.44% to 70% retains A because the measured normal integrity outcomes were tied. Candidate B was tested on normal readback only. Its recovery gate is unverified. An expanded recovery experiment could separate the two designs. With 70% weight on integrity, unchanged cost and wait values, and B holding 100 on integrity, the two designs would tie if A’s integrity score fell to 85.6. See the integrated report and raw samples in evidence/task6.

## Alternative and consequences

B uses one IndexedDB readwrite transaction for the two checkpoints and waits for transaction completion before publishing state. It would require asynchronous startup and UI state transitions, legacy import, upgrade and blocked-open handling, and browser tests for aborted transactions and multi-writer behavior. Reconsider B if concurrent writing, larger records or transactional updates across multiple records become required.

A leaves both snapshots in one browser record. Total record loss, browser eviction and concurrent writers remain outside the validated scope. Do not claim full P-PCR.SW.03 coverage from the bounded tests.

## Traceability

- [Versioned snapshot architecture](https://cloud.innoslate.com/cornell/p/687/diagrams/asset/319800) and [transactional alternative](https://cloud.innoslate.com/cornell/p/687/diagrams/asset/319804).
- [Purchase IDEF0](https://cloud.innoslate.com/cornell/p/687/diagrams/idef0/269322), PA.3.2, PA.3.3, PA.6.3, PC-IF.02, and P-PCR.SW.03.
- [Raw browser measurements](../../evidence/task6/normal-storage-samples.csv).
- `classroom-demo/tests/original-purchasing.test.cjs` covers migration and rejection of a schema-valid quantity mismatch.
