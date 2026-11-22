# PANTRI restaurant workspace

PANTRI helps a restaurant team track ingredients, approve purchases, record waste and coordinate recovery from a shared local workspace.

## Run on Windows

Use PowerShell on Windows 11 with Node.js 22 or later, Git, and Edge or Chrome. The product runs with Node's standard library and its bundled synthetic dataset. There are no npm packages to install.

~~~powershell
git clone https://github.com/sysen5151-fall2026/team16.git
cd team16
npm.cmd run seed --prefix classroom-demo
npm.cmd start --prefix classroom-demo
~~~

For a pre-merge review, add --branch final-integration to the clone command.

The verified direct launch runs node classroom-demo/build.mjs followed by node classroom-demo/serve.mjs from the repository root.

Open [PANTRI](http://127.0.0.1:5173) and choose **Restaurant Manager**. The seed is for Demo Buffet Hot Pot on October 21, 2026. It begins with 132 tracked ingredients, 3 drafts, 7 ingredients with a primary Low stock status, and 8 kg of Sliced beef on hand. On first start, PANTRI seeds the data file automatically if it is missing.

All five demo accounts access one data file at classroom-demo/data/pantri-state.json. **Switch role** opens the account selection screen. **Demo tools → Reset demo** resets the shared data for another run. Run the seed command with the app stopped when recreating data from PowerShell. Sign in again after restarting the service to view the retained data.

## Start the local model

Install [Ollama for Windows](https://ollama.com/download/windows) and start Ollama. Run these commands in PowerShell before starting PANTRI.

~~~powershell
ollama pull qwen2.5:3b
ollama show qwen2.5:3b
~~~

The default [qwen2.5:3b tag](https://ollama.com/library/qwen2.5:3b) is Q4_K_M, 1.9 GB, model ID 357c53fb659c. PANTRI allows 60 seconds for background warmup and gives normal explanations 8 seconds by default. Each request keeps the model loaded for 10 minutes. The adapter calls only Ollama's loopback chat endpoint. Check the model and storage status at [PANTRI health](http://127.0.0.1:5173/api/health) or sign in as **PANTRI Staff**.

PANTRI can run with Node alone. If Ollama or the model is unavailable, the purchase draft and report panels show PANTRI's calculated explanations. To exercise that mode deliberately, stop PANTRI and start it with the following override.

~~~powershell
$env:PANTRI_MODEL_ENABLED = '0'
npm.cmd start --prefix classroom-demo
~~~

Set PANTRI_MODEL_ENABLED to 1 for the local model. Other optional settings are PANTRI_DEMO_PORT (default 5173), PANTRI_DATA_FILE (path to the server's JSON), PANTRI_OLLAMA_URL (default http://127.0.0.1:11434), PANTRI_OLLAMA_MODEL (default qwen2.5:3b), and PANTRI_MODEL_TIMEOUT_MS (per chat call). The Ollama URL must be HTTP loopback.

## Demo scripts

| Segment | Actions |
| --- | --- |
| First minute | Manager verifies the overview and opens the Sliced beef draft, reviews the calculation, changes 4 kg to 5 kg and approves. |
| Second minute | Supplier confirms in the supplier workspace. Staff opens the pending receipt and records 5 kg. Inventory moves from 8 kg to 13 kg when the receipt is recorded. |
| Third minute | Manager opens inventory and reviews recorded history. Staff records 1 kg waste, manager requests recovery, and partner accepts and records collection. The manager opens Today in Reports to review the waste record. |

Use the detailed scripts for set-up, controls, expected values and modeled boundaries.

- [UC.1 Restaurant Manager Places Ingredient Order](docs/use-cases/uc-1-restaurant-manager-places-ingredient-order.md)
- [UC.2 Restaurant Manager Reviews Inventory Status](docs/use-cases/uc-2-restaurant-manager-reviews-inventory-status.md)
- [UC.11 Recovery Partner Processes Waste Collection Request](docs/use-cases/uc-11-recovery-partner-processes-waste-collection-request.md)

## How the workspace works

~~~mermaid
flowchart LR
  UI["Glass workspace<br/>five demo roles"] <-->|"JSON and bearer session"| HTTP["Node REST API"]
  HTTP --> Access["Service continuity<br/>demo role authorization"]
  Access --> Work["Operational records, ingredient planning,<br/>purchase and recovery coordination,<br/>decision presentation"]
  Work -->|"validate and atomically replace"| Store["JSON current state and prior checkpoint"]
  Work -->|"bounded facts and candidates"| Ollama["Local Ollama"]
  Ollama -->|"validate facts and text"| Work
~~~

The browser and server use the same domain and planning source. Manager approval persists the approved version before the dispatch request. Staff records physical receiving independently of supplier confirmation. A recovery reservation deducts available stock and a recorded pickup deducts on-hand stock.

The model selects a grounded English explanation from server-supplied candidates. The server checks all returned facts and compares the text to the accepted candidates before displaying it. Purchase quantities, approvals and inventory updates use deterministic domain functions. [HTTP contract](contracts/pantri-api.yaml) · [Model baseline](docs/model-baseline.md) · [Verification record](../docs/integration-verification.md)

## Verify

~~~powershell
npm.cmd test --prefix classroom-demo
npm.cmd test
~~~

The classroom tests rebuild the release bundle and exercise the existing workflows, API roles and continuity, and guarded explanations with local test stubs. For a local model timing run, stop PANTRI and run the following command. It unloads only qwen2.5:3b to measure cold requests.

~~~powershell
node classroom-demo/study/model-timing.mjs
~~~

## Known limits and handover

**Demo sign-in, no real authentication.** Use the loopback service with the synthetic data. One restaurant and one PANTRI process own the file. Partner workspaces represent human actions in the classroom and do not send messages to real suppliers or recovery organizations. The support console shows service and model health, checkpoint metadata, and the recent operation/error log. Its log resets when the service restarts.

If the saved approval and order conflict, the service quarantines transaction writes. The manager can export the saved UTF-8 record and prior verified checkpoint for reconciliation, then use **Reload saved data** to revalidate a repaired file. The project team owns any manual reconciliation and storage recovery. Keep a secure copy of the data file if retaining a demonstration and stop the service before moving or retiring its file. The application keeps no explanation cache on disk.

### macOS

to be verified
