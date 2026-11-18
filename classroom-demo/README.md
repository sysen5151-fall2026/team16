# PANTRI classroom build

SYSEN 5151 · Team 16 · November 18, 2026

Open **PANTRI_Final.html** in Edge or Chrome. It is a standalone app and works offline. Use **Demo tools → Reset demo → Reset demo** to load the same synthetic restaurant data before class. The app keeps the demo date at October 21, 2026.

To build and test from the source directory, use Node 22 or later.

```bash
npm run build
npm test
npm start
```

`npm start` serves the app at `http://127.0.0.1:5173`. The app stores this edition's data under `pantri.final.v1`. Demo Tools exports the complete state and event history as JSON.

## Interactive overview

- Select a health segment or its legend item to highlight the ring. The link below the ring opens that primary status in Inventory. Select an ingredient category to open its filtered list, or open Inventory value for the breakdown by category.
- Switch between **7 days** and **Today** on Overview or Reports. The same period applies in both places. Hover or focus a chart column for exact costs. Click to keep the amounts visible and press Escape to dismiss them.
- Draft prices, on-hand stock after receiving, and stock available after reservation recalculate while you type. Save or submit the form to record the change.
- All five pages share one interaction style: chart columns lift and show their values above the bar, action arrows and table-row chevrons turn into green circles on hover, single-action cards lift slightly, and drawers slide in over a softly blurred page. Motion is removed when the system asks for reduced motion.

## Five-minute classroom walkthrough

| Time | On screen | Say or show |
| --- | --- | --- |
| 0:00–0:40 | Repository README and PANTRI Overview | Introduce ingredient planning for a restaurant. Open the app from the build folder. The Overview starts with 132 tracked ingredients and three drafts. Select Low stock in the ring to highlight its seven ingredients. |
| 0:40–1:05 | Innoslate OpsCon and Inventory | Identify the manager, staff, supplier and recovery partner. Open Sliced beef and point to the 8 kg on hand and the recorded batch. |
| 1:05–2:30 | Purchasing | Review the Prime Foods sliced beef draft. Show `12 kg demand − 8 kg usable stock → 4 kg recommended`. Change the manager quantity to 5 kg and point to the updated $72.50 estimate. Save version 2, review and approve. Apply a simulated supplier confirmation. Point to **Confirmed** and **Not received**. |
| 2:30–3:15 | Receiving | From the order, record 5 kg actually received. Check that stock becomes 13 kg and the receiving status becomes **Received**. |
| 3:15–4:15 | Waste & recovery | In the beef inventory drawer, record 1 kg waste with the reason Overproduction. Open Recovery requests and reserve 1 kg of an eligible beef batch. Simulate acceptance, then record collection. The reservation keeps stock at 12 kg. Collection changes it to 11 kg. |
| 4:15–5:00 | Reports | Select Today. Show paired waste and stockout measures, open the waste planning card for Sliced beef and follow the link to the underlying record. Mention that the manager reviews planning guidance before approving any quantity. |

Keep the team repository README, the running app and the [Innoslate project](https://cloud.innoslate.com/cornell/p/687/dashboard) open. The course announcement asks for a short progress check and three statuses on the live OpsCon diagram. Keep presentation tabs free of API keys and credentials.

## OpsCon annotations

Use the **PANTRI Universe Context** Asset Diagram in Project 687. The statuses below describe this classroom build.

| Diagram element | Status | Evidence |
| --- | --- | --- |
| Restaurant Manager | Working | Reviews drafts, approves final quantities and views decision reports as a demo manager. |
| Restaurant Staff | Working | Records receipts, usage, counts and waste and can reconstruct movement history in the demo workspace. |
| PANTRI System | Partial | Executes the integrated classroom workflows with local records and simulated partners. Production service and access-management integration are future work. |
| Ingredient Supplier | Partial | The demo supports confirmation, partial confirmation, delay and exception. The supplier exchange is simulated. |
| Recovery Partner | Partial | The app reserves stock, records simulated responses and records pickup. The partner exchange and physical logistics are external. |
| PANTRI Staff | Not yet built | A dedicated support and service monitoring workspace remains future work. |
| Diners | Not yet built | Diners are external stakeholders. The report uses recorded diner covers and availability observations from the demo dataset. |

## Behavior and source trace

- The Business or Mission Analysis §7 and stakeholder need N.10 use waste records in the next planning cycle. The final app adds **Waste insights for planning** to Reports and shows recent waste context in related purchase drafts. Guidance uses recorded ingredient quantities and reasons. The approved ordering formula and manager control follow SR.02 and SR.03. [Operational concept](https://drive.google.com/file/d/1CCBnGWcpVhIFBuknlTvA_1Tw6pjJYXT3/view) · [Stakeholder requirements](https://drive.google.com/file/d/1wJJ-JP0zGaF9xXGDwwmc0YKXShJGNWGc/view)
- Reports evaluate waste per 100 covers and stockout rate together for the selected period under SR.06. Unknown costs and missing observations are identified in the relevant summaries.
- This edition uses the Team 16 app at GitHub commit `8fa2706` as the functional baseline. The supplied source is separated into domain logic, selectors, views, UI controller and presentation styles. [Original Team 16 build](https://github.com/sysen5151-fall2026/team16/tree/8fa27066d75433bf72e6fc1fbb8f3c2f9c5ba0d4)

## Verification

- **21 automated checks passed** for the actual release bundle. They cover the original approval flow, partial receiving, recovery, waste evidence, incomplete costs, paginated histories and storage consistency.
- Edge ran the release HTML through the classroom browser workflow. The run checked 4 → 5 kg approval, simulated confirmation with 8 kg still in stock, two receipts adding 5 kg total, a 1 kg waste entry, a 1 kg recovery collection, report-to-record navigation and purchase draft waste context.
- Edge also checked health-ring filtering, the inventory value drawer, chart detail selection, synchronized cost periods and the three live quantity previews.
- All five pages and the receiving drawer fit the tested Edge widths of 1,416, 1,256, 390 and 320 CSS pixels without document overflow.
- The team's archived 544.95 ms mean is for the previously instrumented baseline. This release has a workflow regression check. [Team simulation and timing report](https://drive.google.com/file/d/1_FWV8ekq42wsnNoRIWOMYxN3XVzPO-yS/view)
