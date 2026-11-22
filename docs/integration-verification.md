# Windows integration verification

Team 16 exercised the local Windows build on November 22, 2026. These results cover the supplied synthetic restaurant, its five demo roles and a single service at a time. The [release contract](../classroom-demo/contracts/pantri-api.yaml), [model baseline](../classroom-demo/docs/model-baseline.md) and [consolidated traceability table](traceability.md) provide the interface and allocation references.

## Integration sequence

The build uses incremental thread integration. Establish seeded records and start the UI-to-API-to-storage purchase thread, then test an intentionally incorrect model reply before expanding to operational roles and recovery. The Ollama response is the least deterministic new interface. The saved approval remains the highest-ranked operational fault from Task 6. Exercise both before accepting the combined product.

~~~mermaid
flowchart LR
  seed["Initialize and inspect state<br/>PA.1, PA.6"] --> purchase["Verify retained approval and dispatch<br/>PA.3; PC-IF.01–03"]
  purchase --> fault["Quarantine a contradictory saved approval<br/>PA.6.3; T6.R1"]
  fault --> model["Contain a well-formed wrong model reply<br/>PA.2, PA.5; explanatory exchange"]
  model --> roles["Exercise scoped sessions and receiving<br/>PA.1, PA.3, PA.6.1"]
  roles --> recovery["Reserve, accept and record pickup<br/>PA.4; P-IF.10/11/20/22"]
  recovery --> report["Display inventory and reporting evidence<br/>PA.5; P-IF.08/09"]
~~~

For the native integration Action Diagram, use the seven actions shown, attach the PA assets as mechanisms and add the corresponding input/output entities. Verify UI/API sessions and the local model exchange as new native interface allocations. The model baseline records those items for the team to edit in Project 687.

## Interface verification record

The contract uses JSON, milliseconds for diagnostic latency, integer USD cents for unit cost, per-ingredient stock units and local demo timestamps. JSON writes must include the same operation ID when retried after a lost response. The server checks media type and caps request bodies at 32,768 bytes before applying any operation. The authorization response precedes business rules. The client reports failures in English and retains the operation ID on a transport failure.

