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

## Included In This Scaffold

- maximum-optimizer PRD in [PRD.md](./PRD.md)
- Paperclip plugin manifest scaffold
- typed optimization axes and check catalog
- worker routes for catalog, scorecard, and issue-candidate generation
- dashboard widget, company page, and settings page scaffold
- tests for catalog integrity

## Current Scaffold Mode

This repo currently ships the optimizer framework and a modeled report layer.

It does **not** yet pull every live Paperclip object into the rule engine. That is the next implementation phase. The scaffold is designed so you can progressively wire in:

- companies
- agents
- goals
- projects
- issues
- issue docs
- plugin registry
- company secrets metadata
- connector records
- runtime health
- dashboard rendering health

## Planned Native Tools

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

