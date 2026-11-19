# IncidentMesh case-note source

`stale-plan-ablation.json` is an unchanged copy of the public deterministic replay evidence at:

https://github.com/1337isnot1337/incidentmesh/blob/7bb27809e5a5278963a7186ebe3604246cbfbc9f/docs/evidence/stale-plan-ablation.json

SHA-256: `b117ee3b6e9504cbfe7e28820ec1a336cec7e2548deac6d5342c79ec7c270d4e`.

Its historical provider receipt points to a different source commit, `65d98f8feda666932fcbace88037c7009b487a35`. These identities must not be conflated. The replay freezes those hypotheses and changes only scheduling relative to the in-flight plan. It is not a fresh model run, hardware benchmark, or production incident response. Both candidate actions are proposal-only fixtures, and neither arm authorizes rollback.

The website tests compare the displayed revision stamps, reasons and action names with this evidence. They do not claim to rerun the provider or the prototype.