| HTTP exchange | Format, type and units checked | Success and failure behavior exercised | Timing, volume and responsibility |
| --- | --- | --- | --- |
| GET health | Storage and model status objects | Ready file with model disabled, unreachable and ready. Quarantine is separately identified. | Public bounded status. Server reports readiness after background warmup. |
| GET accounts | Five stable IDs and labels | Five distinct roles available before sign-in. | One account list at boot. Server uses the fixed demo account catalog. |
| POST sessions | Account ID and operation ID, opaque bearer response | 201, duplicate sign-in returns the same session. Missing or expired credentials fail protected reads. | One call per role switch. Server binds role and expiry. Client stores the session token and hashed identifiers for unacknowledged writes, without storing form data. |
| GET snapshot | State envelope, role account and storage metadata | Manager full state, staff operational projection, partner-specific views, support null. Unsigned returns 401. Explicit manager reload revalidates the file. | One 132-ingredient manager sample. Server scopes results. Client reloads after role switches and 401. |
| GET support | Log, checkpoint and model status records | Support sees metadata and bounded activity. Business writes and manager diagnostics request are forbidden. | Latest 100 entries in process memory. Server keeps data and bearer values out of diagnostic events. |
| GET inventory | Scoped item summaries with on-hand, reserved and usable quantities | Returns 132 items and supports category, search and stock status. Supplier access fails. | 30 serial reads plus 10 parallel on localhost. Server validates scope and derives summaries. |
| GET inventory/{id} | Ingredient, batches, dated events and units | Sliced beef goes 8→13→12→11 kg. Missing ingredient returns 404. | Per-ingredient response. Client displays the shared state and server owns mutations. |
| POST inventory/records | Movement kind, batch, unit, quantity or counted quantity, optional receipt date/cents | Receiving, waste and count run through the browser. Duplicate receipt is applied once. Wrong type, extraneous empty batch ID, malformed JSON, large body and wrong media type are rejected. | One event and one committed file replacement. Server checks available stock, issued order and per-unit precision. |
| GET drafts | Versioned draft list | Three seeded manager drafts. Staff role has no draft projection or access. | Bounded by demo data. Server scopes the list. |
| GET drafts/{id} | Draft with forecast, usable stock, pack quantity and unit cents | Prime Foods Sliced beef shows 12 kg, 8 kg, 4 kg and 1,450 cents per kg. | One draft. Server provides the canonical stored version. |
| PATCH drafts/{id} | Integer version and edited lines | Concurrent duplicate edit to 5 kg persists Version 2 once. | Client saves its operation ID and server applies the version gate. |
| POST drafts/{id}/refresh | Draft version and operation ID | Refresh delegates to current usable stock and deterministic planning arithmetic. Invalid and stale versions fail. | One calculation and one replacement. Server owns quantity derivation. |
| POST drafts/{id}/approval | Reviewed version and operation ID | Retained Version 2 persists with 5 kg before dispatch. Stale version returns 409. | Approval completes before the client sends the separate dispatch call. |
| GET drafts/{id}/explanation | Optional ingredient ID and response revision | Valid model and calculated fallback both exercised. Read preserves state. | Foreground default 8 s. Server rejects mismatched facts/text and substitutes calculated explanation. |
| GET orders | Role-projected orders and quantities | Prime Foods sees only its sent orders. Another supplier's order fails write scope. | No draft projection for supplier. Server selects records and required labels. |
| POST orders/{id}/dispatch | Approved order ID and operation ID | Approval is durable before send. Timing or retry can leave approved and unsent, and retry records one sent event. | Two ordered writes. Server owns approval and dispatch guards. |
| POST orders/{id}/follow-up-drafts | Order ID and operation ID | Creates a new draft from current inventory and leaves the retained order unchanged. | One new draft per intent. Server returns the draft ID. |
| POST orders/{id}/supplier-events | Response kind, optional local timestamp and note | Confirmed remains Not received at 8 kg. Scope enforcement returns 403. Explicit manager simulation is separate. | Server orders received events by event time and leaves inventory to receiving. |
| GET recoveries | Scoped recovery requests and quantities | Community Food Recovery sees its own request. A request for another partner stays outside its projection. | Server scopes by partner. |
| POST recoveries | Batch ID, quantity, partner and pickup window | A 1 kg request makes 11 kg usable while 12 kg is on hand. | One reservation write. Server rejects expired/unknown batch and excess available quantity. |
| POST recoveries/{id}/partner-events | Accepted or exception, optional local timestamp and note | Partner acceptance changes recorded state. Decline uses the existing exception path. Scope failure is forbidden. | One response write. Server retains reservation until cancellation or pickup. |
| POST recoveries/{id}/collection | Request ID and operation ID | Accepted request deducts 1 kg once, yielding 11 kg. | The partner confirms actual pickup. Server verifies accepted state and applies deduction. |
| POST recoveries/{id}/cancellation | Recovery ID and operation ID | Releases the reservation on an active request and retains the event. | One write. Server checks role and state. |
| GET reports | Today or week query, dated paired metrics and insights | The normal report returns scoped measures. Unknown period returns 400. | A maximum seven-day demo window. Server calculates metrics and UI renders them. |
| GET reports/waste-insights | Period, revision, structured insights and optional explanation | Today shows Sliced beef first after 1 kg waste and opens its recorded Overproduction entry. Model-off shows calculated text. | Same 8 s model deadline after deterministic aggregation. Server checks facts and source. |
| POST demo/reset | Manager operation ID | One reset restores 132 ingredients and three drafts. A delayed same-ID reset leaves newer records and revision intact. Other roles read the new shared state. | Explicit manager control. Client confirms, server resets the prepared data. |
| GET checkpoints/previous | Verified prior state envelope | After a contradictory saved approval, the prior approved quantity is returned. | At most one prior snapshot. Server only exposes it to the manager. |
| GET storage/raw | Retained UTF-8 saved text | Quarantine preserves the original file and rejects the attempted transaction with 503. | Manager export for reconciliation. Server retains the damaged record and does not replay it. |

The OpenAPI file parsed as 3.1.0, resolved its local references and defined **28 operations** matching the handler inventory. The 90 component schemas passed Draft 2020-12 schema checks. A separate live harness validated 56 request and response envelopes across the 28 operations, with all five roles and the documented 400, 401, 403, 404, 409, 413 and 415 responses. The Node test suite verifies the 503 quarantine case and loopback model fault paths.

Inventory read probe on the 132-item post-run state returned 76,983 bytes. The 30 sequential localhost calls had P50 2.25 ms and nearest-rank P95 3.58 ms. All ten overlapping reads succeeded, with a maximum observed duration of 16 ms. These are prepared-fixture request times, not production availability or capacity results.

## Model containment and timing

