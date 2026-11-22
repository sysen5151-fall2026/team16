# AI-assisted implementation provenance

Date: 2026-10-06. Tool: OpenAI Codex in ChatGPT Work. Owner/requester: Cheng Paul Xiong, Team 16. Team review and classroom run have not been claimed completed.

## Actual user request

“请你根据我cx282 google drive里5151文件夹里的内容，然后根据TA和你刚刚跟我讲的内容做一份最小的原型，而且代码要展示所选use case的action diagram流程。”

The user also supplied the TA's messages permitting a CLI or minimal UI and placeholder I/O while requiring the selected use case's Action Diagram progression.

## Grounding performed before code generation

The assistant resolved the school's SYSEN 5151 folder, read the current native Business or Mission Analysis and Stakeholder Needs and Requirements, streamed their PDF exports and inspected the actual Action Diagram figures. The 12 narrative steps were reconciled with the diagram's 22 action entities. The original Asset and Action figures were extracted rather than redrawn.

The course Milestone checks, Student Package and Canvas template were read in the conversation. The syllabus was also read for course context. Source identifiers and observed revision times are retained in `model/SOURCES.md`.

## Requirement constraints applied to generation

The following are the assistant's source-derived implementation constraints, not additional user quotations or claims of separate user prompts:

1. Implement only UC.1.1–UC.1.22 and preserve Manager/PANTRI/Supplier actor assignments.
2. SR.02: expose expected demand, usable recorded inventory, expiration horizon and material limitations; use an explicitly labeled forecasting stand-in.
3. SR.03A: permit manager quantity revision before approval.
4. SR.03: require explicit approval and preserve quantities through official order, transmission and supplier receipt.
5. SR.04: record and present normal supplier confirmation and simulated delivery information; disclose exception cases as incomplete.
6. Keep external data and supplier boundaries visibly stubbed. Do not implement unrelated business features or claim pilot results.
7. Deliver a self-contained offline HTML, readable source, implementation specification, trace matrix and repeatable workflow checks.

The source requirement text was read before the core code was authored. `SPEC.md` records those constraints for future changes; this was not a prompt to generate a complete production PANTRI system.

## Assistant contribution and decisions

- Authored `src/core.js`, `src/app.js`, `src/template.html`, build/sample scripts, workflow tests and supporting documentation.
- Chose a browser-based minimal UI so the user can run it by double-clicking without installing a programming runtime.
- Chose deterministic synthetic fixture values, a two-day horizon, a kg input guard and a demo date-filtering policy. These are explicit prototype assumptions, not source-approved algorithm or architecture requirements.
- Implemented defensive snapshots and sequence/approval guards, with separate supplier receipt, confirmation and response actions.
- Embedded unchanged source figures and linked model IDs to implementation cases and event payloads.

## Verification and remaining human review

Actual check outcomes are recorded in `TEST_REPORT.md`. `samples/prepared_run_example.json` is labeled an automated synthetic example. A live classroom evidence export should be produced by the team during its own rehearsal or demonstration.

The team should review the code/spec against its live Innoslate baseline, understand the four selected requirements, confirm the demo assumptions, run the demo on its classroom laptop and upload the repository. No team approval, production integration, real supplier transaction or real stakeholder validation is asserted.

## 2026-11-22 Ask PANTRI and Windows release refinements

**Tool** OpenAI Codex. **Project** Cornell SYSEN 5151, Team 16, PANTRI. Codex used the user-supplied sprint prompt, the Windows integration baseline and its verification record, the classroom source and tests, and the dated Innoslate export described in the model baseline.

Codex implemented the read-only Ask PANTRI panel and API for the two restaurant roles. It wrote the structured interpretation prompt and validation, deterministic fallback and grounded answer templates, contract schemas, stub scenarios and live model evaluation harness. It also contributed the registered recovery selector, scoped supplier accounts for the three seed organizations, grouped role selection, pinned drawer controls, status-aware supplier follow-up, revised calculation grammar and restart verification. Codex drafted the corresponding architecture decision, use-case and demo steps, risk treatment and requirement trace.

The user confirmed the starting point after reviewer commit `93dda07`. That earlier review replaced copying server-written candidate explanations with checked model-written qualitative advice. The user retained PANTRI's ownership of all figures and the existing approval, receipt and pickup rules. They directed the new feature to use intent classification only, and later requested consolidated reporting for the remaining Windows stages. No additional rejection or revision from the user was recorded for those code and documentation changes. Codex chose to omit raw question text from diagnostic entries while retaining intent, source, model, latency and fallback reason.

The dated verification record contains actual stub, browser and local-model evidence. The prepared model questions and expected interpretations were authored with Codex assistance. Native Innoslate changes require the user's item-by-item approval and live model access. The Windows classroom results establish behavior on the synthetic fixture. [Prompt and review log](prompt-log.md) · [Integration verification](integration-verification.md) · [Model baseline](../classroom-demo/docs/model-baseline.md)
