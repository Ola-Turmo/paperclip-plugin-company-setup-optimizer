# PRD: paperclip-plugin-company-setup-optimizer

Version: 0.1  
Status: Draft  
Plugin type: Cross-company audit, scorecard, and optimization issue engine  
Purpose: Analyze each Paperclip company across every meaningful setup axis, detect what is not truly optimized, and create native Paperclip issues only when operator intervention is actually needed.

---

## 1. Product Summary

`paperclip-plugin-company-setup-optimizer` is the optimization layer for the Paperclip control plane.

Its job is to continuously inspect whether a company is:

- structurally sound
- operationally safe
- independently runnable
- well-governed
- skill-complete
- connector-complete
- actually usable by the operator
- genuinely optimized for its real mission

The plugin should not be a passive dashboard.

It should function as a high-rigor optimization engine that:

1. inspects the company setup
2. scores the company by axis
3. identifies critical blockers and meaningful gaps
4. distinguishes informational findings from intervention-worthy findings
5. opens native Paperclip issues only for the latter

### Current implementation status

Done now:

- live SDK audit for companies, agents, goals, issues, projects, and workspaces
- typed optimization rule catalog across all major setup axes
- per-axis and overall scoring
- browser-side snapshot enrichment for plugins, secrets metadata, company skills, connector records, and agent skill snapshots
- issue-worthy gap generation
- native Paperclip issue materialization
- stale optimizer issue reconciliation when a finding is no longer issue-worthy
- finding dismissal / suppression
- portfolio summary view
- daily optimizer audit job

Behavior refined after live portfolio use:

- paused zero-budget org skeletons are not penalized as if they were already active operating companies
- future activation account gaps on paused companies remain visible as warnings, but they no longer become native issues until the company is closer to real activation
- optimizer-created native issues can now be reconciled automatically when a finding stops qualifying as an issue-worthy gap

Still constrained by host/API limits:

- plugin inventory, secrets metadata, connector records, company skills, and agent skill detail are not exposed directly to the worker SDK, so the plugin uses browser-side snapshots for those surfaces
- per-widget UI render failure telemetry is not directly exposed, so UI health is inferred from plugin status, lastError, and related setup signals
- plugin inventory, connector records, and richer operator-UX telemetry still depend on browser-side snapshots until the worker SDK exposes those surfaces directly

---

## 2. Core Promise

> Every Paperclip company should know exactly what is still weak, what matters most, and what must be fixed before the company can operate at a world-class level.

---

## 3. Product Thesis

Most Paperclip installations fail by stopping at “configured.”

That is too weak.

A company can be configured and still be:

- overbuilt
- under-governed
- not independently operable
- connected but not isolated
- skill-rich but role-misaligned
- visually present but operationally awkward
- technically alive but strategically under-optimized

The optimizer plugin exists to close that gap.

It should make setup quality legible, comparable, and actionable.

---

## 4. Primary Users

- founder / operator
- company CEO agent
- operations manager
- platform team / Parallel Company AI
- future managed-service operators

---

## 5. Core Jobs To Be Done

### 5.1 Audit setup quality

Inspect a company on every major setup axis.

### 5.2 Surface what matters

Show critical blockers, not just raw observations.

### 5.3 Protect issue quality

Create issues only when human action, approval, judgment, missing credentials, or a durable structural fix is required.

### 5.4 Support safe activation

Tell the operator whether the company is actually ready to move forward independently.

### 5.5 Drive compounding optimization

Turn setup quality into an ongoing, measurable improvement loop rather than a one-time checklist.

---

## 6. Optimization Axes

The plugin should check the company across these axes:

1. company identity and mission
2. org structure
3. agent runtime quality
4. skills and repo intelligence
5. goals, projects, and issue architecture
6. governance and approvals
7. connector and external account setup
8. email, social, analytics, and growth surfaces
9. product and delivery infrastructure
10. safety, security, and compliance
11. plugin coverage and plugin fit
12. data, memory, and learning
13. activation readiness
14. UX and operator usability
15. efficiency and cost discipline

