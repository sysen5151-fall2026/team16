# UC.11 Recovery Partner Processes Waste Collection Request

This is the provisional third product demo. Use the native [UC.11 entity](https://cloud.innoslate.com/cornell/p/687/database/entity/199022) and [SEQ.R01 system interaction](https://cloud.innoslate.com/cornell/p/687/diagrams/sequence/299065) for context. The independent UC.11 Action, Sequence and Activity details are pending. The steps below trace the release workflow to the existing recovery functions.

## Adjacent UC.8 Restaurant Staff Records Food Waste

1. Complete the [UC.1 and UC.5 script](uc-1-restaurant-manager-places-ingredient-order.md) through the **5 kg** receipt. This establishes **13 kg** of Sliced beef on hand.
2. Use **Switch role** to select **Restaurant Staff**. In **Inventory**, open **Sliced beef** and select **Record waste**. Choose **batch-001**, enter **1 kg**, select **Overproduction** and click **Save waste**.
3. Open Sliced beef again and show **12 kg** on hand and the **1 kg** waste movement, including the reason. This records what was discarded. The manager subsequently selects separately available surplus for the request. [UC.8 model entity](https://cloud.innoslate.com/cornell/p/687/database/entity/199019)

## Recovery success path

| Participant or function | What to do | What to show |
| --- | --- | --- |
| Restaurant Manager with P-F.0.4.1 Prepare Recovery Requests | Use **Switch role** to select **Restaurant Manager**. Open **Waste & recovery → Recovery requests → New recovery request**. Select **Sliced beef**, **batch-001** and **1 kg**. Keep **Community Food Recovery** and **Today, 14:00–16:00** as the partner and pickup window. Select **Create request**. | The request is **Requested**. Sliced beef remains **12 kg** on hand, with **1 kg reserved** and **11 kg usable now**. In the opening batch, **7 kg** remains physically on hand and **6 kg** is available after reservation. |
| Recovery Partner with P-F.0.4.2 Record Recovery Responses | Use **Switch role** to select **Recovery Partner** for **Community Food Recovery**. Select **View request** on the new request and **Accept request**. | The request shows **Accepted** and keeps the requested **1 kg**, ingredient, batch and pickup window. On hand remains **12 kg**. The acceptance is recorded in the request timeline. |
| Recovery Partner records pickup | Once the demo pickup has been performed, select **Record pickup** for the accepted request. | The request becomes **Collected** and the timeline shows the pickup record. |
| Restaurant Manager reviews the recovery and inventory records | Use **Switch role** to return to **Restaurant Manager**. Open the same request under **Recovery requests** and open **Sliced beef** under **Inventory**. | The request is **Collected**, on hand is **11 kg**, and reserved quantity returns to **0 kg**. The selected batch shows a collection movement of **7 → 6 kg**. |

## Adjacent UC.12 Recovery Partner Reports Collection Exception

On a separate run, open the newly requested pickup in the recovery portal and choose **Decline request**. The product records **Exception** on that request. On-hand stock remains **12 kg**, and the **1 kg** remains reserved while the manager resolves the exception. Return to the manager's **Recovery requests**, open the same request and select **Cancel request** to release the **1 kg** reservation. On-hand stock remains **12 kg** and reserved quantity returns to **0 kg**. [UC.12 model entity](https://cloud.innoslate.com/cornell/p/687/database/entity/199023)

## Model behavior to review

The model owner can use this run to detail the request scope, acceptance, decline, manager disposition and pickup evidence in the native UC.11 views. The working product uses manager initiation and a scoped partner portal. Reconcile manager authorization with the existing support-command model. The classroom flow uses recorded expiration and unreserved quantity when selecting a batch. The actual suitability assessment and pickup stay with operational participants. [Live model baseline](../model-baseline.md#model-changes-for-the-team-to-review) · [ADR 0003](../../../docs/adr/0003-recovery-request-authorization.md)
