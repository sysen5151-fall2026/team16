# ADR 0005 Standalone Node HTTP service

**Decision date** 2026-11-22
**Status** Accepted for the classroom release

## Context

The classroom browser bundle was coupled to browser storage. The final demo needs a shared data source, a local language model and a REST interface that a grader can run on a clean Windows machine. The retained in-process architecture in ADR 0002 describes native system flows and supplies earlier evidence.

## Decision

Use Node.js 22 or later and its standard library. A single `node:http` listener serves the UI and the JSON API on the same origin. The default address is `http://127.0.0.1:5173`, with the port configurable through `PANTRI_DEMO_PORT`. The browser and server share the domain and planning source under `classroom-demo/src/`. The server owns validation, role and record scope, and state changes. The release contract describes the browser boundary. [Classroom OpenAPI contract](../../classroom-demo/contracts/pantri-api.yaml) · [ADR 0002](0002-first-level-interface-authority.md)

Retain separate approval and dispatch commands even when the manager initiates both from one confirmation. Approve the reviewed draft version, persist the exact approved quantities and then dispatch that retained order. Read the recorded supplier response independently from physical receiving.

A small local service keeps setup to one Node installation and the repository. The team owns request parsing, routing, error responses and validation with the built-in runtime APIs. The operating scope is a single synthetic restaurant and one service process.

## Model alignment and differences

- P-F.0.1 through P-F.0.6 and PA.1 through PA.6 remain the function and asset anchors for operational records, ingredient planning, purchase coordination, recovery coordination, decision presentation and service continuity. The live baseline assigns these functions to logical modules. The one-process deployment and its browser-to-Node REST conduit need an explicit physical allocation.
- P-IF.01 Inventory View Query and P-IF.08 Scoped Inventory View Data are represented at the browser boundary by inventory reads. P-IF.06 Reviewable Purchase Draft, P-IF.07 Recorded Supplier Order State and P-IF.11 Recorded Recovery State have corresponding release reads. P-IF.02 and P-IF.03 Planning Record Query and Scoped Planning Records can remain internal calls within the Node process.
- PC-IF.01 Current Draft Snapshot, PC-IF.02 Retained Approval Reference and PC-IF.03 Order Dispatch Outcome retain their existing ordering. The model's purchase interfaces describe logical handoffs. Review their allocation to the versioned HTTP commands and the shared persisted record. [Live model baseline](../../classroom-demo/docs/model-baseline.md#i-squared-and-conduits)
