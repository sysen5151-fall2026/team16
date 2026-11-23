# PANTRI product risk register

Team 16 adopted the conventional baseline ratings on November 22, 2026, for the bounded classroom release. The AI scenario ratings below are the judgments recorded in the Task 6 submission. The two value-study prototypes and the classroom build use synthetic data and a simulated supplier.

| ID | Trigger and system consequence | Exposure and model trace | L / C / S / T | I / R | Treatment and evidence |
| --- | --- | --- | --- | --- | --- |
| T6.R1 | Restored order conflicts with its approved draft. Manager could make an incorrect commitment. | Integration and operations. PA.6.3, PC-IF.02, P-PCR.SW.03. | 3 / 3 / 3 / 5 | 4 / 12 | Mitigate. Validate approval, quantity and version. Quarantine records, preserve raw data and export prior verified checkpoint. Negative test checks no writes, dispatch or inventory changes. |
| T6.R2 | Supplier update is missing, late or out of order. Manager may repeat or miss a purchase. | Integration and operations. PC-IF.03, P-F.0.3.4, SR.04. | 3 / 3 / 2 / 4 | 3 / 9 | Preserve association and compare timestamps. Review late-response regression when changing the integration. |
| T6.R3 | Stale inventory or wrong units lead to plausible but incorrect purchasing advice. | Design, integration and operations. P-F.0.1 to P-F.0.2, SR.02. | 2 / 3 / 2 / 4 | 3 / 6 | Show input basis, verify freshness in prepared tests and retain manager approval. |
| T6.R4 | Storage upgrade disrupts access to older records and delays release. | Development and deployment. PA.6.3, P-AFR.20, T6.A and T6.B. | 2 / 2 / 4 / 3 | 3 / 6 | Exercise legacy read and next-write migration, retain readable recovery evidence and run browser release checks. |

I = round((C + S + T) / 3). R = L × I. L, cost C, schedule S and technical impact T use the five-level scales in the report. [Innoslate matrix](https://cloud.innoslate.com/cornell/p/687/diagrams/risk/319805) · [Purchase IDEF0](https://cloud.innoslate.com/cornell/p/687/diagrams/idef0/269322) · [Recovery module](https://cloud.innoslate.com/cornell/p/687/database/entity/297536).

## AI integration risks

The classroom ratings apply to one release of final integration, using a local model and synthetic data. Local rules calculate purchasing quantities. The model classifies questions and supplies optional explanations. The baseline conventional risks above describe exposure before the new safeguard.

| ID | Risk | Model reference | L / C / S / T | I / R | Team 16 rating basis and controls |
| --- | --- | --- | --- | --- | --- |
| AI-01 | Unsupported quantity | T6.R3, P-F.0.2, SR.02 | 2 / 2 / 1 / 3 | 2 / 4 | Local rules calculate quantities and approval is separate. The validator rejected fabricated quantities in prepared tests. Ask PANTRI produced 40 correct raw interpretations and used fallback for 20. All 60 final interpretations were correct. |
| AI-02 | Model latency or outage | P-F.0.2, PA.5 | 2 / 1 / 1 / 2 | 1 / 2 | Warm Ask PANTRI calls took 118 ms at the median and 150 ms at most. The foreground deadline is 8 s, with separate background warmup of at least 60 s. The classroom suite passed 81/81 with the model on and again with it off. |
| AI-03 | Untrusted prompt input | P-F.0.1 to P-F.0.2, PA.5.1 | 3 / 1 / 1 / 2 | 1 / 3 | The server checks intent, ingredient and period and falls back to keyword handling when validation fails. The read-only route left records unchanged in tests that attempted writes. |
| AI-04 | Response schema drift | P-F.0.2 to P-F.0.5 | 2 / 2 / 2 / 2 | 2 / 4 | The classroom configuration uses the local qwen2.5:3b tag. The adapter rejects incompatible replies and falls back. The reported estimate is up to two days for adapter work and contract tests. |
| AI-05 | Abandoned dependency | PA.6, local model adapter | 1 / 2 / 2 / 2 | 2 / 2 | The classroom package declares no third-party npm dependencies. A fresh Windows checkout ran successfully, and the model-disabled path passed 81/81 checks. |
| AI-06 | Unintended data egress | PA.6.1, P-NFR.02 | 2 / 1 / 1 / 2 | 1 / 2 | The model endpoint is loopback-only. The dataset is synthetic. Log and JSON export destinations had yet to be checked end to end at the time of the assessment. |

[Windows integration verification](https://github.com/sysen5151-fall2026/team16/blob/a031f314dbd3bd17b9e7485935cc732d9840e71e/docs/integration-verification.md) · [Ask PANTRI evaluation](https://github.com/sysen5151-fall2026/team16/blob/a031f314dbd3bd17b9e7485935cc732d9840e71e/docs/integration-verification.md#live-interpretation-evaluation) · [Model-on and model-off checks](https://github.com/sysen5151-fall2026/team16/blob/a031f314dbd3bd17b9e7485935cc732d9840e71e/docs/integration-verification.md#final-review-verification).

## Control before operation

The purchase developer owns the discrepancy test in each relevant review. At design review confirm each retained approval and recovery exchange has a failure oracle. On every relevant CI run require all negative cases to block the write and zero extra dispatch events. Before release verify the supported saved-data format, successful resumption after refresh and raw/checkpoint export on fault. A missed block or extra dispatch stops the release. Record a dated reassessment and evidence link in T6.R1 after each review.
