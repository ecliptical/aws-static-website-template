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
gh --version                 # GitHub CLI installed
gh auth status               # GitHub CLI authenticated
aws sts get-caller-identity  # AWS credentials configured
```

If any fail, point the user to the **Prerequisites** section in [README.md](../../../README.md).

### 2. Ask the User

Gather this information (some may already have been provided in the initial prompt) — do not guess or assume defaults:

| Question | Used for | Required |
|----------|----------|----------|
| Site title | `<title>` tag and page heading in `docs/index.html` | Yes |
| Landing page content | React `App` component body in `docs/index.html` | Yes |
| Custom domain name | `domainName` in `infra/cdk.json` | No |
| Route 53 hosted zone | `hostedZoneName` in `infra/cdk.json` (only if custom domain) | No |
| ACM certificate ARN | `certificateArn` in `infra/cdk.json` (only if custom domain without Route 53) | No |
| GitHub repository | Where to host the code (e.g., `myuser/my-website`), public or private | Yes |

### 3. Apply Configuration

Edit these files with the user's answers:

- **`infra/cdk.json`** — Set `domainName`, `hostedZoneName`, `certificateArn` in the `context` object. Use empty strings for values that don't apply.
- **`docs/index.html`** — Update the `<title>`, and replace the React `App` component to render the user's content.
- **`docs/favicon.svg`** — Replace if the user provides a custom icon.

### 4. Create GitHub Repository

Create the repo if it doesn't exist (use `--private` or `--public` as the user requests):

```bash
gh repo create <owner>/<repo> --private --source=. --push
```

Make sure the default branch is named `main` (rename from `master` if needed):

```bash
git branch -m master main
```

### 5. Bootstrap CDK and Deploy

```bash
cd infra
npm install
cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/us-east-1
cdk deploy
```

Capture and display the stack outputs to the user.

### 6. Configure GitHub Actions

If `DeployRoleArn` appears in the outputs:

```bash
cd infra && ./setup-github-secret.sh
```

This sets the `AWS_ROLE_ARN` GitHub repository secret needed by the deploy workflow.

### 7. Commit and Push

Commit any changes made during setup and push:

```bash
git add -A
git commit -m "Configure site for deployment"
git push
```

### 8. Verify

Open the site URL from the stack outputs (`DistributionDomainName` or `SiteUrl`) and confirm it loads.