---

## 7. Example Check Universe

The plugin should support a large typed rule catalog. Example high-value checks include:

- CEO exists and is unique
- all required manager roles exist for the company type
- no orphan agents
- agent adapters fit role expectations
- no stale desired skill keys
- company repo skills exist and are attached
- missing company-specific repos/workspaces
- goal tree is complete and not placeholder-like
- governance issue baseline exists
- approval classes exist for risky action types
- company-specific connector/account records exist
- external accounts are company-scoped, not generic
- dashboard critical surfaces render correctly
- key plugins are installed where needed
- noisy plugins are disabled where not ready
- regulated companies have stronger review defaults
- activation blockers are explicit
- next activation move is clear

---

## 8. Scoring Model

Each company should get:

- overall optimization score
- readiness score
- safety score
- independence score
- governance score
- execution readiness score
- connector coverage score
- usability score
- compounding / learning score

Scoring should not be vanity. It should be a weighted function of the rule engine.

---

## 9. Rule Engine

Each rule should include:

- id
- axis
- title
- why it matters
- severity
- confidence
- whether it blocks activation
- whether it should open a native issue
- suggested fix
- operator impact
- optional auto-fix eligibility

The engine should return:

- pass
- warning
- failing
- critical

---

## 10. Native Issue Policy

The plugin should only create native Paperclip issues when:

- a human/operator decision is needed
- credentials or external accounts are missing
- structure is missing
- safety or compliance is insufficient
- a durable multi-step improvement deserves tracking
- activation is blocked

The plugin should **not** create issues for:

- informational observations
- cosmetic findings
- safe auto-fix opportunities
- duplicate already-open setup gaps
- low-signal noise

Instead it should surface those via:

- scorecards
- warnings
- grouped recommendations
- suggested fixes

---

## 11. Main Plugin Modules

### 11.1 Optimization Catalog

A typed registry of optimization axes and checks.

### 11.2 Company Audit Engine

Evaluates the company against the catalog using live Paperclip state.

### 11.3 Scorecard Generator

Builds the per-axis and overall score view.

### 11.4 Issue Candidate Generator

Converts only meaningful setup gaps into issue drafts.

### 11.5 Activation Readiness Layer

Explains whether the company can move forward independently.

### 11.6 Optimization History

Tracks what was fixed, what remains, and whether the company is getting better over time.

---

## 12. UI Surfaces

The plugin should expose:

- dashboard widget
- company optimizer page
- settings page
- future portfolio view

The company page should show:

- scorecard
- critical blockers
- activation readiness
- issue-worthy gaps
- warnings that do not deserve issues
- per-axis detail
- suggested next moves

---

## 13. Native Tools

### `analyze_company_setup`

Return the current audit report for the company.

### `summarize_company_blockers`

Return only the activation blockers and high-severity issues.

### `generate_setup_optimization_report`

Return a structured report suitable for an operator review.

### `open_setup_gap_issue`

Create a native Paperclip issue from an issue-worthy finding.

### `suggest_company_activation_sequence`

Recommend the best next activation step for the company.

---

## 14. Best-In-World Design Standard

To be world class, the plugin must:

- understand company type, not just generic completeness
- understand regulated vs non-regulated risk
- understand independent operation vs shared platform reuse
- understand intentional pause vs missing setup
- optimize for operator clarity, not just rule satisfaction
- avoid issue spam
- distinguish overbuilt from underbuilt
- be strict enough to improve quality without becoming bureaucratic noise

---

## 15. Acceptance Criteria For V1

The plugin is ready when it can:

- expose a complete optimization axis model
- score a company using a structured rule engine
- summarize critical blockers and activation readiness
- produce issue candidates for meaningful gaps
- avoid creating issues for low-signal or non-intervention findings
- render a useful company dashboard page and widget
- give a strong implementation base for wiring in live Paperclip objects next

---

## 16. One-Sentence Internal Rule

Do not reward “configured.” Reward companies that are actually ready, safe, independent, and operator-friendly.
