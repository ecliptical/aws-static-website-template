---
name: setup-site
description: 'Set up a new static website from this template. Use when: user asks to create, configure, initialize, set up, publish, or deploy their static website for the first time. Walks through prerequisites, configuration, deployment, and verification.'
argument-hint: 'Describe the website you want to create'
---

# Set Up Static Website

Interactive workflow to configure and deploy a static website from this starter template.

## Procedure

Follow AGENTS.md § "First-Time Setup Workflow" exactly. The steps are summarized here for quick reference — see AGENTS.md for full details including troubleshooting.

### 1. Check Prerequisites

Run and verify each succeeds:

```bash
node --version               # v18+
cdk --version                # AWS CDK CLI installed
aws sts get-caller-identity  # AWS credentials configured
```

If any fail, point the user to the **Prerequisites** section in [README.md](../../../README.md).

### 2. Ask the User

Gather this information — do not guess or assume defaults:

| Question | Used for | Required |
|----------|----------|----------|
| Site title | `<title>` tag and page heading in `docs/index.html` | Yes |
| Landing page content | React `App` component body in `docs/index.html` | Yes |
| Custom domain name | `domainName` in `infra/cdk.json` | No |
| Route 53 hosted zone | `hostedZoneName` in `infra/cdk.json` (only if custom domain) | No |
| ACM certificate ARN | `certificateArn` in `infra/cdk.json` (only if custom domain without Route 53) | No |

### 3. Apply Configuration

Edit these files with the user's answers:

- **`infra/cdk.json`** — Set `domainName`, `hostedZoneName`, `certificateArn` in the `context` object. Use empty strings for values that don't apply.
- **`docs/index.html`** — Update the `<title>`, and replace the React `App` component to render the user's content.
- **`docs/favicon.svg`** — Replace if the user provides a custom icon.

### 4. Deploy

```bash
cd infra
npm install
cdk deploy
```

Capture and display the stack outputs to the user.

### 5. Configure GitHub Actions

If `DeployRoleArn` appears in the outputs:

```bash
cd infra && ./setup-github-secret.sh
```

This sets the `AWS_ROLE_ARN` GitHub repository secret needed by the deploy workflow.

### 6. Verify

Open the site URL from the stack outputs (`DistributionDomainName` or `SiteUrl`) and confirm it loads.
