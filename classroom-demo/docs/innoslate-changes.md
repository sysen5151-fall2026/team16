# PANTRI Innoslate change plan

Project [687, Pantri](https://cloud.innoslate.com/cornell/p/687/dashboard). On November 22, 2026, the model owner approved items 1–9 and selected P-F.0.5.1. Use the next available model number in each established family. For UC.11 the Restaurant Manager initiates recovery, with SEQ.R01 and ADR 0003 preserved as a separate related scenario. In D.1 the approved statuses are Working for Ingredient Supplier and Recovery Partner and Partial for PANTRI Staff.

## Review basis and change record

The archived export `PANTRI_model_2026-11-22.xml` was generated on November 22, 2026 at 07:32:52 according to its XML header. After sign-in, Project 687 produced a fresh read-only export, `PANTRI_model_live_2026-11-22.xml`, with header time 19:28:11 and SHA-256 `ebc10fc907c0c628e546cede9a93b258c267bd26d0c4a9ea61f2b1c8157768a4`. Its serialized database section matched the [repository baseline](model-baseline.md) export exactly. Both have **672 entities, 4,582 relationship records and 58 native diagram records**. The recent P-F.0.3.3 Hierarchy layout update is already present in both exports. The D.1 colors and diagram listings were also checked directly in the live project. Both XML files remain outside the repository.

The numbers listed for existing entities are their model numbers. Parenthesized numbers are the internal Innoslate entity IDs. Names in the proposed rows are approval candidates. For new entities, the table or item shows the applicable numbering family where the archive establishes one. Confirm the free number or obtain the model owner's numbering decision in the live project before creation. Preserve every existing entity, relationship, number and name. Bring any conflicting live edit, change of authority, rename or removal to the model owner for a decision.

The project owner approves each item. The identified editor records the existing state before editing, then reopens the relevant entity and diagram views to verify the saved result. After each approved change, add the actual before and after, America/New_York timestamp with offset, internal IDs and screenshot or native export filename to the record below. Use evidence cropped to the model without credentials or personal information. Record the product commit and actual command output when adding software verification evidence.

## 1. Select and model one level-three functional decomposition

**Archived before.** [P-F.0.5.1 Accept Information Tasks](https://cloud.innoslate.com/cornell/p/687/database/entity/269332) is an Action and leaf of P-F.0.5 (269331). PA.5.1 Information Request Module (297531) `performs` it, and the Action `satisfies` P-AFR.15 (269393). [P-F.0.3.3 Transmit Approved Purchase Orders](https://cloud.innoslate.com/cornell/p/687/database/entity/269325) is an Action and leaf of P-F.0.3 (269322). PA.3.3 Approved Order Gateway (297379) `performs` it. It already receives PC-IF.02 Retained Approval Reference (297382) and P-IF.21 Purchase Record Retention Result (269360), and generates PC-IF.03 Order Dispatch Outcome (297383). The archive contains no numbered third-level function.

**Live check.** Both Actions remain leaves. P-F.0.3.3 has a [saved native Hierarchy layout](https://cloud.innoslate.com/cornell/p/687/diagrams/hierarchy/269325). Neither candidate has a saved third-level IDEF0 view.

| Candidate | Proposed scope and diagram boundary |
| --- | --- |
| **P-F.0.5.1 (recommended)** | Shows the new assistant path and makes its authority and fallback visible on the poster. The level-three scope is the assistant path within the existing information-task function. The parent retains its general scoped request responsibility, and P-F.0.5.2/.3 retain their presentation responsibilities. |
| **P-F.0.3.3** | Extends the accepted purchase architecture with stronger existing ICOMs and directly illustrates the highest operational risk. Proposed child Actions are Check Retained Purchase Approval, Retain Approved Order Dispatch, and Return Recorded Dispatch Outcome. Use the retained version and approved quantities, authorization and purchase retention result as controls, PA.3.3 and PA.6.3 as mechanisms, and the existing PC-IF.03 and P-IO.11 outcomes. Model the assistant exchanges in the system interface and UC.2 views if this function is selected. |

If P-F.0.5.1 is selected, use Actions under its established dotted hierarchy and place them in the following order. Select their actual numbers after the live review. For each row, link the parent `decomposed by` the child, the child `receives` and `generates` its Input/Outputs, and the named Asset `performs` the child. Use the existing IDEF0 relationship configuration for receiving controls, preserving input and trigger behavior.

| Proposed Action name | Inputs and outputs | Controls and mechanisms |
| --- | --- | --- |
| Receive Natural-Language Question | Browser question → validated question and request snapshot revision, or boundary error. | Role session, HTTP schema, origin and body limits, service integrity. REST boundary and PA.5.1. |
| Interpret Information Question | Validated question and scoped ingredient-name catalog → candidate intent, ingredient name and period, or local model failure signal. | Allowed intents, untrusted question text, loopback and foreground deadline. Model adapter and local runtime from items 2–3. |
| Validate Interpretation and Select Fallback | Candidate and original question → accepted interpretation, deterministic keyword result, help or ambiguity/denial path. | Exact keys, intent/role/ingredient/period checks and agreement with question evidence. PANTRI interpretation validator in PA.5.1. |
| Retrieve Authorized Answer Records | Checked scope → pertinent stock, dates, drafts, orders, waste or recovery records from the captured role projection. | Role and restaurant policy, selected intent, original snapshot revision and availability. PA.5.1 with PA.6.1 and operational records. The HTTP handler captures and scopes state before interpretation. |
| Compose Grounded Information Answer | Relevant records or controlled denial/help state → PANTRI answer, items, interpretation source and suggestions. | Domain calculations, units, result limits and read-only route. PA.5.1 and the assistant panel, with presentation traces to P-F.0.5.2/.3 where applicable. |

**Views and check.** The functional model editor creates the selected pair, native Hierarchy and IDEF0 rooted at the chosen Action, and reviews them in the current [P-F.0 Hierarchy](https://cloud.innoslate.com/cornell/p/687/diagrams/hierarchy/265005) and [P-F.0 IDEF0](https://cloud.innoslate.com/cornell/p/687/diagrams/idef0/265005). The poster owner verifies the third level and its ICOMs, and captures both saved diagrams. For the assistant, check the real route, interpreter and answer modules and exercise the model and keyword paths. For dispatch, check the retained Version 2 approval, separate successful persistence and the contradictory-approval rejection. [Integration evidence](../../docs/integration-verification.md)

## 2. Allocate the implementation assets

**Archived before.** [PANTRI System](https://cloud.innoslate.com/cornell/p/687/database/entity/198986) has six subsystem Assets with logical modules already allocated. The archive has no explicit assets for the classroom REST host, file lifecycle, local model boundary or assistant. The portals represent roles that already have canonical external actor Assets in D.1. The proposed software mechanisms use those actors in the behavior views.

Each row proposes an **Asset** with a model-owner-approved number in the applicable `PA` hierarchy. Add `decomposed by` from the owning subsystem, `performs` to the allocated Action, and `satisfies` to any requirement whose scope the asset implements. The existing logical modules provide allocation context.

| Proposed Asset | Host subsystem and function allocation | Proposed description |
| --- | --- | --- |
| Node REST Service Boundary | PA.6 (297376), with P-F.0.6.1 Apply Restaurant Access Policies (269336), P-F.0.6.2 Monitor Service and Exceptions (269337) and P-F.0.5.1 (269332) for the assistant handler. | One loopback Node process owns the HTTP contract, bounded JSON validation, role checks, route dispatch and diagnostics. The business functions retain their respective domain responsibilities. |
| JSON State Store with Prior Checkpoint | PA.6, with P-F.0.6.3 Restore Confirmed Records (269338), P-F.0.6.4 Export Authorized Handover Records (269339) and P-F.0.1.3 Preserve Operational History (269316). | Persist the shared current state and prior verified checkpoint. On integrity failure, quarantine transactions and retain exact raw bytes and checkpoint readback for manual reconciliation. |
| Local Language Model Adapter with Containment Checks | PA.2 (297372), with P-F.0.2.2 Derive Purchasing Advice (269319), P-F.0.5.2 Present Planning Information (269333) and P-F.0.5.1 (269332). | Client adapter for the local model. Validate advice and use PANTRI calculated fallback. The assistant interpretation module independently validates the candidate and can fall back to keywords. |
| Ask PANTRI Assistant Panel | PA.5 (297375), with P-F.0.5.1 (269332) and P-F.0.5.2 (269333). | Manager and restaurant staff user interface for scoped questions and grounded answers. Shows how the question was understood and clears conversation on reload or role change. |
| Demo Role Sessions | PA.6, with P-F.0.6.1 (269336). | In-process passwordless classroom accounts and constrained role/partner data projections. A server restart requires sign-in again. |
| Supplier Portal | PA.3 (297373), with P-F.0.3.4 Maintain Supplier Order State (269326). | Limit each workspace to one synthetic supplier organization and expose its sent orders and associated supplier responses. Inventory increments when restaurant staff records an actual receipt. |
| Recovery Portal | PA.4 (297374), with P-F.0.4.2 Record Recovery Responses (269329) and P-F.0.4.3 Maintain Recovery Exception State (269330). | The registered partner sees assigned requests and records acceptance, decline/exception or actual pickup. The manager separately initiates requests and may cancel. |
| Support Console | PA.6, with P-F.0.6.2 (269337). | Read-only workspace for process, storage and model health, prior checkpoint metadata and recent operation and error diagnostics. Reconciliation remains a team operation. |

**Views and check.** The physical architecture editor adds the mechanisms to the [PANTRI System Hierarchy](https://cloud.innoslate.com/cornell/p/687/diagrams/hierarchy/198986), then checks downstream IDEF0 and integration views. Verify each new asset has at least one function link, the owning subsystem shows it, and the appropriate role or API path exercises it. The supplier catalog, registered recovery partner, and restart behavior should use current Stage B evidence before being recorded as verified. [Release traceability](../../docs/traceability.md) · [Implementation ADRs](../../docs/adr)

## 3. Add assistant exchanges and the local-model conduit

**Archived before.** P-CX.1 (198999) connects PANTRI System (198986) and Restaurant Manager (198989), transferring P-IO.01 Planning and Information Requests (265011) and P-IO.08 Inventory and Expiration Information (265018) among other flows. P-CX.2 (199006) connects PANTRI System and Restaurant Staff (199005) and transfers the staff records, acknowledgments and interaction-state flows. P-C.1.5 Inventory view (297396) transfers P-IF.01 Inventory View Query (269340) and P-IF.08 Scoped Inventory View Data (269347). P-IF.16 Authorized Task Constraints (269355) is an existing control. The archive contains no assistant-specific Input/Output or local-model Conduit.

| Proposed entity type and name | Proposed exchange description and relationship |
| --- | --- |
| Input/Output · Natural-Language Information Request | Browser → PANTRI, `POST /api/assistant/questions`, JSON `AssistantQuestion` with one `question` string of 1–300 characters. Scope and authorization come from the manager/staff session. Existing P-CX.1 and P-CX.2 `transfer` it within their role boundaries. Trace to P-IO.01 for the manager's planning/information exchange. |
| Input/Output · Interpreted Information Request | Internal PANTRI output of validation/fallback. Normalized intent, nullable `ingredientId` and period, source `model`/`keywords`/`none`, plus controlled denial/ambiguity context where applicable. Tie the generating validator to the consuming PANTRI lookup and answer Actions. Its normalized interpretation appears in the response schema. |
| Input/Output · Grounded Information Answer | PANTRI → browser, `AssistantResponse` with `revision`, `understoodBy`, `interpretation`, `answer`, `suggestions`. Facts, units and numbers come from the scoped revision. Record the contract outcomes for sign-in, forbidden role/origin, invalid request, body size/type and unavailable storage. P-CX.1 and P-CX.2 `transfer` the scoped answer. |
| Input/Output · Local Model Interpretation Request and Input/Output · Local Model Interpretation Candidate | Two directed messages. PANTRI sends the question, allowed intents and scoped ingredient names under an exact response shape. Ollama returns only candidate `intent`, `ingredient` and `period` or fails within the configured deadline. Link via `generates`/`receives` before PANTRI validates and normalizes. |
| Input/Output · Local Model Advice Context and Input/Output · Local Model Advice Candidate | Two directed messages for the existing explanation feature. Qualitative facts enter the model and a candidate `advice` string returns. PANTRI checks it and supplies independent calculated text. Trace to P-AFR.05 and P-AFR.16. |
| Asset · Local Ollama Runtime and Conduit · Local Model Exchange | Reuse any equivalent live runtime Asset or add the proposed Asset to the local deployment view. The Conduit `connects to` the PANTRI model adapter and local runtime and `transfers` the four model messages. The runtime executes the candidate-generation Actions. The common local Ollama `/api/chat` exchange is loopback-only, defaults to `qwen2.5:3b` and uses a foreground deadline of eight seconds by default. |

Confirm numbering within the existing architecture Input/Output (`P-IO`/`P-IF`) and Conduit (`P-C`/`P-CX`) families with the architecture owner, including the local-runtime deployment placement. Keep the internal interpretation/result flows distinct from the browser schemas. Verify that the current signed-in role's records are scoped before use and a quarantined store yields 503. The OpenAPI assistant operation specifies 200, 400, 401, 403, 413, 415, 500 and 503. The Ollama calls are an internal interface. [OpenAPI contract](../contracts/pantri-api.yaml) · [Assistant HTTP tests](../tests/http.test.cjs)

**Views and check.** The interface editor updates the [system Asset/I² view](https://cloud.innoslate.com/cornell/p/687/diagrams/asset/198986) and item 1 diagrams, then checks every Conduit's endpoints and carried messages against the contract. The API owner verifies the browser route and local thread separately, including disabled/unavailable model fallback. Save the I² view or fresh XML and attach the contract check excerpt.

## 4. Add the grounding obligation and attach verification

**Archived before.** [N.02 Explainable purchasing advice](https://cloud.innoslate.com/cornell/p/687/database/entity/246338) is a Statement `traced to` [SR.02 Review the basis of purchasing advice](https://cloud.innoslate.com/cornell/p/687/database/entity/246356), a Requirement. SR.02 is already `traced to` P-AFR.05 Provide purchasing advice basis (269373), P-AFR.15 Scope information requests (269393), and P-AFR.16 Present reviewable planning results (269395). Their Test Cases are P-AVT.05 (269374), P-AVT.15 (269394), and P-AVT.16 (269396). P-AFR.18 Apply scoped task authorization (269399) already has P-AVT.18 (269400). These requirements cover advice basis, scope, presentation and authorization. The archive does not state both model authority and numeric provenance as a testable obligation.

**Proposed Requirement · Ground model-assisted information in PANTRI records.** “PANTRI shall compute each numerical fact in model-assisted information from authorized PANTRI records and deterministic domain rules. Language-model output shall neither supply these numerical facts nor modify quantities, orders, approval, transmission, or inventory records.” Confirm a free number in the allocated-functional requirement family with the owner. Add `traced to` from SR.02 to this derived requirement so the N.02 chain is visible. Keep existing requirements and their verification links. Set `satisfied by` to P-F.0.5.1, P-F.0.5.2, P-F.0.2.2 and the applicable assets from item 2. If the live project has an equivalent explicit obligation, reuse it and add only the missing trace or evidence links.

| Proposed native Test Case or reuse | Evidence to attach and what it establishes |
| --- | --- |
| **Verify Read-Only Grounded Assistant Answers** → `verifies` grounding Requirement and the applicable clauses of P-AFR.15/.16. | Classroom API test compares live inventory facts, checks 11 kg after the full route, and checks unchanged saved records/revision. Link actual browser/model-off readback. |
| **Verify Model Interpretation Containment and Fallback** → `verifies` grounding Requirement and P-AFR.15. | Assistant HTTP stubs exercise well-formed wrong ingredient/period/intent, injected commands, malformed replies, timeout and unavailability. Link the recorded 40-question run with 30/40 canonical raw interpretations, ten fallback cases and 40/40 final interpretations on that prepared set, and the November 22 review rerun with 48 questions (34/48 raw, 48/48 final) after the keyword corrections. |
| **Verify Calculated Quantities with Checked Model Advice** → `verifies` grounding Requirement and P-AFR.05/.16. | Adapter and HTTP tests exercise invalid advice, unsupported numbers/order instructions, calculated fallback and unchanged state. Explanatory text remains advisory and quantity calculation stays in PANTRI. |
| Reuse **P-AVT.18** for a bounded authorization addendum. | Attach allowed manager/staff and denied unauthenticated/other-role requests, staff purchase restriction, partner-specific supplier/recovery scope and current Stage B results when run. Keep the prepared checks separate from native criteria for broader authorized use. |
| Reuse **P-AVT.12–.14** (269388, 269390, 269392) for a bounded recovery addendum. | Attach registered-partner, acceptance, exception/cancellation and collection evidence as applicable after checking item 7's authority discrepancy. Test the reservation and on-hand invariants separately. |

**Views and check.** The requirements editor verifies the need-to-requirement trace in [Stakeholder Requirements](https://cloud.innoslate.com/cornell/p/687/documents/246353) and the [integrated system specification](https://cloud.innoslate.com/cornell/p/687/database/entity/297538), then verifies the Test Cases' reciprocal `verified by` links. The test owner attaches the command, commit, scenario scope, dated results and artifact reference. Use the project's Test Case numbering convention after live comparison. The Stage A run is recorded software evidence for its own revision. Stage B and final verification evidence must be attributed to their own actual runs. [Integration verification](../../docs/integration-verification.md)

## 5. Model the plausible wrong reply and complete the Task 6 mitigation trace

**Archived before.** The nine Risk entities include P-TR.01 Incomplete or stale ingredient records (265032) and T6.R3 Planning input is stale or inconsistent (319813). Their trigger is distinct from a plausible model reply that misinterprets valid input. [T6.R1 Inconsistent approved order after recovery](https://cloud.innoslate.com/cornell/p/687/database/entity/319807) belongs to [T6.RISK PANTRI Purchase Risk Assessment](https://cloud.innoslate.com/cornell/p/687/database/entity/319805), with the baseline's score of 12. The archive has no `mitigated by` link to [T6.A.2 Recovery integrity guard](https://cloud.innoslate.com/cornell/p/687/database/entity/319822), an Asset under T6.A (319800).

- **Proposed Risk · Model Returns a Well-Formed Incorrect Reply.** A parsed model response can select a different permitted intent, ingredient or period, or offer unsupported advice. An incorrect answer may mislead a user even when record values and purchase authority remain controlled. Confirm the risk numbering and qualitative ratings with Team 16. Add `mitigated by` to the adapter/checking mechanisms from item 2, and `relates` to the grounding Requirement and containment Test Cases in item 4. Record residual exposure when language remains ambiguous despite response and provenance checks.
- **Existing Risk · T6.R1 (319807).** Add `mitigated by` to existing Asset T6.A.2 (319822). Attach bounded evidence for the original browser guard and the current server quarantine. The server case keeps the conflicting raw bytes and preceding verified checkpoint, rejects dispatch with 503 and avoids new writes. Link the dated evidence to P-AVT.20 (269404) and P-V.PCR.SW.03 (297605) as appropriate. Full P-PCR.SW.03 verification still requires its declared reference set of at least 50 linked records and interruption and retry checks.

**Views and check.** The risk owner verifies the formal T6.R1 edge in the [Task 6 Risk Matrix](https://cloud.innoslate.com/cornell/p/687/diagrams/risk/319805) and Risk entity record, confirms the appropriate general risk grouping for the new model risk, and checks links to mitigations and executed evidence. Capture the risk record with the saved relationship and the exact test names and results. [Risk register](../../docs/risks.md) · [Persistence ADR](../../docs/adr/0004-purchase-state-persistence.md)

## 6. Review the D.1 OpsCon statuses

**Live before.** [D.1 PANTRI Universe Context](https://cloud.innoslate.com/cornell/p/687/diagrams/asset/198996) is an Asset (198996) with seven child Assets in XML. The current diagram showed the same colors as the baseline. Supplier and recovery were yellow for Partial, and PANTRI Staff was gray for Not yet built.

| Asset | Baseline status | Proposed classroom status and basis |
| --- | --- | --- |
| 1.1 PANTRI System (198986) | Partial | Partial. Shared records, local model and workflows operate in a single synthetic restaurant. |
| 1.2 Restaurant Manager (198989) | Working | Working. Review, approval, inventory, assistant and recovery coordination in the prepared workflow. |
| 1.3 Diners (198990) | Not yet built | Not yet built. The prepared dataset supplies covers and availability observations. |
| 1.4 Ingredient Supplier (198991) | Partial | Working for the classroom workflow. Prime Foods, Fresh Fields Produce and Pantry Supply Co. each responded to its own order in the Windows verification. |
| 1.5 Recovery Partner (198992) | Partial | Working for the classroom workflow. Windows verification covered selecting the registered Community Food Recovery partner, accepting the request and recording pickup. |
| 1.6 PANTRI Staff (198994) | Not yet built | Partial. Support diagnostics operate. Manual reconciliation and the native recovery authority policy still require team handling. |
| 1.8 Restaurant Staff (199005) | Working | Working. Receiving, waste, count correction and scoped assistant answers in the prepared workflow. |

**Views and check.** The OpsCon owner confirms the scope and legend, then adjusts the three proposed color changes in D.1 after approval. Confirm the seven shapes and existing actor identities in the saved view. Store a cropped before and after for the poster and note the evidence commit. [Baseline status table](model-baseline.md#operational-context) · [Classroom workflow evidence](../../docs/integration-verification.md#browser-workflow)

## 7. Detail UC.11 Action, Sequence and Activity

**Archived before.** [UC.11 Recovery Partner Processes Waste Collection Request](https://cloud.innoslate.com/cornell/p/687/database/entity/199022) is an Action with a narrative and no `decomposed by` child Actions. Its performer is legacy Recovery Partner Asset (199051), explicitly an alias of canonical 1.5 (198992). [SEQ.R01](https://cloud.innoslate.com/cornell/p/687/diagrams/sequence/299065) is a separately rooted Action (299065). It models a scoped support command before the request. The demo gives the manager initiation and cancellation under its classroom session policy. Confirm the manager/support authority decision with the model owner before editing. Preserve the existing SEQ.R01 and ADR 0003 policy trace as their own architecture scenario.

**Proposed Action children.** Use the existing use-case Action numbering style under UC.11 after live number confirmation. Set input/output direction with `generates`/`receives`, and `performs` with the existing participant Assets and PANTRI mechanisms.

| Proposed Action name | Description, handoff and performer |
| --- | --- |
| Prepare Authorized Collection Request | Authorized manager/PANTRI handoff selects a batch, registered partner, quantity/unit and window. PA.4.1 Recovery Request Module (297528) and P-F.0.4.1 (269328) reserve 1 kg in the prepared run, with 12 kg on hand and 11 kg usable. Model this as an entry handoff if the owner retains the current Recovery Partner and PANTRI participant boundary. |
| Review Assigned Collection Request | Scoped Recovery Partner reads the matching request, window and batch context. Use P-IO.12 Waste Collection Requests (265022) and P-CX.4 (199002). |
| Record Collection Response | Partner accepts or declines with request association and event evidence. P-F.0.4.2 (269329) and PA.4.2 Recovery Exchange Module (297529) retain response via P-IO.06 (265016). On hand stays at 12 kg. |
| Report and Resolve Collection Exception | Reference UC.12 (199023) and current UC.15 (199026) support policy. In the classroom path, a decline yields Exception and holds the 1 kg reservation. A separately authorized manager cancellation releases it without an on-hand deduction. Trace to P-F.0.4.3 (269330) and PA.4.3 Recovery State Module (297530). |
| Record Physical Pickup | Partner records collection only after pickup of the accepted request. PANTRI retains one collection movement and records Collected. The prepared run drops on-hand from 12 to 11 kg and releases the reservation. |
| Review Retained Collection Status | Manager views the collected request and batch movement in PANTRI. Reuse P-IO.13 Recorded Order and Collection Status (265023), P-IF.11 Recorded Recovery State (269350), P-IF.20 Recovery Transaction Record (269359) and P-IF.22 Recovery Record Retention Result (269361) in their established directions. |

Add a `relates` trace to SEQ.R01 and to adjacent UC.8 (199019) and UC.12 after owner approval. Keep UC.8 as waste-record context. Its 1 kg discarded movement and separately available 1 kg collection reservation are separate stock events. Relate the applicable Actions to P-AFR.12–.14 (269387, 269389, 269391). Reuse P-IF.10 Recorded Recovery Context (269349) to show the PA.1/PA.4 interface.

**Views and check.** The UC owner opens new native Action, Sequence and Activity views on UC.11 (199022), verifies the request and response order in Sequence, and verifies the acceptance/pickup and decline/cancellation branches in Activity. In the Action view verify participant lanes, message associations and distinct waste, reservation and collection evidence. Save all three views, attaching the classroom success and exception traces with stock invariants. [UC.11 demo script](use-cases/uc-11-recovery-partner-processes-waste-collection-request.md) · [Recovery authorization ADR](../../docs/adr/0003-recovery-request-authorization.md)

## 8. Add the optional assistant path to UC.2

**Archived before.** [UC.2 Restaurant Manager Reviews Inventory Status](https://cloud.innoslate.com/cornell/p/687/database/entity/199013) is an Action with 13 child Actions, including UC.2.3A Retrieve Expiration Data (273090), UC.2.3B Assemble Inventory Status (273091), UC.2.5 Review Inventory Status (272736), and the UC.2.6–.11 retained correction path. UC.2.5 generates UC.2.IO.08 Reviewed Inventory Context (273099), consumed by UC.2.6 (273092). The existing Sequence and Activity views are recorded in the baseline. UC.2 already `satisfies` P-AFR.16 (269395).

**Proposed additions.** Add an optional Action **Ask PANTRI About Inventory** performed by the existing Manager lane Asset (199041, alias of 198989), and an optional **Provide Grounded Inventory Answer** performed by the PANTRI lane Asset (199042, alias of 198986). Use the UC.2 Action numbering family, and confirm the suffix placement with the owner. Reuse the question and answer entities from item 3, reference P-IF.01/P-IF.08 for inventory context, and relate the answer to P-F.0.5.1. Show the optional ask/answer interaction alongside the inventory review, with no extra trigger on UC.2.5 or UC.2.6 and the existing correction route intact. If the native graph cannot represent that optional path while preserving the existing control edges, stop for the UC owner's decision on modeling it as a related scenario.

**Views and check.** The UC owner reviews the [Action](https://cloud.innoslate.com/cornell/p/687/diagrams/action/199013), [Sequence](https://cloud.innoslate.com/cornell/p/687/diagrams/sequence/199013) and [Activity](https://cloud.innoslate.com/cornell/p/687/diagrams/activity/199013) views. Show the current Sliced beef answer as **11 kg on hand** after the complete classroom route and **8 kg** immediately after reset. Match the answer to the same inventory revision and keep the existing Beef short rib correction path with **15.7 → 15 kg** intact. Verify the keyword and model paths and attach the saved views and relevant read-only test evidence. [UC.2 demo script](use-cases/uc-2-restaurant-manager-reviews-inventory-status.md) · [Classroom route](../../docs/DEMO_SCRIPT.md)

## 9. Build the native integration Action Diagram

**Archived before.** The export contains separate interaction, purchase simulation and Task 6 records, with no matching native integration Action root identified. The Windows integration record defines seven successive activities. Keep the first fault probes ahead of the broad role and recovery exercise.

**Proposed Action root · PANTRI Classroom Integration Verification.** Confirm the numbering family for an integration Action root and its seven child Actions. For each stage, set `decomposed by` from the root and `performs` from the mechanisms, and link inputs via `receives` and outputs via `generates`. Reuse the named I/O entities for their native payloads. If new evidence handoff Input/Outputs are needed to show the control order, confirm names and numbering with the integration owner.

| Proposed child Action | Mechanisms | Inputs → outputs and evidence |
| --- | --- | --- |
| Initialize and Inspect Seeded State | PA.1, PA.6, JSON checkpoint store | Prepared seed → ready HTTP and storage state, 132 ingredients and 3 drafts. |
| Verify Retained Approval and Dispatch | PA.3, REST boundary, JSON checkpoint store | PC-IF.01 (297381) and explicit final approval → PC-IF.02 (297382), then PC-IF.03 (297383). Confirm approved Version 2 and 5 kg precede dispatch. |
| Quarantine Contradictory Saved Approval | PA.6.3 (297536), JSON checkpoint store | Schema-valid inconsistent approval → 503, preserved raw bytes and verified prior checkpoint. Trace to the original T6.A.2 guard (319822), T6.R1 and current server evidence from item 5. |
| Contain Well-Formed Incorrect Model Reply | PA.2, PA.5, model adapter and runtime, assistant panel | Advice and interpretation fixture candidates → rejected unsafe candidate, calculated or keyword fallback, independent values and unchanged records. Develop this risk check before completing normal flow verification. |
| Exercise Scoped Sessions and Receiving | PA.1, PA.3, PA.6.1 (297534), session and supplier portal assets | Authorized sessions and sent/confirmed order → recorded physical receipt and 13 kg on hand. Confirm supplier-only scope and restart sign-in where exercised. |
| Reserve, Accept and Record Pickup | PA.4, recovery portal, REST boundary, JSON checkpoint store | P-IF.10 (269349), P-IO.12 (265022) and P-IO.06 (265016) → P-IF.11 (269350), .20 (269359) and .22 (269361). Check recorded exception and pickup separately. |
| Display Inventory and Reporting Evidence | PA.5, assistant panel, REST boundary | P-IF.08 (269347) and P-IF.09 (269348) → reports and grounded 11 kg answer after the collected request. |

**Views and check.** The integration owner opens the native Action Diagram, confirms action order and inspects the mechanisms and each input/output link. Tie the fault Actions to the actual dated verification evidence from items 4 and 5 and verify the combined run's reporting output. Capture the saved diagram for the poster and export the linked records for the Stage E comparison. [Integration sequence and evidence](../../docs/integration-verification.md#integration-sequence)

## Model change record

The authenticated export and direct diagram checks establish the before-state. Final live readback on 2026-11-22 after the edits: the project holds 719 entities, the 672 before-state entities plus the 47 new entities listed below, so no entity was removed. The pre-edit export `PANTRI_687_stageD_before_2026-11-22.xml` matched the preceding entity and relationship counts. D.1's modified timestamps refreshed, with the same layout and image. The project feed showed no intervening content edit.

| Item | Confirmed live before | Saved after and entity IDs | Timestamp with offset | Screenshot or export filename |
| --- | --- | --- | --- | --- |
| 1. Decomposition selection and views | Both were leaves. P-F.0.3.3 had a saved Hierarchy layout. | P-F.0.5.1.1–.5 (319892–319896) `decompose` P-F.0.5.1 with their inputs, outputs, controls and performers. Hierarchy and IDEF0 layouts are saved on P-F.0.5.1 (269332). | 2026-11-22 15:15–15:46 −05:00 | Live readback of 269332 diagrams `LML_HIERARCHY` and `IDEF0_DIAGRAM` |
| 2. Implementation assets | Existing PA modules match the baseline. | PA.2.5, PA.3.5, PA.4.4, PA.5.4 and PA.6.5–.8 (319897–319904) `decompose` their subsystems and each `performs` at least one function. | 2026-11-22 15:17–15:42 −05:00 | Live entity readback |
| 3. Exchanges and conduit | Existing interface records match the baseline. | P-IO.18–.19 and P-IF.25–.31 (319905–319913), PA.2.6 Local Ollama Runtime (319914) and conduit P-C.2_5.2_6 (319915) carrying the four model messages. P-IO.18/.19 are transferred by P-CX.1 and P-CX.2. P-IF.28 Local Model Advice Context is generated by P-F.0.5.2 Present Planning Information and received by INT.01.4, added after the independent review; P-IF.29 is received by INT.01.4. | 2026-11-22 15:17–15:46 and 17:20 −05:00 | Live entity readback |
| 4. Grounding and verification | Existing requirements and verification anchors match the baseline. | P-AFR.22 (319916) traced from SR.02 and satisfied by P-F.0.5.1, P-F.0.5.2, P-F.0.2.2 and the new assets. P-AVT.22–.24 (319917–319919) verify it together with P-AFR.15/.16/.05. | 2026-11-22 15:28–15:46 −05:00 | Live entity readback |
| 5. Model risk and Task 6 guard | Nine risks. T6.R1 and T6.A.2 had no direct link. | T6.R1 (319807) `mitigated by` T6.A.2 (319822). New P-TR.05 Model Returns a Well-Formed Incorrect Reply (319920) `mitigated by` PA.5.1 and PA.2.5. | 2026-11-22 15:14 and 15:29 −05:00 | Live entity readback |
| 6. D.1 statuses | Live colors match the baseline. | D.1 (198996) layout: 1.4 Ingredient Supplier and 1.5 Recovery Partner green (Working); 1.6 PANTRI Staff yellow (Partial); 1.1 yellow, 1.2 and 1.8 green, 1.3 gray unchanged. | 2026-11-22 15:32 −05:00 | Live readback of the D.1 `LML_ASSET` fills |
| 7. UC.11 behavior views | No child Actions or saved native views on UC.11. | UC.11.1–.7 (319921–319927), including the decision UC.11.7 Was Collection Request Accepted?. Action and Activity layouts are saved on UC.11 (199022). The Sequence view is generated from these Actions and shows the Manager, Recovery Partner and PANTRI lifelines; its message labels overlap and the layout is not separately saved. UC.11 `relates` to INT.01.6, UC.8, UC.12 and SEQ.R01. | 2026-11-22 15:36–15:43 −05:00 | Live readback; Sequence view checked in the browser |
| 8. UC.2 assistant path | Thirteen child Actions and three native views. | **Not added for this release (team decision, November 22, 2026).** UC.2.12 Ask PANTRI About Inventory (319936), UC.2.13 Provide Grounded Inventory Answer (319937) and UC.2.15 Review Grounded Inventory Answer (319941) exist with performers and I/O and are kept as a related assistant scenario, traced through P-F.0.5.1 and P-AFR.22. They are not children of UC.2, and UC.2 (199013) is unchanged: version 43, last modified 2026-11-02 by its owner. The UC.2 demo script shows the assistant as an additional entry point outside the modeled UC.2 steps. UC.2.12 `receives` the existing UC.2.IO.08 Reviewed Inventory Context, so that existing Input/Output gained one new relationship; UC.2.IO.08 itself was not renamed or renumbered. | — | — |
| 9. Integration Action Diagram | No matching native integration Action root identified. | INT.01 PANTRI Classroom Integration Verification (319928) with INT.01.1–.7 (319929–319935) in execution order; Action layout saved. | 2026-11-22 15:41–15:44 −05:00 | Live readback of 319928 `LML_ACTION` |

### Allocated model numbers

| Item | Model number | Internal ID | Entity |
| --- | --- | --- | --- |
| 1 | P-F.0.5.1.1 | 319892 | Receive Natural-Language Question |
| 1 | P-F.0.5.1.2 | 319893 | Interpret Information Question |
| 1 | P-F.0.5.1.3 | 319894 | Validate Interpretation and Select Fallback |
| 1 | P-F.0.5.1.4 | 319895 | Retrieve Authorized Answer Records |
| 1 | P-F.0.5.1.5 | 319896 | Compose Grounded Information Answer |
| 2 | PA.6.5 | 319897 | Node REST Service Boundary |
| 2 | PA.6.6 | 319898 | JSON State Store with Prior Checkpoint |
| 2 | PA.2.5 | 319899 | Local Language Model Adapter with Containment Checks |
| 2 | PA.5.4 | 319900 | Ask PANTRI Assistant Panel |
| 2 | PA.6.7 | 319901 | Demo Role Sessions |
| 2 | PA.3.5 | 319902 | Supplier Portal |
| 2 | PA.4.4 | 319903 | Recovery Portal |
| 2 | PA.6.8 | 319904 | Support Console |
| 3 | P-IO.18 | 319905 | Natural-Language Information Request |
| 3 | P-IO.19 | 319906 | Grounded Information Answer |
| 3 | P-IF.25 | 319907 | Interpreted Information Request |
| 3 | P-IF.26 | 319908 | Local Model Interpretation Request |
| 3 | P-IF.27 | 319909 | Local Model Interpretation Candidate |
| 3 | P-IF.28 | 319910 | Local Model Advice Context |
| 3 | P-IF.29 | 319911 | Local Model Advice Candidate |
| 3 | P-IF.30 | 319912 | Validated Question and Scoped Revision |
| 3 | P-IF.31 | 319913 | Scoped Answer Records |
| 3 | PA.2.6 | 319914 | Local Ollama Runtime |
| 3 | P-C.2_5.2_6 | 319915 | Local Model Exchange |
| 4 | P-AFR.22 | 319916 | Ground model-assisted information in PANTRI records |
| 4 | P-AVT.22 | 319917 | Verify Read-Only Grounded Assistant Answers |
| 4 | P-AVT.23 | 319918 | Verify Model Interpretation Containment and Fallback |
| 4 | P-AVT.24 | 319919 | Verify Calculated Quantities with Checked Model Advice |
| 5 | P-TR.05 | 319920 | Model Returns a Well-Formed Incorrect Reply |
| 7 | UC.11.1–UC.11.7 | 319921–319927 | Prepare Authorized Collection Request; Review Assigned Collection Request; Record Collection Response; Report and Resolve Collection Exception; Record Physical Pickup; Review Retained Collection Status; Was Collection Request Accepted? |
| 9 | INT.01 | 319928 | PANTRI Classroom Integration Verification |
| 9 | INT.01.1–INT.01.7 | 319929–319935 | Initialize and Inspect Seeded State; Verify Retained Approval and Dispatch; Quarantine Contradictory Saved Approval; Contain Well-Formed Incorrect Model Reply; Exercise Scoped Sessions and Receiving; Reserve, Accept and Record Pickup; Display Inventory and Reporting Evidence |
| 8 | UC.2.12 | 319936 | Ask PANTRI About Inventory |
| 8 | UC.2.13 | 319937 | Provide Grounded Inventory Answer |
| 8 | UC.2.15 | 319941 | Review Grounded Inventory Answer (UC.2.14 is unused; the team kept these Actions out of the UC.2 Action diagram) |
