# paperclip-plugin-company-setup-optimizer

`paperclip-plugin-company-setup-optimizer` is the audit and optimization layer for Paperclip companies.

It is built to answer one question with much higher rigor than a normal setup dashboard:

> Is this company truly optimized to operate independently, safely, clearly, and effectively inside Paperclip?

The plugin is designed to inspect a company across every meaningful setup axis, score it, surface blockers, and convert only the right gaps into native Paperclip issues.

## What It Is For

- company setup audits
- activation readiness scoring
- agent/runtime/skill fitness checks
- governance and approval gap detection
- connector/account isolation review
- dashboard and operator-UX review
- issue discipline around only-human-needed gaps

## Product Direction

The plugin is intentionally opinionated.

It should not be a passive status widget. It should become an optimization engine that:

- sees structural weakness
- prioritizes what matters most
- distinguishes noise from real blockers
- creates native Paperclip issues only when human intervention is actually needed
- helps turn a merely functional Paperclip company into a world-class operating unit

## What Is Implemented

- live worker-side audits using the Paperclip SDK for:
  - companies
  - agents
  - goals
  - issues
  - projects
  - project workspaces
- browser-side snapshot enrichment for host surfaces the worker SDK does not expose directly:
  - plugin inventory
  - company secrets metadata
  - company skills
  - agent skill snapshots
  - connector records and warnings
- per-axis scorecards
- issue-worthy gap detection
- native Paperclip issue materialization with dedupe markers
- per-finding dismissal / suppression
- portfolio summary page
- daily optimizer audit job
- maximum-optimizer PRD in [PRD.md](./PRD.md)

## Current Limits

The plugin is built and live-data-driven, but a few limits still come from the host API surface rather than missing plugin code:

- plugin inventory, secrets metadata, company skills, connector records, and agent skill detail still require browser-side snapshots because the worker SDK does not expose them directly
- there is no direct host API for per-widget render-failure telemetry, so plugin/UI health is inferred from plugin status, lastError, and related setup signals
- resolved optimizer issues are not auto-closed yet because blind auto-closure is too risky without stronger operator intent and issue-state semantics

## Native Tools

- `analyze_company_setup`
- `summarize_company_blockers`
- `generate_setup_optimization_report`
- `open_setup_gap_issue`
- `suggest_company_activation_sequence`

## Verify

```bash
npm install
npm run verify
```

## Repository

- GitHub: [Ola-Turmo/paperclip-plugin-company-setup-optimizer](https://github.com/Ola-Turmo/paperclip-plugin-company-setup-optimizer)
