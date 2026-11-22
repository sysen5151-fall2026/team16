# PANTRI classroom demonstration

## Integrated release route — three minutes

Start the local service and Ollama before the demonstration. Sign in as **Restaurant Manager**, use **Demo tools → Reset demo**, and start on **Overview**. Keep the existing Innoslate views ready for the two-minute Q&A. The walkthrough uses October 21, 2026 synthetic records. [Windows setup](../classroom-demo/README.md)

| Segment | What to do | What to show |
| --- | --- | --- |
| Manager reviews and sends | On **Overview**, point out **132** tracked ingredients, **3** purchase drafts and **7** ingredients with the primary status **Low stock**. Open **Purchasing → Review draft** for **Prime Foods / Sliced beef**. Enter **5 kg**, select **Save changes**, then **Review & approve → Approve & send (demo)**. | **12 kg** expected demand minus **8 kg** usable stock gives **4 kg** suggested and a **$58.00** estimate. The revision shows **Version 2**, **5 kg** and **$72.50**. The sent order retains the approved version and quantity. |
| Supplier confirms and staff receives | Use **Switch role** to select the **Prime Foods** supplier account. Open **View order**, choose **Confirm order**, and select **Send response**. Switch to **Restaurant Staff**, open **Inventory**, and select **Record receiving** for the pending order. Record **5 kg** with the displayed October 28 expiration and **$14.50/kg**, then save. | Supplier confirmation gives **Confirmed / Not received** at **8 kg** on hand. Staff receiving moves on-hand stock to **13 kg** and the order to **Received**. |
| Staff records waste and manager requests recovery | As staff, open **Inventory → Sliced beef → Record waste**. Record **1 kg** from **batch-001** as **Overproduction**. Switch to **Restaurant Manager** and open **Waste & recovery → Recovery requests → New recovery request**. Choose Sliced beef, the same batch, **1 kg** and **Community Food Recovery**, then create the request. | Waste moves on-hand stock to **12 kg**. The request reserves **1 kg**, leaving **11 kg usable** and **12 kg on hand**. |
| Partner records pickup and manager reviews | Switch to **Community Food Recovery**. Open the request and select **Accept request**, then **Record pickup**. Return to **Restaurant Manager**, open **Reports**, and select **Today**. | Acceptance leaves **12 kg on hand**. Pickup moves the request to **Collected** and stock to **11 kg**. In **Waste insights for planning**, **Sliced beef** is first, with **1 kg** and **Overproduction**. With the live model, point out **PANTRI calculation** and **Suggestion from the local model**. |
| Manager asks about current inventory | Close any drawer, select **Ask PANTRI**, and ask **How much sliced beef do we have?** Compare the answer with **Inventory → Sliced beef**. | The answer and inventory show **11 kg on hand**, **11 kg usable** and **0 kg reserved**. Point out the **10 kg** reorder point and **Understood by the local model** beneath the answer. With Ollama disabled or unavailable, the same question returns those figures with **Matched by keywords**. |

Use the detailed scripts for individual checks and the UC.2 correction-history example. [UC.1 purchase and receiving](../classroom-demo/docs/use-cases/uc-1-restaurant-manager-places-ingredient-order.md) · [UC.2 inventory review](../classroom-demo/docs/use-cases/uc-2-restaurant-manager-reviews-inventory-status.md) · [UC.11 recovery](../classroom-demo/docs/use-cases/uc-11-recovery-partner-processes-waste-collection-request.md)

For Q&A, show how the retained approval binds Version 2 and 5 kg, how the supplier response and the physical receipt have separate effects, and how PANTRI checks the local model's interpretation before reading records for an answer. The verification record includes the saved-approval quarantine test and the assistant's model rejection and fallback cases. [Traceability](traceability.md) · [Integration verification](integration-verification.md)

## Earlier milestone demonstration — about 2 minutes 20 seconds

Open the offline HTML and your original Innoslate model before visitors arrive. The prototype's Model & traceability view includes the existing Action and Asset images as a fallback. Use Reset demo between visitors; export evidence first if the run needs to be retained.

### 20 seconds — SoI and scope

“PANTRI is a restaurant ingredient-planning system. It uses inventory, usage and expiration records to recommend purchases, while the restaurant manager retains approval authority. Our milestone implementation covers the ingredient-ordering use case, UC.1. The manager and supplier are external participants; restaurant records and supplier replies are simulated for this demonstration.”

### About 1 minute — Run the skeleton

Execute the numbered actions with the main button. Each click runs the current action, not just an animation.

- UC.1.1–UC.1.8: initiate/request, retrieve inventory/usage/expiration, generate forecast/recommendation and present it. Point out synthetic data and two-day horizon.
- UC.1.9: acknowledge reviewing the basis. UC.1.10: change Sliced beef from **4 to 5 kg**, keeping tofu **6 kg** and mushrooms **1 kg**. Submit; execute UC.1.11.
- UC.1.12: explicitly check approval and click approve. Continue through approval recording, official order and sending at UC.1.13–UC.1.15.
- UC.1.16–UC.1.18: run the supplier stub to receive the order, confirm it and return delivery information. The supplier receives **5 kg of beef**, not the original 4 kg recommendation.
- UC.1.19–UC.1.21: record confirmation, update status and present it. UC.1.22: acknowledge reviewing the confirmed order.

“This is a working baseline path with visible action outputs. The supplier is a stub, but its order input is the actual approved output of PANTRI's demo workflow.”

### About 1 minute — Live trace

“N.03 is the manager's need to review, change and approve purchases before the restaurant is committed. It produces SR.03A, allowing revision, and SR.03, requiring the final approved order to be transmitted without quantity changes.”

Point to N.03 and SR.03/SR.03A in the original Innoslate documents. Open the original UC.1 Action Diagram and point to UC.1.10–UC.1.16. In the prototype, select SR.03 and expand the run events for adjustment, approval, sending and receipt. Show that all contain **5 / 6 / 1 kg**. If asked about code, open `src/core.js` and the corresponding `case 'UC.1.x'`.

“The model, spec, code and execution evidence use the same identifiers. Our next work includes real interfaces, broader exception handling and stakeholder validation; this run does not establish the proposed pilot outcome targets.”

### Short answers to likely questions

| Question | Answer |
|---|---|
| Which parts are real? | The quantity edits, explicit approval, quantity-preserving message handoff, confirmation recording, state updates and audit events execute as code. |
| Which parts are stubs? | Prepared restaurant records, deterministic forecasting stand-in and in-process supplier response. |
| Can the system order without approval? | The engine blocks an out-of-order send and requires explicit approval before recorded approval and official order creation. The UI requires acknowledgment before the approval button becomes active. |
| Does this prove forecast performance? | No. The stand-in has transparent inputs and assumptions, but no real-data accuracy or waste-reduction validation has been performed. |
| Are all requirements implemented? | No. The selected normal UC.1 slice supports SR.02, SR.03/SR.03A and normal confirmation under SR.04. Other requirements and full SR.04 exception scenarios remain open. |

### Rehearsal checklist

Run all 22 actions on the demonstration laptop; verify the three final quantities; export a live JSON; open the original model links while signed into the school account; upload source/spec/provenance to the team's GitHub; fill the six Canvas evidence fields using honest statuses. Individual peer reviews are separate.