The adapter used a nonstreaming JSON schema with exact structured facts and approved English candidates. Independent validation rejected structurally valid responses with a wrong monetary amount, a quantity typed as text, an incorrect nested date, an invented ingredient and unapproved prose. It also rejected malformed JSON, missing or extra fields, a redirect, a stalled body and an unavailable endpoint. No model input or output changes inventory, approval or transmission. The interface exposes the calculated summary on fallback and records a reason in the support log.

Windows 11, Node v24.14.1, Ollama 0.40.16, Core i9-13900K, RTX 4090, qwen2.5:3b Q4_K_M. Run node classroom-demo/study/model-timing.mjs with the selected model installed. The cold trials confirm the runner is absent before each call. The daemon had already run earlier requests. Each result used the existing Sliced beef draft and returned validated model text.

| Trial | Cold after runner unload, ms | Warm after preheat, ms |
| --- | ---: | ---: |
| 1 | 2,388 | 582 |
| 2 | 2,364 | 565 |
| 3 | 2,341 | 563 |
| 4 | 2,374 | 567 |
| 5 | 2,366 | 567 |

On the initial host run, all 5 cold foreground calls hit the original 8 s limit. A direct minimal request took 40.69 s once, including 20.77 s reported load and 18.50 s prompt evaluation. The final adapter gives background warmup a 60 s minimum, holds the loaded model for 10 minutes and preserves the 8 s foreground fallback. These results do not establish a general cold startup guarantee.

## Browser workflow

The Windows browser at 1440×900 displayed the five manager pages, Inventory receiving for staff, the supplier and recovery portals and support console. The tested main layout had no horizontal overflow. The manager main content narrowed from 1,305 to 1,145 CSS pixels when the sidebar expanded. The browser console captured zero errors during the tested route. The automated controller fixture exercises the reduced-motion branch and the retained CSS disables transitions and animations for a reduced-motion preference.

The normal demo began with 132 ingredients, three drafts and seven low-stock items. The manager changed 4 kg and $58.00 to 5 kg and $72.50, saved Version 2 and sent the retained approval. The supplier confirmed and the status remained Not received. The staff receipt increased stock from 8 kg to 13 kg. Recording 1 kg Overproduction reduced it to 12 kg, reservation held 1 kg, and pickup reduced on-hand to 11 kg. Today showed Sliced beef first, and the matching waste record was reachable. In a separate inventory check, Beef short rib showed 15.7→15 kg, Physical count, the recorded timestamp, record ID and Restaurant Staff after a browser refresh. The support console showed current revision 10 and checkpoint revision 9 for this run.

## Integration defects and dispositions

| Observed issue | Root cause | Verified disposition |
| --- | --- | --- |
| Supplier events from the partner workspace initially appeared as simulations. | Code defect in the shared event attribution boundary. | Explicit manager simulation and partner submission now retain distinct boolean values and role attribution. HTTP regression checks the recorded source. |
| A supplied empty receipt batch identifier silently created a fresh batch. | Code defect at the request validation boundary. | The contract permits an omitted field. An explicitly empty identifier now returns 400 and leaves revision 0. |
| A delayed retry of an earlier reset could replace a newer run. | Code defect in reset idempotency retention. | Retain reset identifiers across resets and check for replay before replacement. |
| Reloading a tab lost the operation ID for an unacknowledged write. | Code defect in client retry lifespan. | Retain hashed pending intent keys and IDs in the tab session until acknowledged. The original intent reuses its ID after reload. |
| The recovery view could offer the old raw record and reload only in-memory state. | Code defect at the disk recovery boundary. | Expose the observed saved text and provide the manager's explicit revalidation action. Staff cannot invoke it. |
| Reopening a draft continued to show its earlier calculated result after model warmup. | Code defect in explanation cache refresh. | Retry the calculated or failed explanation on re-entry. |
| The first host start needed substantially longer than the foreground explanation deadline. | Interface specification defect in the startup timing budget. | Separate background warmup from the bounded user-facing inference path. Re-run actual cold/warm measurements and keep a deterministic explanation during unavailable states. |

Six findings came from code and one from an interface timing assumption. The bounded release scenarios cover the resulting defects. Operational validation and the native third-level IDEF0 and independent UC.11 views are tracked in the model baseline.

## Repeatable checks

~~~powershell
npm.cmd test --prefix classroom-demo
npm.cmd test
node classroom-demo/study/model-timing.mjs
~~~

The working tree run reported **64/64** classroom checks and **54/54** repository checks, zero failures. The classroom run retains the 23 pre-integration checks. The release sign-in, active model, unreachable model and clean-checkout setup results are recorded below.
