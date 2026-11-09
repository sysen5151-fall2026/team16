# First level model to code traceability

| Model function | Module | Leaf requirements |
|---|---|---|
| P-F.0.1 Maintain Ingredient Operational Records | src/architecture/records.js | P-AFR.01, P-AFR.02, P-AFR.03 |
| P-F.0.2 Derive Ingredient Planning Information | src/architecture/planning.js | P-AFR.04, P-AFR.05, P-AFR.06, P-AFR.07 |
| P-F.0.3 Coordinate Approved Ingredient Orders | src/architecture/orders.js | P-AFR.08, P-AFR.09, P-AFR.10, P-AFR.11 |
| P-F.0.4 Coordinate Food Recovery Requests | src/architecture/recovery.js | P-AFR.12, P-AFR.13, P-AFR.14 |
| P-F.0.5 Present Restaurant Decision Information | src/architecture/presentation.js | P-AFR.15, P-AFR.16, P-AFR.17 |
| P-F.0.6 Govern PANTRI Service Continuity | src/architecture/governance.js | P-AFR.18, P-AFR.19, P-AFR.20, P-AFR.21 |

24 modeled interfaces are defined in contracts/api-v1.json. The main prepared run records actual internal source/recipient messages. Model requirements and their native Test Case entities remain Draft/Not Run unless their complete declared verification is executed; passing a narrow unit test does not promote operational acceptance.
