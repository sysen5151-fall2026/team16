# Classroom demonstration — about 2 minutes 20 seconds

Open the offline HTML and your original Innoslate model before visitors arrive. The prototype's Model & traceability view includes the existing Action and Asset images as a fallback. Use Reset demo between visitors; export evidence first if the run needs to be retained.

## 20 seconds — SoI and scope

“PANTRI is a restaurant ingredient-planning system. It uses inventory, usage and expiration records to recommend purchases, while the restaurant manager retains approval authority. Our milestone implementation covers the ingredient-ordering use case, UC.1. The manager and supplier are external participants; restaurant records and supplier replies are simulated for this demonstration.”

## About 1 minute — Run the skeleton

Execute the numbered actions with the main button. Each click runs the current action, not just an animation.

- UC.1.1–UC.1.8: initiate/request, retrieve inventory/usage/expiration, generate forecast/recommendation and present it. Point out synthetic data and two-day horizon.
- UC.1.9: acknowledge reviewing the basis. UC.1.10: change Sliced beef from **4 to 5 kg**, keeping tofu **6 kg** and mushrooms **1 kg**. Submit; execute UC.1.11.
- UC.1.12: explicitly check approval and click approve. Continue through approval recording, official order and sending at UC.1.13–UC.1.15.
- UC.1.16–UC.1.18: run the supplier stub to receive the order, confirm it and return delivery information. The supplier receives **5 kg of beef**, not the original 4 kg recommendation.
- UC.1.19–UC.1.21: record confirmation, update status and present it. UC.1.22: acknowledge reviewing the confirmed order.

“This is a working baseline path with visible action outputs. The supplier is a stub, but its order input is the actual approved output of PANTRI's demo workflow.”

## About 1 minute — Live trace

“N.03 is the manager's need to review, change and approve purchases before the restaurant is committed. It produces SR.03A, allowing revision, and SR.03, requiring the final approved order to be transmitted without quantity changes.”

Point to N.03 and SR.03/SR.03A in the original Innoslate documents. Open the original UC.1 Action Diagram and point to UC.1.10–UC.1.16. In the prototype, select SR.03 and expand the run events for adjustment, approval, sending and receipt. Show that all contain **5 / 6 / 1 kg**. If asked about code, open `src/core.js` and the corresponding `case 'UC.1.x'`.

“The model, spec, code and execution evidence use the same identifiers. Our next work includes real interfaces, broader exception handling and stakeholder validation; this run does not establish the proposed pilot outcome targets.”

## Short answers to likely questions

| Question | Answer |
|---|---|
| Which parts are real? | The quantity edits, explicit approval, quantity-preserving message handoff, confirmation recording, state updates and audit events execute as code. |
| Which parts are stubs? | Prepared restaurant records, deterministic forecasting stand-in and in-process supplier response. |
| Can the system order without approval? | The engine blocks an out-of-order send and requires explicit approval before recorded approval and official order creation. The UI requires acknowledgment before the approval button becomes active. |
| Does this prove forecast performance? | No. The stand-in has transparent inputs and assumptions, but no real-data accuracy or waste-reduction validation has been performed. |
| Are all requirements implemented? | No. The selected normal UC.1 slice supports SR.02, SR.03/SR.03A and normal confirmation under SR.04. Other requirements and full SR.04 exception scenarios remain open. |

## Rehearsal checklist

Run all 22 actions on the demonstration laptop; verify the three final quantities; export a live JSON; open the original model links while signed into the school account; upload source/spec/provenance to the team's GitHub; fill the six Canvas evidence fields using honest statuses. Individual peer reviews are separate.
