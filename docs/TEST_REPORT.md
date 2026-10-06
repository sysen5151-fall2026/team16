# Prototype verification report

Date: 2026-10-06. Execution runtime: Node.js v24.19.0 and Python 3. The tests use no third-party dependencies.

## Completed checks

| Check | Result |
|---|---|
| Core workflow tests (`node --test tests/core.test.js`) | 10 passed, 0 failed |
| Delivered-HTML UI event checks (`node --test tests/ui-smoke.test.js`) | 2 passed, 0 failed |
| `node --check src/core.js` and `node --check src/app.js` | Passed |
| Self-contained HTML build (`python3 tools/build.py`) | Passed; JavaScript and original model figures embedded |
| Synthetic prepared run generation | Completed all 22 actions; stored as an explicitly labeled example |

The core tests exercise the full baseline path, out-of-order/duplicate actions, explicit approval, review acknowledgments, invalid quantities, defensive snapshots, transparent recommendation inputs, the demo expiration-date boundary, awaiting-vs-confirmed state and independent sessions.

The UI smoke tests execute both actual inline scripts from the delivered HTML with a minimal DOM adapter. They click through all 22 actions, require the three review/approval acknowledgments, change beef to 5 kg, export and inspect the JSON, switch views, reset the run and test correction of a blank quantity. They verify event wiring and application logic, not browser rendering or accessibility behavior.

The revised final values **beef 5 kg, tofu 6 kg, mushrooms 1 kg** match the explicit approval, official order, transmitted order, supplier receipt, confirmation and presented status. The original beef recommendation was 4 kg.

## Limits

A real headless browser was unavailable in the execution environment; its browser download failed. Consequently, real-browser visual layout, native file-download behavior and cross-browser behavior have **not** been verified here. The team should rehearse by opening the HTML on its classroom laptop and exporting a run.

No actual restaurant data, supplier API, authenticated user, database, trained AI or pilot evaluation was involved. These checks do not establish stakeholder task-success percentages, restaurant performance, service availability, security or full exception coverage. Requirements retain their source draft status.
