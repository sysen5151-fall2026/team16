# ADR 0008 Passwordless demo roles

**Decision date** 2026-11-22
**Status** Accepted for the classroom release

## Context

The classroom demonstration needs quick switching between five actors on a single machine. Each actor must see the same applicable record from a different scoped workspace. The user can select any of the preconfigured synthetic accounts.

## Decision

Offer passwordless demo sign-in for Restaurant Manager, Restaurant Staff, Ingredient Supplier, Recovery Partner and PANTRI Staff. The service issues an opaque demo session token and verifies it at the server boundary. The browser uses the token for role-scoped reads and commands. All five roles use the same restaurant state. The session tracks the selected demo role for up to eight hours in the current process. Production identity verification and multi-restaurant isolation are outside this delivery's scope.

| Demo role | Workspace and authority |
| --- | --- |
| Restaurant Manager | Review records and reports, revise and approve a purchase, dispatch the retained order, initiate or cancel a recovery request and operate Demo tools. |
| Restaurant Staff | View inventory and sent orders for receiving, and record deliveries, use, counts and waste. |
| Ingredient Supplier | View orders sent to Prime Foods and record confirmation, partial confirmation, delay or exception. |
| Recovery Partner | View requests for Community Food Recovery and record acceptance, decline or pickup. |
| PANTRI Staff | View service and model status, checkpoint diagnostics and operation outcomes. |

Manager simulation is an explicitly selected classroom control. The ordinary demonstration uses the supplier and recovery portals. A supplier response changes order status. Actual receiving records stock. Recovery acceptance holds the reservation until physical pickup is recorded or the manager cancels.

## Model alignment and differences

- P-F.0.6.1 Apply Restaurant Access Policies, PA.6.1 Task Authorization Module, P-IF.16 Authorized Task Constraints, P-AFR.18 Apply scoped task authorization and P-SFR.02 through P-SFR.05 anchor role controls. Review the physical allocation of account selection, session issuance and partner scope checks. P-NFR.02 Support Authorized Use Without Cross Restaurant Access requires a broader deployment boundary than the single-restaurant demo.
- PA.3.4 Supplier State Module and PA.4.2 Recovery Exchange Module now receive recorded responses through synthetic partner portals. UC.9 Ingredient Supplier Processes Purchase Order and provisional UC.11 Recovery Partner Processes Waste Collection Request are the corresponding actor views. The model needs the actual portal exchange and UC.11's native Action, Sequence and Activity details.
- PA.6.2 Service Observation Module and UC.13 PANTRI Staff Monitors System Operation anchor the support console. PA.4.1 Recovery Request Module and P-AFR.12 Prepare authorized recovery requests anchor manager initiation. Review this authority allocation against the existing scoped support-command assumptions in ADR 0003, including P-IO.07, P-IF.10 and P-IF.16. [Live model baseline](../../classroom-demo/docs/model-baseline.md#model-changes-for-the-team-to-review) · [ADR 0003](0003-recovery-request-authorization.md)
