# PANTRI UC.1 implementation specification

## Authority and scope

This implementation derives from Team 16's current Business or Mission Analysis (Section 8 primary UC.1, Section 9 Figure 4) and Stakeholder Needs and Requirements (N.02, N.03, N.04; SR.02, SR.03, SR.03A, SR.04; Figure 10). Source records and Innoslate links are in `model/SOURCES.md`.

The TA permits a CLI or minimal UI with placeholder I/O, provided the code demonstrates the selected use case's Action Diagram progression. Milestone criteria permit stubs but require an end-to-end path and model-to-product linkage. The chosen UI is an offline, self-contained HTML file.

The reports describe 12 narrative steps; the existing Action Diagram subdivides them into 22 action entities. Preserve UC.1.1–UC.1.22, the Manager/PANTRI/Supplier assignments and their data handoffs. Do not skip supplier participation. Do not add unrelated business capabilities or claim implementation of the whole PANTRI system.

## Preconditions and boundary

- Current inventory, historical usage and expiration information are available via prepared fixture adapters.
- A Restaurant Manager is operating the demo. Their identity is a placeholder, not authenticated access control.
- The supplier is external to the PANTRI SoI; a deterministic in-process stub implements that external interaction for this milestone.
- Staff entry is represented by preloaded records, not by adding UC.5–UC.8 to UC.1.
- Physical fulfillment, payment, other use cases and a full production architecture remain outside this slice.

## Selected requirements (source wording)

| Need | Requirement | Implementation obligation |
|---|---|---|
| N.02 Explainable purchasing advice | SR.02: PANTRI shall present the expected demand, usable recorded inventory, expiration horizon, and material data limitations used to generate each purchasing recommendation. | Expose the expected demand, stock basis, dates, horizon and limitations of the stand-in calculation. |
| N.03 Purchasing authority | SR.03A: PANTRI shall allow the Restaurant Manager to revise proposed purchase-order quantities before approval. | Quantity edits occur at UC.1.10 and apply to the draft at UC.1.11. |
| N.03 Purchasing authority | SR.03: Upon explicit Restaurant Manager approval, PANTRI shall transmit the final approved purchase order to the Ingredient Supplier without changing its approved quantities. | Explicit approval at UC.1.12; recording at UC.1.13; official order at UC.1.14; send at UC.1.15; exact received values at UC.1.16. |
| N.04 Order and exception visibility | SR.04: PANTRI shall present the current recorded confirmation, delivery, or exception status associated with each approved purchase order. | Demonstrate the normal recorded-confirmation and delivery path at UC.1.17–UC.1.22; full exception-case coverage remains open. |

These requirements retain their source draft status. This is implementation evidence, not stakeholder approval or pilot validation.

## Fixture and forecasting assumptions

Scenario date: 2026-10-06. Horizon: two days. Three hot-pot ingredients use synthetic kg quantities and three daily usage observations. The forecasting stand-in averages the daily observations and multiplies by the horizon. Suggested quantity is `max(0, forecast - demo usable stock)`.

For this demonstration only, a batch contributes to demo usable stock when its recorded expiration date is known and is on or after the scenario date. Recorded expired batches and unknown dates are explicitly shown and excluded. The boundary includes the scenario date. This is a transparent implementation assumption awaiting stakeholder agreement, not a food-handling policy or suitability determination. All dates and deliveries are scenario placeholders, not a live clock-based operational promise.

Input guards accept finite nonnegative kg values with at most two decimal places and a demonstration upper bound of 100000 kg, with at least one positive purchase quantity. The upper bound is an implementation guard, not a sourced stakeholder requirement.

## Workflow and data contracts

`Skeleton.execute(actionId, input)` executes only the next modeled action. Failed guards leave state and events unchanged. `snapshot()` returns defensive copies.

- UC.1.9 and UC.1.22 require `reviewed: true`.
- UC.1.10 requires `quantities: {beef, tofu, mushrooms}`.
- UC.1.12 requires `approved: true`; checkbox acknowledgment plus button click supplies that decision in the UI.
- Approval records retain manager, restaurant, timestamp and final quantities.
- Official, transmitted, supplier-received and confirmed quantities must equal the approved quantities.
- State remains `SENT_AWAITING_CONFIRMATION` until PANTRI records a matching supplier response and executes UC.1.20.
- Manager-facing final status is provided at UC.1.21 and acknowledged at UC.1.22.
- Every executed action records model ID, actor, outputs, need/requirement references and timestamp.

The concrete state machine and fixture/stub code are in `src/core.js`; no network call occurs. The official order handoff is an in-memory message boundary, allowing future replacement with an external adapter.

## Demonstration checks

1. One full run executes all 22 actions and ends with a reviewed confirmed order.
2. Change beef from the 4 kg recommendation to 5 kg before approval. Approval, sent order, supplier receipt and confirmation all retain 5 kg.
3. Unchecked approval and out-of-order transmission are blocked.
4. Negative, blank/nonfinite and overprecision quantities are rejected without corrupting the draft.
5. Awaiting confirmation is distinguishable from a recorded confirmation.
6. Inspect or export the run and trace N.03 → SR.03/SR.03A → relevant actions → matching code cases and outputs.

These checks support the milestone prototype. They do not establish SR.02's 90% interpretation target, SR.03A's 90% unaided task target, SR.04's 95% review target or 100% compliance over real pilot orders. Other requirements are not claimed implemented.
