import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "ola-turmo.paperclip-plugin-company-setup-optimizer",
  apiVersion: 1,
  version: "0.1.1",
  displayName: "Company Setup Optimizer",
  description: "Maximum-scope Paperclip optimizer for company setup quality, activation readiness, governance, connector isolation, and issue-worthy gaps.",
  author: "Ola Turmo",
  categories: ["automation", "ui"],
  capabilities: [
    "plugin.state.read",
    "plugin.state.write",
    "companies.read",
    "agents.read",
    "issues.read",
    "issues.create",
    "issues.update",
    "projects.read",
    "project.workspaces.read",
    "goals.read",
    "jobs.schedule",
    "activity.log.write",
    "agent.tools.register",
    "ui.dashboardWidget.register",
    "ui.page.register",
    "instance.settings.register"
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui"
  },
  jobs: [
    {
      jobKey: "daily-optimizer-audit",
      schedule: "0 6 * * *",
      displayName: "Daily optimizer audit",
      description: "Runs a full portfolio setup audit using live SDK data plus the most recent browser snapshots."
    }
  ],
  instanceConfigSchema: {
    type: "object",
    properties: {
      snapshotStaleHours: {
        type: "number",
        title: "Snapshot stale threshold (hours)",
        default: 24
      },
      autoIssueThreshold: {
        type: "string",
        title: "Automatic issue threshold",
        default: "off",
        enum: ["off", "critical", "high"]
      },
      issueTitlePrefix: {
        type: "string",
        title: "Issue title prefix",
        default: "[Setup Optimizer]"
      }
    }
  },
  tools: [
    {
      name: "analyze_company_setup",
      displayName: "Analyze company setup",
      description: "Return a live setup optimization report for the active company.",
      parametersSchema: {
        type: "object",
        properties: {
          companyId: { type: "string" }
        }
      }
    },
    {
      name: "summarize_company_blockers",
      displayName: "Summarize company blockers",
      description: "Return activation blockers and the most important setup gaps for the active company.",
      parametersSchema: {
        type: "object",
        properties: {
          companyId: { type: "string" }
        }
      }
    },
    {
      name: "suggest_company_activation_sequence",
      displayName: "Suggest company activation sequence",
      description: "Recommend the best next activation sequence from the optimizer report.",
      parametersSchema: {
        type: "object",
        properties: {
          companyId: { type: "string" }
        }
      }
    },
    {
      name: "open_setup_gap_issue",
      displayName: "Open setup gap issue",
      description: "Create or refresh a native Paperclip issue from an optimizer finding.",
      parametersSchema: {
        type: "object",
        required: ["key"],
        properties: {
          companyId: { type: "string" },
          key: { type: "string" }
        }
      }
    }
  ],
  ui: {
    slots: [
      {
        type: "dashboardWidget",
        id: "company-setup-optimizer-widget",
        displayName: "Setup Optimizer",
        exportName: "DashboardWidget"
      },
      {
        type: "page",
        id: "company-setup-optimizer-page",
        displayName: "Setup Optimizer",
        exportName: "CompanySetupOptimizerPage",
        routePath: "setup-optimizer"
      },
      {
        type: "settingsPage",
        id: "company-setup-optimizer-settings",
        displayName: "Setup Optimizer",
        exportName: "OptimizerSettingsPage"
      }
    ]
  }
};

export default manifest;
