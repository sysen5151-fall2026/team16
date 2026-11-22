# PANTRI product risk register

These ratings are provisional engineering judgments about one release cycle from design through classroom use. Have Team 16 review and adopt or revise them. The two value-study prototypes and the classroom build use synthetic data and a simulated supplier.

| ID | Trigger and system consequence | Exposure and model trace | L / C / S / T | I / R | Treatment and evidence |
| --- | --- | --- | --- | --- | --- |
| T6.R1 | Restored order conflicts with its approved draft. Manager could make an incorrect commitment. | Integration and operations. PA.6.3, PC-IF.02, P-PCR.SW.03. | 3 / 3 / 3 / 5 | 4 / 12 | Mitigate. Validate approval, quantity and version. Quarantine records, preserve raw data and export prior verified checkpoint. Negative test checks no writes, dispatch or inventory changes. |
| T6.R2 | Supplier update is missing, late or out of order. Manager may repeat or miss a purchase. | Integration and operations. PC-IF.03, P-F.0.3.4, SR.04. | 3 / 3 / 2 / 4 | 3 / 9 | Preserve association and compare timestamps. Review late-response regression when changing the integration. |
| T6.R3 | Stale inventory or wrong units lead to plausible but incorrect purchasing advice. | Design, integration and operations. P-F.0.1 to P-F.0.2, SR.02. | 2 / 3 / 2 / 4 | 3 / 6 | Show input basis, verify freshness in prepared tests and retain manager approval. |
| T6.R4 | Storage upgrade disrupts access to older records and delays release. | Development and deployment. PA.6.3, P-AFR.20, T6.A and T6.B. | 2 / 2 / 4 / 3 | 3 / 6 | Exercise legacy read and next-write migration, retain readable recovery evidence and run browser release checks. |

I = round((C + S + T) / 3). R = L × I. L, cost C, schedule S and technical impact T use the five-level scales in the report. [Innoslate matrix](https://cloud.innoslate.com/cornell/p/687/diagrams/risk/319805) · [Purchase IDEF0](https://cloud.innoslate.com/cornell/p/687/diagrams/idef0/269322) · [Recovery module](https://cloud.innoslate.com/cornell/p/687/database/entity/297536).

## AI integration risks

The purchase recommendation uses deterministic local rules. The entries below assess design, integration and dependency risks. Quantitative AI production likelihood requires a defined deployment and team judgment.

| ID | Risk | Model reference | Treatment and evidence |
| --- | --- | --- | --- |
| AI-01 | Model output has the expected format but suggests an unsupported quantity. | T6.R3, P-F.0.2, SR.02 | Compare model suggestions to bounded quantities with independent expected values. Preserve manager review. |
| AI-02 | Slow or unavailable model delays purchasing. | P-F.0.2 and PA.5 | Test provider timeout and verified local/manual path before release. |
| AI-03 | Untrusted operational data becomes part of the proposed prompt. | P-F.0.1 to P-F.0.2 | Test that only approved modeled fields cross the interface. |
| AI-04 | Model update changes response shape. | P-F.0.2 to P-F.0.5 | Check versioned schema and fail on invalid responses. |
| AI-05 | Runtime or dependency is abandoned. | PA.6 and proposed model adapter | Review dependency ownership and exercise a replacement path before rollout. |
| AI-06 | Restaurant records leave an approved boundary through a model service, export or logs. | PA.6.1, P-NFR.02 and proposed model interface | Inventory authorized destinations and review observed output at integration. |
| AI-07 | Ask PANTRI receives a well-formed interpretation for the wrong intent, ingredient or period. A user could rely on figures that are correct for a different question. | P-F.0.5.1, PA.5.1, P-AFR.15 and P-AFR.18. Native risk P-TR.05 Model Returns a Well-Formed Incorrect Reply, mitigated by PA.5.1 and PA.2.5. | Validate intent, question wording, ingredient mention, period and role independently. Fall back to keywords or ask for clarification. Build all answers from scoped records through a read-only route. Verification rejected conflicting intents, fabricated ingredients, real ingredients absent from the question, invalid periods and unauthorized requests. |

## Control before operation

The purchase developer owns the discrepancy test in each relevant review. At design review confirm each retained approval and recovery exchange has a failure oracle. On every relevant CI run require all negative cases to block the write and zero extra dispatch events. Before release verify the supported saved-data format, successful resumption after refresh and raw/checkpoint export on fault. A missed block or extra dispatch stops the release. Record a dated reassessment and evidence link in T6.R1 after each review.

## Windows integration evidence

The server reuses the Task 6 consistency checks when loading and committing the JSON envelope. The exercised schema-valid mismatch retained the raw record and a prior verified approval, returned 503 on the dispatch attempt and left the saved bytes intact. The startup, restart, model-unavailable and role checks are recorded in [integration verification](integration-verification.md).

The local model receives only qualitative server-derived facts and returns one advice field. The adapter checks structure, length, numbers, ingredient names and order instructions independently. Stub tests exercise a wrong quantity, a wrong date, a spelled-out number, another ingredient, an order instruction, invalid JSON, timeout and unavailable runtime. Model advice cannot change operational records. The checks cannot prove the advice is sensible; the manager reads it next to PANTRI's calculated summary and still decides. Recent logs contain the model name, elapsed milliseconds and fallback reason. The team still owns deployment risk ratings and native model disposition.

Ask PANTRI sends question text, allowed intents and catalog names to the loopback model for classification. PANTRI treats the question as data, validates the interpretation, enforces role scope and builds the answer from one saved revision. Attempted approval, dispatch, deletion and reset requests left the revision unchanged. The panel identifies the interpretation method, and the support log captures diagnostic metadata without retaining raw questions. Unfamiliar wording can still produce an incorrect interpretation or require clarification. The live evaluation covers a fixed set of questions, and the ordinary workspace provides a direct check of the returned figures. [Assistant verification](integration-verification.md#stage-a--ask-pantri-verification) · [Assistant design](adr/0009-ask-pantri-assistant.md)
