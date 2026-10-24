# ADR 0002 First level interface authority

Status: Implemented in the bounded local increment; stakeholder operational policies remain proposed.

The first-level model decomposes P-F.0 into records, planning, orders, recovery, presentation and governance. contracts/api-v1.json was written from the 24 modeled internal flows before the new implementation. Generated client operations and server registration use the contract as their authority. src/architecture/bus.js rejects undeclared fields and endpoints; the six modules implement the declared receiving signatures.

The existing src/core.js and offline UI remain a retained Milestone 1 adapter. The new first-level library provides a separate prepared architecture demonstration. Its record query, advice, draft, approval retention, sent-order and recorded-response exchanges are real in-process messages, recorded in evidence/architecture-demo.json. A future UI migration must call this library rather than silently maintaining two authorities.

Affected model entities: P-F.0.1-P-F.0.6; P-IF.01-P-IF.24; P-AFR.01-P-AFR.21. In-process messaging was selected as an equivalent machine-readable interface contract because the existing product is offline; adding HTTP services would introduce an unnecessary boundary.
