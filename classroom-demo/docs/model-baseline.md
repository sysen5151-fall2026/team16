# PANTRI live model baseline

Team 16 reviewed Project 687 on November 22, 2026 (America/New_York) from a read-only native database XML export, the live diagram index and the Canvas rubrics. The export had 672 entities and 4582 relationship records. It stays outside this repository. SHA-256 of the inspected export is 5c022586c32548780773d729405c1377dbf4f8f4c70bff2e1abd61450338796a.

The product baseline is team16 main at c3ba7d6625d5ef46e42cf23c6b373886511a8998, including the glass classroom demo and Task 6 recovery guardrail. This is the starting model and product comparison. Use the Innoslate links for the current entities and the consolidated traceability table for executable coverage.

## Use cases

The [Pantri Use Cases](https://cloud.innoslate.com/cornell/p/687/diagrams/usecase/199011) diagram contains 15 top-level actions. The live diagram index and export were checked for independent behavior views and child actions.

| Use case | Model title | Live view |
| --- | --- | --- |
| [UC.1](https://cloud.innoslate.com/cornell/p/687/database/entity/199012) | Restaurant Manager Places Ingredient Order | [Action](https://cloud.innoslate.com/cornell/p/687/diagrams/action/199012) / [Sequence](https://cloud.innoslate.com/cornell/p/687/diagrams/sequence/199012) / [Activity](https://cloud.innoslate.com/cornell/p/687/diagrams/activity/199012) |
| [UC.2](https://cloud.innoslate.com/cornell/p/687/database/entity/199013) | Restaurant Manager Reviews Inventory Status | [Action](https://cloud.innoslate.com/cornell/p/687/diagrams/action/199013) / [Sequence](https://cloud.innoslate.com/cornell/p/687/diagrams/sequence/199013) / [Activity](https://cloud.innoslate.com/cornell/p/687/diagrams/activity/199013) |
| [UC.3](https://cloud.innoslate.com/cornell/p/687/database/entity/199014) | Restaurant Manager Reviews Expiration Alerts | Overview |
| [UC.4](https://cloud.innoslate.com/cornell/p/687/database/entity/199015) | Restaurant Manager Reviews Operational Performance | Overview |
| [UC.5](https://cloud.innoslate.com/cornell/p/687/database/entity/199016) | Restaurant Staff Records Ingredient Delivery | Overview |
| [UC.6](https://cloud.innoslate.com/cornell/p/687/database/entity/199017) | Restaurant Staff Records Ingredient Usage | Overview |
| [UC.7](https://cloud.innoslate.com/cornell/p/687/database/entity/199018) | Restaurant Staff Performs Inventory Count | Overview |
| [UC.8](https://cloud.innoslate.com/cornell/p/687/database/entity/199019) | Restaurant Staff Records Food Waste | Overview |
| [UC.9](https://cloud.innoslate.com/cornell/p/687/database/entity/199020) | Ingredient Supplier Processes Purchase Order | Overview |
| [UC.10](https://cloud.innoslate.com/cornell/p/687/database/entity/199021) | Ingredient Supplier Reports Delivery Exception | Overview |
| [UC.11](https://cloud.innoslate.com/cornell/p/687/database/entity/199022) | Recovery Partner Processes Waste Collection Request | [SEQ.R01](https://cloud.innoslate.com/cornell/p/687/diagrams/sequence/299065) is a system interaction view. Independent UC.11 detail is pending. |
| [UC.12](https://cloud.innoslate.com/cornell/p/687/database/entity/199023) | Recovery Partner Reports Collection Exception | Overview |
| [UC.13](https://cloud.innoslate.com/cornell/p/687/database/entity/199024) | PANTRI Staff Monitors System Operation | Overview |
| [UC.14](https://cloud.innoslate.com/cornell/p/687/database/entity/199025) | PANTRI Staff Resolves Supply Exception | Overview |
| [UC.15](https://cloud.innoslate.com/cornell/p/687/database/entity/199026) | PANTRI Staff Resolves Recovery Exception | Overview |

[UC.1.9A](https://cloud.innoslate.com/cornell/p/687/database/entity/272730) Check Missing Ingredient Information has Action, Sequence and Activity views within UC.1. It represents a manager review/defer loop. The baseline product shows the available basis and has the explicit approval gate. The separate modeled review loop is a behavioral discrepancy to review, including what to do when material information remains unknown.

The Windows demonstration uses UC.1, UC.2 and UC.11. The receiving handoff following UC.1 exercises UC.5, and the recorded waste preceding UC.11 exercises UC.8. Partner decline is associated with UC.12. UC.11 was selected provisionally for the working product because the native recovery interaction and prepared operational workflow already exist. The team still owns the independent Action, Sequence and Activity views.

## Function hierarchy and IDEF0

The [P-F.0 hierarchy](https://cloud.innoslate.com/cornell/p/687/diagrams/hierarchy/265005) and [P-F.0 IDEF0](https://cloud.innoslate.com/cornell/p/687/diagrams/idef0/265005) are the first-level model views. The XML decomposed-by edges give the hierarchy below. The [purchase IDEF0](https://cloud.innoslate.com/cornell/p/687/diagrams/idef0/269322) and [purchase hierarchy](https://cloud.innoslate.com/cornell/p/687/diagrams/hierarchy/269322) share the P-F.0.3 root and its four children. The live P-F.0.3.3 hierarchy displayed a leaf. The export has no P-F.0.x.x.x function and no further decomposed-by child under the numbered second-level functions. An actual level-three decomposition and its paired IDEF0 are poster work for the model owner.

| Function | Model title | Children in the export |
| --- | --- | --- |
| [P-F.0](https://cloud.innoslate.com/cornell/p/687/database/entity/265005) | Provide Restaurant Ingredient Planning and Coordination | P-F.0.1, P-F.0.2, P-F.0.3, P-F.0.4, P-F.0.5, P-F.0.6 |
| [P-F.0.1](https://cloud.innoslate.com/cornell/p/687/database/entity/269313) | Maintain Ingredient Operational Records | P-F.0.1.1, P-F.0.1.2, P-F.0.1.3 |
| [P-F.0.1.1](https://cloud.innoslate.com/cornell/p/687/database/entity/269314) | Capture Ingredient Events | No direct allocation in the export |
| [P-F.0.1.2](https://cloud.innoslate.com/cornell/p/687/database/entity/269315) | Reconcile Ingredient Records | No direct allocation in the export |
| [P-F.0.1.3](https://cloud.innoslate.com/cornell/p/687/database/entity/269316) | Preserve Operational History | No direct allocation in the export |
| [P-F.0.2](https://cloud.innoslate.com/cornell/p/687/database/entity/269317) | Derive Ingredient Planning Information | P-F.0.2.1, P-F.0.2.2, P-F.0.2.3, P-F.0.2.4 |
| [P-F.0.2.1](https://cloud.innoslate.com/cornell/p/687/database/entity/269318) | Forecast Ingredient Demand | No direct allocation in the export |
| [P-F.0.2.2](https://cloud.innoslate.com/cornell/p/687/database/entity/269319) | Derive Purchasing Advice | No direct allocation in the export |
| [P-F.0.2.3](https://cloud.innoslate.com/cornell/p/687/database/entity/269320) | Assess Expiration Exposure | No direct allocation in the export |
| [P-F.0.2.4](https://cloud.innoslate.com/cornell/p/687/database/entity/269321) | Calculate Waste and Availability Measures | No direct allocation in the export |
| [P-F.0.3](https://cloud.innoslate.com/cornell/p/687/database/entity/269322) | Coordinate Approved Ingredient Orders | P-F.0.3.1, P-F.0.3.2, P-F.0.3.3, P-F.0.3.4 |
| [P-F.0.3.1](https://cloud.innoslate.com/cornell/p/687/database/entity/269323) | Revise Purchase Drafts | No direct allocation in the export |
| [P-F.0.3.2](https://cloud.innoslate.com/cornell/p/687/database/entity/269324) | Record Explicit Purchase Approval | No direct allocation in the export |
| [P-F.0.3.3](https://cloud.innoslate.com/cornell/p/687/database/entity/269325) | Transmit Approved Purchase Orders | No direct allocation in the export |
| [P-F.0.3.4](https://cloud.innoslate.com/cornell/p/687/database/entity/269326) | Maintain Supplier Order State | No direct allocation in the export |
| [P-F.0.4](https://cloud.innoslate.com/cornell/p/687/database/entity/269327) | Coordinate Food Recovery Requests | P-F.0.4.1, P-F.0.4.2, P-F.0.4.3 |
| [P-F.0.4.1](https://cloud.innoslate.com/cornell/p/687/database/entity/269328) | Prepare Recovery Requests | No direct allocation in the export |
| [P-F.0.4.2](https://cloud.innoslate.com/cornell/p/687/database/entity/269329) | Record Recovery Responses | No direct allocation in the export |
| [P-F.0.4.3](https://cloud.innoslate.com/cornell/p/687/database/entity/269330) | Maintain Recovery Exception State | No direct allocation in the export |
| [P-F.0.5](https://cloud.innoslate.com/cornell/p/687/database/entity/269331) | Present Restaurant Decision Information | P-F.0.5.1, P-F.0.5.2, P-F.0.5.3 |
| [P-F.0.5.1](https://cloud.innoslate.com/cornell/p/687/database/entity/269332) | Accept Information Tasks | No direct allocation in the export |
| [P-F.0.5.2](https://cloud.innoslate.com/cornell/p/687/database/entity/269333) | Present Planning Information | No direct allocation in the export |
| [P-F.0.5.3](https://cloud.innoslate.com/cornell/p/687/database/entity/269334) | Present Transaction Information | No direct allocation in the export |
| [P-F.0.6](https://cloud.innoslate.com/cornell/p/687/database/entity/269335) | Govern PANTRI Service Continuity | P-F.0.6.1, P-F.0.6.2, P-F.0.6.3, P-F.0.6.4 |
| [P-F.0.6.1](https://cloud.innoslate.com/cornell/p/687/database/entity/269336) | Apply Restaurant Access Policies | No direct allocation in the export |
| [P-F.0.6.2](https://cloud.innoslate.com/cornell/p/687/database/entity/269337) | Monitor Service and Exceptions | No direct allocation in the export |
| [P-F.0.6.3](https://cloud.innoslate.com/cornell/p/687/database/entity/269338) | Restore Confirmed Records | No direct allocation in the export |
| [P-F.0.6.4](https://cloud.innoslate.com/cornell/p/687/database/entity/269339) | Export Authorized Handover Records | No direct allocation in the export |

## Physical architecture

[1.1 PANTRI System hierarchy](https://cloud.innoslate.com/cornell/p/687/diagrams/hierarchy/198986) and the native asset relations establish the six subsystems and their modules.

| Asset | Model title | Allocated functions |
| --- | --- | --- |
| [PA.1](https://cloud.innoslate.com/cornell/p/687/database/entity/297371) | Operational Records Subsystem | P-F.0.1 |
| [PA.1.1](https://cloud.innoslate.com/cornell/p/687/database/entity/297521) | Event Capture Module | P-F.0.1.1 |
| [PA.1.2](https://cloud.innoslate.com/cornell/p/687/database/entity/297522) | Record Reconciliation Module | P-F.0.1.2 |
| [PA.1.3](https://cloud.innoslate.com/cornell/p/687/database/entity/297523) | Operational History Module | P-F.0.1.3 |
| [PA.2](https://cloud.innoslate.com/cornell/p/687/database/entity/297372) | Ingredient Planning Subsystem | P-F.0.2 |
| [PA.2.1](https://cloud.innoslate.com/cornell/p/687/database/entity/297524) | Demand Forecast Module | P-F.0.2.1 |
| [PA.2.2](https://cloud.innoslate.com/cornell/p/687/database/entity/297525) | Purchasing Advice Module | P-F.0.2.2 |
| [PA.2.3](https://cloud.innoslate.com/cornell/p/687/database/entity/297526) | Expiration Assessment Module | P-F.0.2.3 |
| [PA.2.4](https://cloud.innoslate.com/cornell/p/687/database/entity/297527) | Performance Measures Module | P-F.0.2.4 |
| [PA.3](https://cloud.innoslate.com/cornell/p/687/database/entity/297373) | Purchase Coordination Subsystem | P-F.0.3 |
| [PA.3.1](https://cloud.innoslate.com/cornell/p/687/database/entity/297377) | Draft Revision Module | P-F.0.3.1 |
| [PA.3.2](https://cloud.innoslate.com/cornell/p/687/database/entity/297378) | Approval Record Module | P-F.0.3.2 |
| [PA.3.3](https://cloud.innoslate.com/cornell/p/687/database/entity/297379) | Approved Order Gateway | P-F.0.3.3 |
| [PA.3.4](https://cloud.innoslate.com/cornell/p/687/database/entity/297380) | Supplier State Module | P-F.0.3.4 |
| [PA.4](https://cloud.innoslate.com/cornell/p/687/database/entity/297374) | Recovery Coordination Subsystem | P-F.0.4 |
| [PA.4.1](https://cloud.innoslate.com/cornell/p/687/database/entity/297528) | Recovery Request Module | P-F.0.4.1 |
| [PA.4.2](https://cloud.innoslate.com/cornell/p/687/database/entity/297529) | Recovery Exchange Module | P-F.0.4.2 |
| [PA.4.3](https://cloud.innoslate.com/cornell/p/687/database/entity/297530) | Recovery State Module | P-F.0.4.3 |
| [PA.5](https://cloud.innoslate.com/cornell/p/687/database/entity/297375) | Decision Presentation Subsystem | P-F.0.5 |
| [PA.5.1](https://cloud.innoslate.com/cornell/p/687/database/entity/297531) | Information Request Module | P-F.0.5.1 |
| [PA.5.2](https://cloud.innoslate.com/cornell/p/687/database/entity/297532) | Planning View Module | P-F.0.5.2 |
| [PA.5.3](https://cloud.innoslate.com/cornell/p/687/database/entity/297533) | Transaction View Module | P-F.0.5.3 |
| [PA.6](https://cloud.innoslate.com/cornell/p/687/database/entity/297376) | Service Continuity Subsystem | P-F.0.6 |
| [PA.6.1](https://cloud.innoslate.com/cornell/p/687/database/entity/297534) | Task Authorization Module | P-F.0.6.1 |
| [PA.6.2](https://cloud.innoslate.com/cornell/p/687/database/entity/297535) | Service Observation Module | P-F.0.6.2 |
| [PA.6.3](https://cloud.innoslate.com/cornell/p/687/database/entity/297536) | Record Recovery Module | P-F.0.6.3 |
| [PA.6.4](https://cloud.innoslate.com/cornell/p/687/database/entity/297537) | Record Handover Module | P-F.0.6.4 |

## Needs and requirements

[Stakeholder Needs](https://cloud.innoslate.com/cornell/p/687/documents/246335), [Stakeholder Requirements](https://cloud.innoslate.com/cornell/p/687/documents/246353), [System Requirements](https://cloud.innoslate.com/cornell/p/687/documents/265049) and the integrated system and purchase component specifications were checked together. Allocations below use outgoing traced-to and satisfied-by links and the functions performed by allocated assets. A missing direct functional allocation is recorded as a model finding.

| Need | Model title | Stakeholder requirements |
| --- | --- | --- |
| [N.01](https://cloud.innoslate.com/cornell/p/687/database/entity/246337) | Current ingredient visibility | SR.01 |
| [N.02](https://cloud.innoslate.com/cornell/p/687/database/entity/246338) | Explainable purchasing advice | SR.02 |
| [N.03](https://cloud.innoslate.com/cornell/p/687/database/entity/246339) | Purchasing authority | SR.03, SR.03A |
| [N.04](https://cloud.innoslate.com/cornell/p/687/database/entity/246340) | Order and exception visibility | SR.04 |
| [N.05](https://cloud.innoslate.com/cornell/p/687/database/entity/246341) | Expiration-aware decisions | SR.05 |
| [N.06](https://cloud.innoslate.com/cornell/p/687/database/entity/246342) | Balanced operational improvement | SR.06 |
| [N.07](https://cloud.innoslate.com/cornell/p/687/database/entity/246344) | Accurate receiving | SR.07 |
| [N.08](https://cloud.innoslate.com/cornell/p/687/database/entity/246345) | Practical usage recording | SR.08 |
| [N.09](https://cloud.innoslate.com/cornell/p/687/database/entity/246346) | Reconciled inventory and corrections | SR.09 |
| [N.10](https://cloud.innoslate.com/cornell/p/687/database/entity/246347) | Useful waste records | SR.10 |
| [N.11](https://cloud.innoslate.com/cornell/p/687/database/entity/246349) | Actionable exception coordination | SR.11 |
| [N.12](https://cloud.innoslate.com/cornell/p/687/database/entity/246350) | Reliable daily operation | SR.12 |
| [N.13](https://cloud.innoslate.com/cornell/p/687/database/entity/246351) | Appropriate information access | SR.13 |
| [N.14](https://cloud.innoslate.com/cornell/p/687/database/entity/246352) | Recoverable and transferable records | SR.14, SR.15 |

| Requirement | Model title | Function allocation |
| --- | --- | --- |
| [SR.01](https://cloud.innoslate.com/cornell/p/687/database/entity/246355) | Review current ingredient inventory | P-F.0, P-F.0.1, P-F.0.5 |
| [SR.02](https://cloud.innoslate.com/cornell/p/687/database/entity/246356) | Review the basis of purchasing advice | P-F.0, P-F.0.2, P-F.0.5 |
| [SR.03](https://cloud.innoslate.com/cornell/p/687/database/entity/246357) | Transmit only approved final orders | P-F.0, P-F.0.3 |
| [SR.03A](https://cloud.innoslate.com/cornell/p/687/database/entity/246358) | Revise proposed purchase quantities | P-F.0, P-F.0.3, P-F.0.5 |
| [SR.04](https://cloud.innoslate.com/cornell/p/687/database/entity/246359) | Follow the approved order | P-F.0, P-F.0.3, P-F.0.5 |
| [SR.05](https://cloud.innoslate.com/cornell/p/687/database/entity/246360) | Identify approaching expiration | P-F.0, P-F.0.2, P-F.0.5 |
| [SR.06](https://cloud.innoslate.com/cornell/p/687/database/entity/246361) | Assess waste and availability together | P-F.0, P-F.0.2, P-F.0.5 |
| [SR.07](https://cloud.innoslate.com/cornell/p/687/database/entity/246363) | Record actual ingredient delivery | P-F.0, P-F.0.1 |
| [SR.08](https://cloud.innoslate.com/cornell/p/687/database/entity/246364) | Record ingredient usage | P-F.0, P-F.0.1 |
| [SR.09](https://cloud.innoslate.com/cornell/p/687/database/entity/246365) | Preserve inventory reconciliation history | P-F.0, P-F.0.1 |
| [SR.10](https://cloud.innoslate.com/cornell/p/687/database/entity/246366) | Retain food-waste context | P-F.0, P-F.0.1 |
| [SR.11](https://cloud.innoslate.com/cornell/p/687/database/entity/246368) | Maintain actionable exception records | P-F.0, P-F.0.3, P-F.0.4, P-F.0.6 |
| [SR.12](https://cloud.innoslate.com/cornell/p/687/database/entity/246369) | Maintain operating-hour availability | P-F.0, P-F.0.6 |
| [SR.13](https://cloud.innoslate.com/cornell/p/687/database/entity/246370) | Limit access to authorized restaurant records | P-F.0, P-F.0.6 |
| [SR.14](https://cloud.innoslate.com/cornell/p/687/database/entity/246371) | Recover confirmed operational records | P-F.0, P-F.0.6 |
| [SR.15](https://cloud.innoslate.com/cornell/p/687/database/entity/246372) | Transfer operational records for handover | P-F.0, P-F.0.6 |

| System or allocated requirement | Model title | Function allocation |
| --- | --- | --- |
| [1.1.1](https://cloud.innoslate.com/cornell/p/687/database/entity/265075) | Accept Planning and Information Requests | P-F.0, P-F.0.5 |
| [1.1.2](https://cloud.innoslate.com/cornell/p/687/database/entity/265074) | Accept Purchase Quantity Revisions | P-F.0, P-F.0.3 |
| [1.1.3](https://cloud.innoslate.com/cornell/p/687/database/entity/265073) | Accept Explicit Purchase Approvals | P-F.0, P-F.0.3 |
| [1.1.4](https://cloud.innoslate.com/cornell/p/687/database/entity/265072) | Accept Restaurant Operational Records | P-F.0, P-F.0.1 |
| [1.1.5](https://cloud.innoslate.com/cornell/p/687/database/entity/265071) | Accept Supplier Confirmation Delivery and Exception Information | P-F.0, P-F.0.3 |
| [1.1.6](https://cloud.innoslate.com/cornell/p/687/database/entity/265070) | Accept Recovery Response and Exception Information | P-F.0, P-F.0.4 |
| [1.1.7](https://cloud.innoslate.com/cornell/p/687/database/entity/265069) | Accept Service Policies and Authorized Support Commands | P-F.0, P-F.0.6 |
| [1.2.1](https://cloud.innoslate.com/cornell/p/687/database/entity/265068) | Provide Inventory and Expiration Information | P-F.0, P-F.0.1, P-F.0.2, P-F.0.5 |
| [1.2.2](https://cloud.innoslate.com/cornell/p/687/database/entity/265067) | Provide Reviewable Purchasing Recommendations | P-F.0, P-F.0.2, P-F.0.3, P-F.0.5 |
| [1.2.3](https://cloud.innoslate.com/cornell/p/687/database/entity/265066) | Provide Joint Waste and Availability Measures | P-F.0, P-F.0.2, P-F.0.5 |
| [1.2.4](https://cloud.innoslate.com/cornell/p/687/database/entity/265065) | Provide Approved Purchase Orders | P-F.0, P-F.0.3 |
| [1.2.5](https://cloud.innoslate.com/cornell/p/687/database/entity/265064) | Provide Waste Collection Requests | P-F.0, P-F.0.4 |
| [1.2.6](https://cloud.innoslate.com/cornell/p/687/database/entity/265063) | Provide Recorded Order and Collection Status | P-F.0, P-F.0.3, P-F.0.4, P-F.0.5 |
| [1.2.7](https://cloud.innoslate.com/cornell/p/687/database/entity/265062) | Provide Operational Record Acknowledgments | P-F.0, P-F.0.1 |
| [1.2.8](https://cloud.innoslate.com/cornell/p/687/database/entity/265061) | Provide Exception and Service Monitoring Information | P-F.0, P-F.0.6 |
| [1.2.9](https://cloud.innoslate.com/cornell/p/687/database/entity/265060) | Provide Recovered and Handover Records | P-F.0, P-F.0.1, P-F.0.6 |
| [1.2.14](https://cloud.innoslate.com/cornell/p/687/database/entity/265059) | Provide Authorized PANTRI Interaction State (PANTRI Staff) | P-F.0, P-F.0.6 |
| [1.3.1](https://cloud.innoslate.com/cornell/p/687/database/entity/265058) | Demand, Order Approval, Recommendations & Alerts | P-F.0, P-F.0.2, P-F.0.3, P-F.0.5 |
| [1.3.2](https://cloud.innoslate.com/cornell/p/687/database/entity/265057) | Approved Orders & Delivery Information | P-F.0, P-F.0.3 |
| [1.3.3](https://cloud.innoslate.com/cornell/p/687/database/entity/265056) | Waste Collection & Recovery Information | P-F.0, P-F.0.4 |
| [1.3.4](https://cloud.innoslate.com/cornell/p/687/database/entity/265055) | System Operation & Support Information | P-F.0, P-F.0.6 |
| [1.3.5](https://cloud.innoslate.com/cornell/p/687/database/entity/265054) | Receiving, Usage, Inventory & Waste Information | P-F.0, P-F.0.1 |
| [P-AFR.01](https://cloud.innoslate.com/cornell/p/687/database/entity/269365) | Retain accepted ingredient events | P-F.0.1, P-F.0.1.1 |
| [P-AFR.02](https://cloud.innoslate.com/cornell/p/687/database/entity/269367) | Preserve reconciliation history | P-F.0.1, P-F.0.1.2 |
| [P-AFR.03](https://cloud.innoslate.com/cornell/p/687/database/entity/269369) | Preserve transaction relationships | P-F.0.1, P-F.0.1.3 |
| [P-AFR.04](https://cloud.innoslate.com/cornell/p/687/database/entity/269371) | Forecast scoped ingredient demand | P-F.0.2, P-F.0.2.1 |
| [P-AFR.05](https://cloud.innoslate.com/cornell/p/687/database/entity/269373) | Provide purchasing advice basis | P-F.0.2, P-F.0.2.2 |
| [P-AFR.06](https://cloud.innoslate.com/cornell/p/687/database/entity/269375) | Distinguish expiration information | P-F.0.2, P-F.0.2.3 |
| [P-AFR.07](https://cloud.innoslate.com/cornell/p/687/database/entity/269377) | Calculate paired waste and availability measures | P-F.0.2, P-F.0.2.4 |
| [P-AFR.08](https://cloud.innoslate.com/cornell/p/687/database/entity/269379) | Version quantity revisions | P-F.0.3, P-F.0.3.1 |
| [P-AFR.09](https://cloud.innoslate.com/cornell/p/687/database/entity/269381) | Bind approval to the final version | P-F.0.3, P-F.0.3.2 |
| [P-AFR.10](https://cloud.innoslate.com/cornell/p/687/database/entity/269383) | Transmit only the approved final order | P-F.0.3, P-F.0.3.3 |
| [P-AFR.11](https://cloud.innoslate.com/cornell/p/687/database/entity/269385) | Maintain evidence based order state | P-F.0.3, P-F.0.3.4 |
| [P-AFR.12](https://cloud.innoslate.com/cornell/p/687/database/entity/269387) | Prepare authorized recovery requests | P-F.0.4, P-F.0.4.1 |
| [P-AFR.13](https://cloud.innoslate.com/cornell/p/687/database/entity/269389) | Associate recovery responses | P-F.0.4, P-F.0.4.2 |
| [P-AFR.14](https://cloud.innoslate.com/cornell/p/687/database/entity/269391) | Retain recovery exception context | P-F.0.4, P-F.0.4.3 |
| [P-AFR.15](https://cloud.innoslate.com/cornell/p/687/database/entity/269393) | Scope information requests | P-F.0.5, P-F.0.5.1 |
| [P-AFR.16](https://cloud.innoslate.com/cornell/p/687/database/entity/269395) | Present reviewable planning results | P-F.0.5, P-F.0.5.2 |
| [P-AFR.17](https://cloud.innoslate.com/cornell/p/687/database/entity/269397) | Present recorded transaction status | P-F.0.5, P-F.0.5.3 |
| [P-AFR.18](https://cloud.innoslate.com/cornell/p/687/database/entity/269399) | Apply scoped task authorization | P-F.0.6, P-F.0.6.1 |
| [P-AFR.19](https://cloud.innoslate.com/cornell/p/687/database/entity/269401) | Retain service and exception observations | P-F.0.6, P-F.0.6.2 |
| [P-AFR.20](https://cloud.innoslate.com/cornell/p/687/database/entity/269403) | Restore confirmed linked records | P-F.0.6, P-F.0.6.3 |
| [P-AFR.21](https://cloud.innoslate.com/cornell/p/687/database/entity/269405) | Export scoped handover records | P-F.0.6, P-F.0.6.4 |
| [P-DFR.01](https://cloud.innoslate.com/cornell/p/687/database/entity/297540) | Maintain Ingredient Operational Records | P-F.0.1 |
| [P-DFR.02](https://cloud.innoslate.com/cornell/p/687/database/entity/297542) | Derive Ingredient Planning Information | P-F.0.2 |
| [P-DFR.03](https://cloud.innoslate.com/cornell/p/687/database/entity/297544) | Coordinate Approved Ingredient Orders | P-F.0.3 |
| [P-DFR.04](https://cloud.innoslate.com/cornell/p/687/database/entity/297546) | Coordinate Food Recovery Requests | P-F.0.4 |
| [P-DFR.05](https://cloud.innoslate.com/cornell/p/687/database/entity/297548) | Present Restaurant Decision Information | P-F.0.5 |
| [P-DFR.06](https://cloud.innoslate.com/cornell/p/687/database/entity/297550) | Govern PANTRI Service Continuity | P-F.0.6 |
| [P-NFR.01](https://cloud.innoslate.com/cornell/p/687/database/entity/265029) | Provide Operating Hour Workflow Availability | P-F.0, P-F.0.6 |
| [P-NFR.02](https://cloud.innoslate.com/cornell/p/687/database/entity/265030) | Support Authorized Use Without Cross Restaurant Access | P-F.0, P-F.0.1, P-F.0.2, P-F.0.3, P-F.0.4, P-F.0.5, P-F.0.6 |
| [P-NFR.03](https://cloud.innoslate.com/cornell/p/687/database/entity/265031) | Preserve Confirmed Records Through Recovery | P-F.0, P-F.0.1, P-F.0.6 |
| [P-PCR.F.01](https://cloud.innoslate.com/cornell/p/687/database/entity/297580) | Revise Purchase Drafts | P-F.0.3.1 |
| [P-PCR.F.02](https://cloud.innoslate.com/cornell/p/687/database/entity/297582) | Record Explicit Purchase Approval | P-F.0.3.2 |
| [P-PCR.F.03](https://cloud.innoslate.com/cornell/p/687/database/entity/297584) | Transmit Approved Purchase Orders | P-F.0.3.3 |
| [P-PCR.F.04](https://cloud.innoslate.com/cornell/p/687/database/entity/297586) | Maintain Supplier Order State | P-F.0.3.4 |
| [P-PCR.IF.01](https://cloud.innoslate.com/cornell/p/687/database/entity/297588) | Manager Approval Interface | P-F.0.3 |
| [P-PCR.IF.02](https://cloud.innoslate.com/cornell/p/687/database/entity/297590) | Supplier Order Interface | P-F.0.3 |
| [P-PCR.IF.03](https://cloud.innoslate.com/cornell/p/687/database/entity/297592) | Purchase Record Interface | P-F.0.3 |
| [P-PCR.IF.04](https://cloud.innoslate.com/cornell/p/687/database/entity/297594) | Purchasing Advice Interface | P-F.0.3 |
| [P-PCR.IF.05](https://cloud.innoslate.com/cornell/p/687/database/entity/297596) | Purchase Presentation Interface | P-F.0.3 |
| [P-PCR.IF.06](https://cloud.innoslate.com/cornell/p/687/database/entity/297598) | Purchase Governance Interface | P-F.0.3 |
| [P-PCR.IO.01](https://cloud.innoslate.com/cornell/p/687/database/entity/297552) | Purchase Quantity Revisions | P-F.0.3 |
| [P-PCR.IO.02](https://cloud.innoslate.com/cornell/p/687/database/entity/297554) | Supplier Confirmation Delivery and Exception Information | P-F.0.3 |
| [P-PCR.IO.03](https://cloud.innoslate.com/cornell/p/687/database/entity/297556) | Proposed Purchasing Advice | P-F.0.3 |
| [P-PCR.IO.04](https://cloud.innoslate.com/cornell/p/687/database/entity/297558) | Authorized Supply Disposition | P-F.0.3 |
| [P-PCR.IO.05](https://cloud.innoslate.com/cornell/p/687/database/entity/297560) | Purchase Record Retention Result | P-F.0.3 |
| [P-PCR.IO.06](https://cloud.innoslate.com/cornell/p/687/database/entity/297562) | Order State Query | P-F.0.3 |
| [P-PCR.IO.07](https://cloud.innoslate.com/cornell/p/687/database/entity/297564) | Explicit Purchase Approvals | P-F.0.3 |
| [P-PCR.IO.08](https://cloud.innoslate.com/cornell/p/687/database/entity/297566) | Authorized Task Constraints | P-F.0.3 |
| [P-PCR.IO.09](https://cloud.innoslate.com/cornell/p/687/database/entity/297568) | Approved Purchase Orders | P-F.0.3 |
| [P-PCR.IO.10](https://cloud.innoslate.com/cornell/p/687/database/entity/297570) | Reviewable Purchase Draft | P-F.0.3 |
| [P-PCR.IO.11](https://cloud.innoslate.com/cornell/p/687/database/entity/297572) | Recorded Supplier Order State | P-F.0.3 |
| [P-PCR.IO.12](https://cloud.innoslate.com/cornell/p/687/database/entity/297574) | Supply Exception Context | P-F.0.3 |
| [P-PCR.IO.13](https://cloud.innoslate.com/cornell/p/687/database/entity/297576) | Purchase Transaction Record | P-F.0.3 |
| [P-PCR.IO.14](https://cloud.innoslate.com/cornell/p/687/database/entity/297578) | Operating Task Observations | P-F.0.3 |
| [P-PCR.SW.01](https://cloud.innoslate.com/cornell/p/687/database/entity/297600) | Purchase workflow availability | P-F.0.3, P-F.0.3.1, P-F.0.3.2, P-F.0.3.3, P-F.0.3.4 |
| [P-PCR.SW.02](https://cloud.innoslate.com/cornell/p/687/database/entity/297602) | Purchase task authorization | P-F.0.3, P-F.0.3.1, P-F.0.3.2, P-F.0.3.3, P-F.0.3.4 |
| [P-PCR.SW.03](https://cloud.innoslate.com/cornell/p/687/database/entity/297604) | Recoverable purchase transaction state | P-F.0.3, P-F.0.3.1, P-F.0.3.2, P-F.0.3.3, P-F.0.3.4 |
| [P-SFR.01](https://cloud.innoslate.com/cornell/p/687/database/entity/265657) | Provide Restaurant Ingredient Planning and Coordination | P-F.0, P-F.0.1, P-F.0.2, P-F.0.3, P-F.0.4, P-F.0.5, P-F.0.6 |
| [P-SFR.02](https://cloud.innoslate.com/cornell/p/687/database/entity/265658) | Provide Authorized PANTRI Interaction State to Restaurant Manager | P-F.0, P-F.0.6 |
| [P-SFR.03](https://cloud.innoslate.com/cornell/p/687/database/entity/265659) | Provide Authorized PANTRI Interaction State to Restaurant Staff | P-F.0, P-F.0.6 |
| [P-SFR.04](https://cloud.innoslate.com/cornell/p/687/database/entity/265660) | Provide Authorized PANTRI Interaction State to Ingredient Supplier | P-F.0, P-F.0.6 |
| [P-SFR.05](https://cloud.innoslate.com/cornell/p/687/database/entity/265661) | Provide Authorized PANTRI Interaction State to Recovery Partner | P-F.0, P-F.0.6 |
| [T6.CON.01](https://cloud.innoslate.com/cornell/p/687/database/entity/319861) | Bound the classroom persistence increment | No direct allocation in the export |

## Operational context

The seven colors below were read from [D.1 PANTRI Universe Context](https://cloud.innoslate.com/cornell/p/687/diagrams/asset/198996) on November 22, 2026.

| Asset | Model title | Live status |
| --- | --- | --- |
| [1.1](https://cloud.innoslate.com/cornell/p/687/database/entity/198986) | PANTRI System | Partial |
| [1.2](https://cloud.innoslate.com/cornell/p/687/database/entity/265046) | Output Requirements | Working |
| [1.3](https://cloud.innoslate.com/cornell/p/687/database/entity/265045) | External Interface Requirements | Not yet built |
| [1.4](https://cloud.innoslate.com/cornell/p/687/database/entity/265044) | Functions Requirements | Partial |
| [1.5](https://cloud.innoslate.com/cornell/p/687/database/entity/198992) | Recovery Partner | Partial |
| [1.6](https://cloud.innoslate.com/cornell/p/687/database/entity/198994) | PANTRI Staff | Not yet built |
| [1.8](https://cloud.innoslate.com/cornell/p/687/database/entity/199005) | Restaurant Staff | Working |

## I-squared and conduits

The [system asset view](https://cloud.innoslate.com/cornell/p/687/diagrams/asset/198986), [purchase asset view](https://cloud.innoslate.com/cornell/p/687/diagrams/asset/297373) and exported transfers links provide the I-squared boundary inventory. The repo's legacy contract documents the listed internal flows, purchase flows and local operation signatures. The release contract will document the actual HTTP exchanges separately. A native flow may span several HTTP exchanges, or stay internal to the one Node process.

| Flow | Model title | Native conduit | Legacy contracts/api-v1.yaml |
| --- | --- | --- | --- |
| [P-IF.01](https://cloud.innoslate.com/cornell/p/687/database/entity/269340) | Inventory View Query | P-C.1.5 | No dedicated legacy route |
| [P-IF.02](https://cloud.innoslate.com/cornell/p/687/database/entity/269341) | Planning Record Query | P-C.1.2 | No dedicated legacy route |
| [P-IF.03](https://cloud.innoslate.com/cornell/p/687/database/entity/269342) | Scoped Planning Records | P-C.1.2 | No dedicated legacy route |
| [P-IF.04](https://cloud.innoslate.com/cornell/p/687/database/entity/269343) | Planning Analysis Request | P-C.2.5 | No dedicated legacy route |
| [P-IF.05](https://cloud.innoslate.com/cornell/p/687/database/entity/269344) | Proposed Purchasing Advice | P-C.2.3 | No dedicated legacy route |
| [P-IF.06](https://cloud.innoslate.com/cornell/p/687/database/entity/269345) | Reviewable Purchase Draft | P-C.3.5 | No dedicated legacy route |
| [P-IF.07](https://cloud.innoslate.com/cornell/p/687/database/entity/269346) | Recorded Supplier Order State | P-C.3.5 | No dedicated legacy route |
| [P-IF.08](https://cloud.innoslate.com/cornell/p/687/database/entity/269347) | Scoped Inventory View Data | P-C.1.5 | No dedicated legacy route |
| [P-IF.09](https://cloud.innoslate.com/cornell/p/687/database/entity/269348) | Expiration and Performance Results | P-C.2.5 | No dedicated legacy route |
| [P-IF.10](https://cloud.innoslate.com/cornell/p/687/database/entity/269349) | Recorded Recovery Context | P-C.1.4 | No dedicated legacy route |
| [P-IF.11](https://cloud.innoslate.com/cornell/p/687/database/entity/269350) | Recorded Recovery State | P-C.4.5 | No dedicated legacy route |
| [P-IF.12](https://cloud.innoslate.com/cornell/p/687/database/entity/269351) | Supply Exception Context | P-C.3.6 | No dedicated legacy route |
| [P-IF.13](https://cloud.innoslate.com/cornell/p/687/database/entity/269352) | Recovery Exception Context | P-C.4.6 | No dedicated legacy route |
| [P-IF.14](https://cloud.innoslate.com/cornell/p/687/database/entity/269353) | Authorized Supply Disposition | P-C.3.6 | No dedicated legacy route |
| [P-IF.15](https://cloud.innoslate.com/cornell/p/687/database/entity/269354) | Authorized Recovery Disposition | P-C.4.6 | No dedicated legacy route |
| [P-IF.16](https://cloud.innoslate.com/cornell/p/687/database/entity/269355) | Authorized Task Constraints | P-C.1.6, P-C.2.6, P-C.3.6, P-C.4.6, P-C.5.6 | No dedicated legacy route |
| [P-IF.17](https://cloud.innoslate.com/cornell/p/687/database/entity/269356) | Recoverable Operational Snapshot | P-C.1.6 | No dedicated legacy route |
| [P-IF.18](https://cloud.innoslate.com/cornell/p/687/database/entity/269357) | Restored Operational State | P-C.1.6 | No dedicated legacy route |
| [P-IF.19](https://cloud.innoslate.com/cornell/p/687/database/entity/269358) | Purchase Transaction Record | P-C.1.3 | No dedicated legacy route |
| [P-IF.20](https://cloud.innoslate.com/cornell/p/687/database/entity/269359) | Recovery Transaction Record | P-C.1.4 | No dedicated legacy route |
| [P-IF.21](https://cloud.innoslate.com/cornell/p/687/database/entity/269360) | Purchase Record Retention Result | P-C.1.3 | No dedicated legacy route |
| [P-IF.22](https://cloud.innoslate.com/cornell/p/687/database/entity/269361) | Recovery Record Retention Result | P-C.1.4 | No dedicated legacy route |
| [P-IF.23](https://cloud.innoslate.com/cornell/p/687/database/entity/269362) | Order State Query | P-C.3.5 | No dedicated legacy route |
| [P-IF.24](https://cloud.innoslate.com/cornell/p/687/database/entity/269363) | Operating Task Observations | P-C.1.6, P-C.2.6, P-C.3.6, P-C.4.6, P-C.5.6 | No dedicated legacy route |
| [PC-IF.01](https://cloud.innoslate.com/cornell/p/687/database/entity/297381) | Current Draft Snapshot | P-C.3_1.3_2 | No dedicated legacy route |
| [PC-IF.02](https://cloud.innoslate.com/cornell/p/687/database/entity/297382) | Retained Approval Reference | P-C.3_2.3_3 | No dedicated legacy route |
| [PC-IF.03](https://cloud.innoslate.com/cornell/p/687/database/entity/297383) | Order Dispatch Outcome | P-C.3_3.3_4 | No dedicated legacy route |

## Risks

[Task 6 risk matrix](https://cloud.innoslate.com/cornell/p/687/diagrams/risk/319805) and the current approved-order persistence ADR were checked together. T6.R1 scores 12 in the Task 6 assessment. Its failure is a recovered order whose retained quantities contradict explicit approval. The existing classroom mitigation detects that contradiction and quarantines transaction writes while retaining the raw record and a validated prior checkpoint. The Windows integration must carry that control over to the server file.

The export shows T6.R1 under T6.RISK. It does not show a direct mitigated-by relation to T6.A.2 Recovery integrity guard. The model owner should verify and add that link with the executable test evidence.

| Risk | Model title | Task 6 score |
| --- | --- | --- |
| [P-TR.01](https://cloud.innoslate.com/cornell/p/687/database/entity/265032) | Incomplete or stale ingredient records | See native record |
| [P-TR.02](https://cloud.innoslate.com/cornell/p/687/database/entity/265033) | Mismatch between approved and transmitted order versions | See native record |
| [P-TR.03](https://cloud.innoslate.com/cornell/p/687/database/entity/265034) | Uncertain supplier or recovery responses | See native record |
| [P-TR.04](https://cloud.innoslate.com/cornell/p/687/database/entity/265035) | Loss of restaurant boundaries or record integrity during access and recovery | See native record |
| [T6.R1](https://cloud.innoslate.com/cornell/p/687/database/entity/319807) | Inconsistent approved order after recovery | 12 |
| [T6.R2](https://cloud.innoslate.com/cornell/p/687/database/entity/319810) | Stale supplier status | 9 |
| [T6.R3](https://cloud.innoslate.com/cornell/p/687/database/entity/319813) | Planning input is stale or inconsistent | 6 |
| [T6.R4](https://cloud.innoslate.com/cornell/p/687/database/entity/319808) | Legacy storage migration delays release | 6 |
| [T6.RISK](https://cloud.innoslate.com/cornell/p/687/database/entity/319805) | PANTRI Purchase Risk Assessment | See native record |

## Product changes required by the model

- Preserve scoped inventory/event records and the separation of draft revision, retained approval, approved-order transmission, supplier status and physical receiving. PA.1, PA.3 and PC-IF.01 through PC-IF.03 are the allocation anchors.
- Keep planning arithmetic, units, unknown values and manager authority deterministic. Present grounded language-model explanations within PA.2 and PA.5.
- Apply demo role and transaction scope at the server boundary. Retain quarantine and checkpoint diagnostics within PA.6.
- Show the UC.2 correction history and read-only review. Treat adjacent performance and waste views as UC.4 context. Distinguish the waste record, manager recovery request, partner response and physical collection observation.
- Use the approved UC.1, UC.2 and provisional UC.11 model labels in documentation and preserve the ordinary English interface.

## Model changes for the team to review

- Add UC.11 Action, Sequence and Activity detail around SEQ.R01. Include requested scope, response, decline or exception, and evidence of pickup, with UC.8 and UC.12 as adjacent paths. Review the manager authorization handoff against the current support-command model and ADR 0003.
- Expand one function to level three in the hierarchy and matching IDEF0 for the poster. P-F.0.3.3 is a candidate. Keep retained approval and successful persistence as prerequisite controls.
- Review allocation for the Node REST boundary, JSON file with a prior checkpoint, local model adapter and validation/fallback, demo sessions and partner workspaces. Add interface and verification entities only after the team confirms names.
- Add the formal relationship and test evidence for T6.R1 and distinguish browser baseline evidence from server fault containment. Retain the bounded P-PCR.SW.03 verification status until its full reference set is exercised.
- Build the native integration Action Diagram from the interface verification record. The rubric requires the highest-risk interface to be exercised early and the integrated assets and interfaces to appear as mechanisms and inputs/outputs.
- Review UC.1.9A completeness-loop coverage and UC.2 prior/revised quantity, operator, reason and time coverage before declaring behavioral or operational acceptance.
