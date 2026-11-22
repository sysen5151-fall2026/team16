# PANTRI restaurant workspace

Team 16's integrated classroom product lives in [classroom-demo](classroom-demo/README.md). The Windows build serves the existing glass workspace and REST API from Node, shares one seeded JSON file across demo roles, and can use a local Ollama model for grounded explanations.

~~~powershell
npm.cmd run seed --prefix classroom-demo
npm.cmd start --prefix classroom-demo
npm.cmd test --prefix classroom-demo
~~~

Open [PANTRI](http://127.0.0.1:5173) after starting the service. See the [setup and demonstration scripts](classroom-demo/README.md), [model baseline](classroom-demo/docs/model-baseline.md), and [integration verification](docs/integration-verification.md).

---

## Previous PMC2 product: PANTRI_App.html (reference)

**PANTRI_App.html** was used for the PMC2 team video. This is the original classroom Drive app, reviewed directly on 2026-11-08. Its UI and business logic are unchanged; four function/ICOM comments were added for traceability. Open the HTML in a browser, with synthetic localStorage data and explicitly simulated supplier responses.

See [original App audit](docs/ORIGINAL_APP_AUDIT_ZH.md), [primary traceability](docs/traceability.md), and [primary entry points](docs/route-table.md). PANTRI_PMC2.html is retained as an alternative/reference and is not the primary demo.

---

## Earlier repository README (historical/reference)

# PANTRI — Milestone 1 Walking Skeleton

SYSEN 5151 · Team 16 · UC.1: Restaurant Manager Places Ingredient Order.

## 最简单的运行方式

1. 解压代码包。
2. 双击根目录中的 `PANTRI_Milestone1.html`，用 Chrome、Edge 或 Safari 打开。
3. 依次点击主按钮，跟随 UC.1.1–UC.1.22。无需安装 Python、Node、服务器或任何第三方库；离线也可运行。
4. UC.1.9：阅读建议后勾选确认。UC.1.10：将 Sliced beef 从 4 改为 5 kg，点击提交。
5. UC.1.12：核对最终数量，勾选明确批准，再点击批准按钮。
6. 继续运行 PANTRI 和供应商 stub 的动作。UC.1.22：确认看过最终订单状态。
7. 点击 **Export run evidence** 保存本次实际运行的 JSON。关闭或重置前请导出。
8. 点击 **Model & traceability**，打开原始 Action / Asset 图及每个动作的需求对应关系。课堂上同时打开你们的原始 Innoslate 模型。

The runnable HTML is self-contained and includes the original two model figures. The HTML is a generated distribution file; readable implementation lives under `src/`.

## What runs

All 22 action entities from the existing UC.1 Action Diagram execute in their modeled sequence. The Restaurant Manager reviews, revises and explicitly approves. PANTRI records the approval, creates and hands off an unchanged order, records the supplier response, updates status and presents it. The Ingredient Supplier is an in-process stub that separately receives, confirms and returns delivery information.

The live trace is **N.03 → SR.03A / SR.03 → UC.1.10–UC.1.16 → revised quantities / approval / sent and received order**. Additional support is shown for N.02/SR.02 and the normal-confirmation slice of N.04/SR.04.

## Real vs. simulated

| Boundary | Implementation |
|---|---|
| Manager interactions | Real UI review, editing and explicit approval; a demo identity, without authentication |
| Restaurant record source | Synthetic inventory, historical usage and expiration fixture; precondition of UC.1 |
| Demand forecast | Executable average-usage calculation used as a forecasting stand-in, without trained AI |
| PANTRI workflow | Executable sequence guards, approval copying, order handoff, audit events, confirmation and status logic |
| Supplier | In-process adapter; receives actual demo order values and returns deterministic confirmation and delivery placeholders |
| Storage / evidence | In-memory state plus manual JSON export; no production database or recovery guarantee |

Only the normal UC.1 path is implemented. No external purchase or real delivery takes place. Partial, delayed, rejected and absent supplier responses are not implemented. The draft stakeholder target percentages, waste reduction and other pilot outcomes are not validated by this demo. Authentication, real AI/API/database integration and other use cases remain subsequent work.

## Repository structure

```text
PANTRI_Milestone1.html       Ready-to-open offline distribution
SPEC.md                     Requirement-constrained implementation scope
src/core.js                 State machine, restaurant-data fixture, forecasting stand-in and supplier stub
src/app.js                  Minimal UI and run-evidence export
src/template.html           UI source and original-model placeholders
model/                      Original Asset and UC.1 Action figures; source/action registry
docs/traceability.md         Need → requirement → action → implementation → demo evidence
docs/AI_PROVENANCE.md        Actual user request, source use, constraints and assistant contribution
docs/DEMO_SCRIPT.md          Short classroom pitch and demo steps
docs/TEST_REPORT.md          Actual test results and limits
samples/                    Synthetic fixture and prepared automated example
tests/                     Core workflow checks and DOM-adapter UI smoke checks
tools/build.py              Regenerates the self-contained HTML (Python standard library)
tools/generate_sample.js    Regenerates the prepared example (Node standard library)
package.json                Optional developer commands, no dependencies
```

## Optional development commands

The delivered HTML already works without these tools. If editing source:

```bash
node --test tests/*.test.js
python3 tools/build.py
node tools/generate_sample.js
```

Run from this folder. After modifying `src/`, rebuild the HTML before demonstrating. Sample JSON is prepared synthetic evidence, distinct from a live classroom export.

## GitHub / Milestone handoff

Upload this extracted folder's contents to your team's GitHub repository. No external repository has been created or published by this deliverable. Use its actual repository URL in the Canvas evidence field once uploaded. Preserve `SPEC.md`, source code, tests and provenance together.

The two original figures support the live presentation. The complete requirements baseline, stakeholder analysis and remaining rubric areas should point to the team's existing reports/model in the Canvas template. Those documents have not been edited and their draft status has not been changed.

Sources and observed revision dates are in `model/SOURCES.md`; the selected use case and all 22 diagram actions are mapped in `docs/traceability.md`.


## Function architecture increment October 23 2026

The first-level architecture implementation is in src/architecture. Its 24 internal interfaces come from the Innoslate flow register, with a machine-readable contract in contracts/api-v1.json and generated signatures in contracts/generated. Run npm test and npm run demo:architecture. See docs/route-table.md, docs/FUNCTION_ARCHITECTURE_TRACEABILITY.md and docs/FUNCTION_ARCHITECTURE_TEST_REPORT.md. The original offline walking skeleton remains available; it is not described as already migrated to the new module library.


## PMC2 purchase product

Open `PANTRI_PMC2.html` for the direct P-F.0.3 architecture-module interface. Rebuild with `python tools/build_pmc2.py`. See [recording-readiness evidence](docs/PMC2_READINESS_ZH.md), [traceability](docs/traceability.md) and [entry points](docs/route-table.md). This is an in-memory prepared prototype with simulated supplier input, not a production procurement service.
