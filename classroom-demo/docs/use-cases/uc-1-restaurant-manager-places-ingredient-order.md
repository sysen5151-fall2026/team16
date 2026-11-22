# UC.1 Restaurant Manager Places Ingredient Order

Start the app at the local address from the [Windows setup](../../README.md). Select **Restaurant Manager** on the demo sign-in screen. For a fresh run, open **Demo tools**, select **Reset demo** and confirm. On **Overview**, the October 21, 2026 seed shows **132 tracked ingredients**, **3 purchase drafts** and **7** ingredients with **Low stock** as their primary status.

The action numbers follow the native [UC.1 Action Diagram](https://cloud.innoslate.com/cornell/p/687/diagrams/action/199012). Use the [Sequence Diagram](https://cloud.innoslate.com/cornell/p/687/diagrams/sequence/199012) and [Activity Diagram](https://cloud.innoslate.com/cornell/p/687/diagrams/activity/199012) for handoff context. The values below use the integrated classroom seed.

| Model action | What to do | What to show |
| --- | --- | --- |
| UC.1.1–UC.1.2 | Open **Purchasing** and select **Review draft** on the Prime Foods card for **Sliced beef**. | The review drawer identifies the supplier and Version 1. |
| UC.1.3–UC.1.9 | Review the demand, usable stock, exclusions, pack size and explanation. | The seeded two-day formula uses **12 kg expected demand − 8 kg usable recorded stock**. With a **1 kg** pack size, the suggested purchase is **4 kg** and the initial estimate is **$58.00**. PANTRI calculates these values from the recorded inputs. |
| UC.1.10–UC.1.11 | Set **Manager quantity (kg)** to **5** and click **Save changes**. | The estimate becomes **$72.50** at **$14.50/kg**. The saved draft shows **Version 2** and remains unapproved. |
| UC.1.12–UC.1.15 | Click **Review & approve**. Check **5 kg** in **Approve final purchase**, then click **Approve & send (demo)**. | The order records Version 2 and **5 kg** as its approved snapshot. Its timeline records approval and dispatch separately. Supplier status is **Awaiting confirmation** and receiving status is **Not received**. |
| UC.1.16–UC.1.18 | Use **Switch role** and select **Ingredient Supplier** for **Prime Foods**. Select **View order** on the new order, choose **Confirm order** under **Response** and select **Send response**. | The supplier receives the same order and sees **5 kg** of Sliced beef. Confirmation records a response to that order. |
| UC.1.19–UC.1.22 | Use **Switch role** to return to **Restaurant Manager**. In **Purchasing → Orders**, select **View order** on the same order. Then open Sliced beef in **Inventory**. | The order shows **Confirmed** and **Not received**. The version and quantities still match the approval and on-hand stock remains **8 kg**. |

## Adjacent UC.5 Restaurant Staff Records Ingredient Delivery

1. Use **Switch role** to select **Restaurant Staff**. In **Inventory**, find the **Orders awaiting receiving** section.
2. Select **Record receiving** for Sliced beef on the confirmed order. Enter **5 kg** as the actual receipt. Keep **October 28, 2026** as the expiration date and **$14.50/kg** as the unit cost, then select **Save receiving**.
3. Find **Sliced beef** in Inventory and open its detail. Confirm **13 kg** recorded on hand across the original **8 kg** batch and the new **5 kg** batch. The movement history retains the receipt. Return to the manager's order view if needed to show receiving status **Received**.

UC.5 is the physical receiving handoff after the purchase workflow. UC.1's supplier receipt refers to the purchase order reaching the supplier. [UC.5 model entity](https://cloud.innoslate.com/cornell/p/687/database/entity/199016)

## Model behavior to review

The purchase drawer exposes the available calculation basis and approval gate. The separately modeled UC.1.9A **Check Missing Ingredient Information** review/defer loop still needs a product-to-model review. The demonstration uses a seeded demand input and a confirmation status with a response note. A separately structured delivery-information exchange and an explicit final status acknowledgment remain behavioral details to reconcile with the native UC.1 views. [UC.1.9A](https://cloud.innoslate.com/cornell/p/687/database/entity/272730) · [Live model baseline](../model-baseline.md#use-cases)
