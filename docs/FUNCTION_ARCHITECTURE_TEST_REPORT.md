# Function architecture prototype verification

35 automated tests passed in the recorded run: 12 retained baseline tests and 23 additional architecture tests. The baseline includes two tests that execute the delivered HTML event handlers through a DOM adapter. The new suite covers the prepared message pipeline, quantity/version authority, unapproved/stale/incorrect-scope rejection, supplier association, metric/date boundaries, typed contract rejection, task observations, scoped recovery initiation and record restoration.

evidence/test-run.txt records the actual run. evidence/architecture-demo.json records prepared approval, supplier handoff and state presentation with 5/6/1 kg. These are synthetic/in-process results. No real supplier API, trained forecast, production authentication, persistence reliability, representative-user acceptance or operating-hour availability result is claimed.

Reproduce with Node.js: npm test; npm run demo:architecture. Generate stubs after a model-driven contract edit with npm run generate:contracts. The legacy offline HTML remains the Milestone 1 demonstration; the new architecture library is exercised by its separate prepared run. Independent human test and source review remain pending.
