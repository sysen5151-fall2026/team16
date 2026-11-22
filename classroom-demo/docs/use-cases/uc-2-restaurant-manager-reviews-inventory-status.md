# UC.2 Restaurant Manager Reviews Inventory Status

This review can run immediately after a reset or alongside the order and recovery demos. Use **Beef short rib** for the correction so the scripted Sliced beef quantities stay repeatable. On a fresh seed, **Beef short rib** has **15.7 kg** on hand in **batch-002**. To demonstrate the history before any correction, open that ingredient as **Restaurant Manager** and scroll to **Movement history**. Look for **No count adjustments recorded** while inventory still shows **15.7 kg**.

For the populated history path, use **Switch role** to select **Restaurant Staff**. In **Inventory**, search for **Beef short rib** and open it. Select **Stock count**, choose **batch-002**, enter **15 kg** for **Counted quantity (kg)** and **Physical count** for **Reason for correction**, then select **Save count**. This setup is the adjacent [UC.7 Restaurant Staff Performs Inventory Count](https://cloud.innoslate.com/cornell/p/687/database/entity/199018).

| Model action | What to do | What to show |
| --- | --- | --- |
| UC.2.1 Request Inventory Status | With **Switch role**, return to **Restaurant Manager** and open **Overview**. Select **Low stock** in the health ring and click **View low stock**. | The fresh seed has **132** tracked ingredients and **7** in the Low stock primary group. If the purchase and recovery demos have already run, the ring reflects the current saved inventory. |
| UC.2.2 Request Scoped Inventory Records | In **Inventory**, select **Clear filters**, search for **Beef short rib** and open the matching row. | The inventory view is scoped to the selected ingredient and its batches. |
| UC.2.3 Retrieve Inventory and Correction History | Find **batch-002** under **Stock by batch** and inspect the count correction in **Movement history**. | The batch has **15 kg** on hand. Its count record retains the prior and revised quantities, unit, reason, time and responsible staff account. |
| UC.2.4 Provide Inventory Status and History | Read the correction and the opening receipt. | The count correction shows **15.7 → 15 kg**, delta **−0.7 kg**, reason **Physical count**, its correction identifier, **Recorded by Restaurant Staff** and the full demo date and time. The opening receipt remains a distinct movement. |
| UC.2.5 Review Inventory Status and History | Close and reopen **Beef short rib**. | On hand remains **15 kg** and the selected correction appears once. The manager's read path leaves the ledger unchanged. |

[UC.2 Action Diagram](https://cloud.innoslate.com/cornell/p/687/diagrams/action/199013) · [Sequence Diagram](https://cloud.innoslate.com/cornell/p/687/diagrams/sequence/199013) · [Activity Diagram](https://cloud.innoslate.com/cornell/p/687/diagrams/activity/199013)

## Request inventory status with Ask PANTRI

As **Restaurant Manager**, close the ingredient drawer, open **Ask PANTRI**, and ask **How much sliced beef do we have?** After the full purchase, receiving, waste and recovery route, the answer should show **11 kg on hand**, **11 kg usable**, **0 kg reserved**, and a **10 kg** reorder point. The nearest expiration should be **October 28, 2026**. Close the panel and open **Sliced beef** in **Inventory** so the grader can compare the answer to the recorded quantities. After a fresh reset, the same question should show **8 kg on hand** and **8 kg usable**.

With the live model, point out **Understood by the local model**. With Ollama unavailable or disabled, this question should give the same figures with **Matched by keywords**. Asking leaves the inventory and movement history unchanged. [Classroom route](../../../docs/DEMO_SCRIPT.md) · [Assistant verification](../../../docs/integration-verification.md#stage-a--ask-pantri-verification)

## Adjacent UC.4 Restaurant Manager Reviews Operational Performance

Open **Reports** and select **Today**. Show **Waste per 100 covers** and **Stockout rate** together. The seeded day has **228** diner covers and **9 of 622** unavailable opportunities, a **1.45%** stockout rate. With only seeded waste, the waste rate is **0.18 kg per 100 covers**. After the **1 kg** Sliced beef waste entry in the recovery script, it is **0.61 kg per 100 covers**.

Scroll to **Waste insights for planning**. Review the explanation and its source. If the local model cannot return a verified response, the panel shows **Showing PANTRI's calculated summary**. Select **View waste records** for a card to open the recorded ingredient evidence. After the recovery script's waste entry, **Sliced beef** is the first card with **1 kg** and **Overproduction**. [UC.4 model entity](https://cloud.innoslate.com/cornell/p/687/database/entity/199015) · [Recovery demo](uc-11-recovery-partner-processes-waste-collection-request.md)

## Model behavior to review

The working review scopes correction history by ingredient and shows its stored events. UC.2.1 and UC.2.3 also model a requested period. The current movement history presents all retained records for that ingredient. Legacy corrections show **Recorded by Unknown** when the operator is absent. The assistant is an additional, read-only entry point for requesting inventory status. The team kept it out of the native UC.2 behavior views for this release; its Actions UC.2.12, UC.2.13 and UC.2.15 form a related scenario in the model. [Live model baseline](../model-baseline.md#use-cases) · [Assistant design](../../../docs/adr/0009-ask-pantri-assistant.md#innoslate-alignment-and-changes-for-review)
