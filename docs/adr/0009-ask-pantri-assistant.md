# ADR 0009 Ask PANTRI

**Decision date** 2026-11-22

**Status** Accepted for the classroom release

## Context

Restaurant staff and managers need a quick way to ask for information already available in their workspaces. A structurally valid model interpretation can select the wrong intent, ingredient or reporting period. The approval, receiving and recovery workflow depends on the existing server permissions and deterministic records.

## Decision

Use the local Ollama model to classify a single English question of up to 300 characters. The model receives the question as data, the role's allowed intents and the ingredient names in scope. It returns exactly `intent`, `ingredient` and `period`. PANTRI builds the English answer using the existing domain and planning logic over one role-scoped snapshot. The response includes its revision and interpretation source. All quantities, units, costs, statuses and dates come from the saved records or PANTRI's calculations. The endpoint is read-only.

Free chat would let the model write operational claims beyond the supported queries. The information already resides in typed PANTRI records and is available through scoped queries. A retrieval-augmented generation index would introduce a second retrieval and freshness boundary. Fine-tuning would add a model lifecycle to the classroom release, while the server would still have to enforce role scope and check the catalog and quantities. The existing model can handle the classification task with a prompt and a checked schema. The separate qualitative advice path remains under [ADR 0007](0007-guarded-local-explanations.md).

## Validation and fallback

- Require exactly three fields, a recognized intent allowed for the account, and a period of `today`, `week`, `all` or `null`. Only a waste query can carry a period, and it must match the period detected in the question.
- Resolve a supplied ingredient to a unique known catalog name or supported singular or plural alias, then verify that the question mentions it. Reject a missing required ingredient, a mismatch, multiple named ingredients on a single-ingredient query, or a result that conflicts with clear wording about the intent. PANTRI can offer up to three real catalog names for clarification.
- Fall back to deterministic keywords if the model is disabled, unreachable, exceeds the default eight-second deadline, or returns a failed interpretation. Give a data-free help or scope response when no supported intent is found. Show **Understood by the local model**, **Matched by keywords**, or **Not understood** in the panel.
- Keep question text out of the support log. Record the interpretation source, intent, model, elapsed time and fallback reason. Reject questions when saved records are quarantined. The tested failure cases and fixed-set model evaluation are recorded in [integration verification](../integration-verification.md#stage-a--ask-pantri-verification).

## Role scope

Restaurant Manager can ask about inventory, expiration, purchase drafts, sent orders, waste and recovery. Restaurant Staff can ask about inventory, expiration and orders awaiting receiving. The server applies the same scoped state used by the rest of the workspace, and limits staff order answers to receiving information. Supplier, recovery and support accounts receive 403. A missing or expired session receives 401. Instructions embedded in a question have no path to write transactions. [OpenAPI contract](../../classroom-demo/contracts/pantri-api.yaml)

## Innoslate alignment and changes for review

The following changes need team approval in Project 687. The local implementation and verification provide evidence for the proposed model content.

| Existing anchor | Proposed model change |
| --- | --- |
| P-F.0.5.1 Accept Information Tasks and PA.5.1 Information Request Module | Consider P-F.0.5.1 for the required third-level decomposition alongside the baseline's P-F.0.3.3 candidate. Add child actions for receiving a question, interpreting it, validating or falling back, retrieving scoped records and constructing the answer. Update the Hierarchy and IDEF0 views with question and interpretation inputs, role and validation controls, the panel, REST handler, local adapter and scoped record access as mechanisms, and the grounded answer as output. |
| PA.5.1, PA.6.1 Task Authorization Module and PA.6.2 Service Observation Module | Allocate the assistant panel and read-only REST handler to information requests, the scope gate to authorization, and the interpretation audit entry to service observation. Allocate the loopback language-model adapter and interpretation validation to the applicable existing modules. |
| P-IF.01 Inventory View Query, P-IF.08 Scoped Inventory View Data and P-IF.16 Authorized Task Constraints | Retain these interfaces for scoped record access. Add or update I/O entities to represent the natural-language question, the checked interpretation and the grounded answer. Model the loopback conduit for the question and structured interpretation and trace the client-facing request and response to OpenAPI. |
| N.02 Explainable purchasing advice, SR.02 and P-AFR.15 Scope information requests | Reuse applicable requirements and add or refine a derived requirement for PANTRI-sourced answer figures and read-only model use. Add verification evidence for interpretation rejection, keyword fallback, role scope and inventory and write-integrity checks. |
| UC.2 Restaurant Manager Reviews Inventory Status | Add the assistant as a read-only way to request and compare inventory status. Update the existing Action, Sequence and Activity views after reconciling the placement with the existing steps. |
| Model integration risk register and integration Action Diagram | Add a risk for a plausible but wrong interpretation and link it to the checks, fallback and test evidence. Carry the assistant assets and interfaces into the integration sequence after the higher-risk saved-approval boundary. |

Existing identifiers and names are from the [model baseline](../../classroom-demo/docs/model-baseline.md). Newly proposed entities await native model review and numbering.
