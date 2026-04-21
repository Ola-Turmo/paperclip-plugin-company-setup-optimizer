import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "ola-turmo.paperclip-plugin-company-setup-optimizer",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Company Setup Optimizer",
  description: "World-class Paperclip company setup optimizer for auditing structure, skills, governance, connectors, activation readiness, and issue-worthy gaps.",
  author: "Ola Turmo",
  categories: ["automation", "ui"],
  capabilities: [
    "plugin.state.read",
    "plugin.state.write",
    "companies.read",
    "agents.read",
    "issues.read",
    "projects.read",
    "goals.read",
    "ui.dashboardWidget.register",
    "ui.page.register",
    "instance.settings.register",
    "agent.tools.register"
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui"
  },
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
  },
  tools: [
    {
      name: "analyze_company_setup",
      displayName: "Analyze company setup",
      description: "Return the current setup optimization report for the active company.",
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
      description: "Return the critical and activation-blocking setup gaps for the active company.",
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
      description: "Return the highest-value activation sequence based on the current optimizer report.",
      parametersSchema: {
        type: "object",
        properties: {
          companyId: { type: "string" }
        }
      }
    }
  ]
};

export default manifest;

