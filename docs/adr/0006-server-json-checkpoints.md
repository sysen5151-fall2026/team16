# ADR 0006 Server JSON snapshots and recovery

**Decision date** 2026-11-22
**Status** Accepted for the classroom release

## Context

In the classroom browser baseline, Task 6 checks that every approved order still matches its retained draft version and quantities. T6.R1 Inconsistent approved order after recovery is the highest-scored Task 6 risk. All five demo identities now need to read the same record across browser refreshes and a service restart. [ADR 0004](0004-purchase-state-persistence.md) · [Task 6 risk register](../risks.md)

## Decision

Store the versioned current state and the immediately preceding verified checkpoint together in one server-side JSON file. Initialize a missing file from the synthetic classroom seed. Use `PANTRI_DATA_FILE` to point a test or demo process at a separate file. Serialize updates through one process. Validate the candidate, write and flush a temporary sibling file, rename it over the active file and then publish the new revision to clients.

Validate snapshots again when loading from disk, including agreement between approved order lines, approved draft version and retained quantities. If the saved data fails validation, quarantine transaction writes, preserve the raw file and make an independently valid prior checkpoint available for manager download. These artifacts support manual reconciliation so an approval or dispatch committed before an interruption remains visible to the operator. Reset is an explicit synthetic-data operation.

This approach keeps the package dependency-free and lets a grader inspect the evidence with ordinary JSON tools. The verification scope is a single local process. Disaster recovery, total file loss and coordination across writers or hosts require separate controls.

## Model alignment and differences

- PA.1.3 Operational History Module and PA.6.3 Record Recovery Module own retained history and recovery respectively. P-AFR.20 Restore confirmed linked records, P-NFR.03 Preserve Confirmed Records Through Recovery, P-IF.17 Recoverable Operational Snapshot and P-IF.18 Restored Operational State anchor continuity. Review the physical allocation of the active server file, atomic replacement, quarantine and manager downloads.
- PA.3.2 Approval Record Module and PA.3.3 Approved Order Gateway continue to honor PC-IF.02 Retained Approval Reference. Task 6's T6.A versioned snapshot architecture reflects browser persistence. Update its deployment mechanism and link the T6.A.2 Recovery integrity guard to T6.R1 with the server fault-test evidence. P-PCR.SW.03 Recoverable purchase transaction state has a broader verification scope than this classroom case. [Live model baseline](../../classroom-demo/docs/model-baseline.md#risks)
