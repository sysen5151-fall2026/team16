# ADR 0007 Guarded local language-model explanations

**Decision date** 2026-11-22
**Status** Accepted for the classroom release

## Context

Managers need to see why PANTRI suggested a purchasing quantity and how recorded waste informs the next review. The deterministic rules already calculate inventory, the order recommendation and operational performance. A language-model reply can have the correct JSON shape and still contain unsupported facts.

## Decision

Use the local Ollama `qwen2.5:3b` tag with Q4_K_M quantization. Its registry entry lists a 3.09B parameter model and a 1.9 GB download. The smaller model fits the two short, bounded explanation tasks. The adapter contacts the default loopback Ollama host at `http://127.0.0.1:11434`. Startup warms the model in the background with a 60-second deadline. Ollama receives a ten-minute keep-alive. The local model can be disabled through `PANTRI_MODEL_ENABLED=0`. [Ollama model tag](https://ollama.com/library/qwen2.5:3b)

Split each explanation into two parts. PANTRI writes the calculated summary with every quantity, cost and date. The model receives only qualitative facts (ingredient name, purchase basis, recent waste reasons, who decides) and writes one or two sentences of practical advice as structured JSON `{advice}`. The adapter rejects advice that is malformed, longer than 45 words or 320 characters, contains any digit or number word, names a different known ingredient, or tells the manager to approve, send, dispatch or cancel. Because the model never sees or writes a number, a well-formed reply cannot change a quantity, cost or date shown to the manager. The interface labels the two parts **PANTRI calculation** and **Suggestion from the local model**. The default deadline is eight seconds, including reading the reply. The server shows the deterministic English summary and guidance when the model is disabled, unavailable, times out or returns advice that fails a check. The interface identifies that source as **Showing PANTRI's calculated summary**. Record model outcome, duration and fallback reason in diagnostics.

Provide explanations for the purchase draft and the Reports waste insights. The adapter is read-only. The domain owns all record changes, quantities and costs. The manager still approves the exact final quantities.

## Model alignment and differences

- N.02 Explainable purchasing advice and SR.02 anchor the purchase explanation. PA.2.2 Purchasing Advice Module and P-F.0.2.2 Derive Purchasing Advice retain the deterministic recommendation. PA.2.4 Performance Measures Module and P-F.0.2.4 Calculate Waste and Availability Measures retain the numbers used to interpret waste.
- PA.5.2 Planning View Module and P-F.0.5.2 Present Planning Information provide the existing presentation allocation. The live model needs an explicit local Ollama exchange, a validation and fallback allocation, and an output source indicator. P-IF.05 Proposed Purchasing Advice and P-IF.09 Expiration and Performance Results retain their calculation semantics. PA.6.2 Service Observation Module is the anchor for health, timing and fallback diagnostics. [Live model baseline](../../classroom-demo/docs/model-baseline.md#product-changes-required-by-the-model)
