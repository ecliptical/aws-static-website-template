# AGENTS.md - Static Website Starter Template

## Overview
This repository is a **starter template** for deploying a simple static website to AWS using S3 and CloudFront, provisioned with AWS CDK (TypeScript). GitHub Pages can optionally be configured as an alternative hosting option. End-users bring their own domain name and configure DNS (optionally via Route 53).

## Purpose
This is a starter/template repository for simple static websites. It showcases:
- AWS infrastructure as code via CDK (TypeScript)
- Static website hosting on AWS S3 + CloudFront
- Custom domain support with ACM TLS certificates
- Route 53 DNS integration (optional)
- GitHub Actions workflow for automated content deployment (OIDC-based)
- GitHub Pages as an optional alternative deployment target (requires manual setup)
- React 18 minimal frontend example

## AWS Infrastructure (CDK)

The CDK stack (`infra/lib/static-site-stack.ts`) provisions:

### Always Created
- **S3 Bucket**: Private bucket (block all public access, S3-managed encryption, RETAIN on delete)
- **CloudFront Distribution**: OAC-based S3 origin, HTTPS redirect, default root object `index.html`

### Created When `domainName` + `hostedZoneName` Are Set
- **ACM Certificate**: DNS-validated via Route 53
- **Route 53 Records**: A and AAAA alias records pointing to CloudFront

### Created When `domainName` + `certificateArn` Are Set
- CloudFront configured with the custom domain and pre-existing certificate

### Created When GitHub Repo Is Detected
The GitHub repo (`owner/repo`) is auto-detected from the `origin` Git remote at synth time.
- **GitHub OIDC Provider**: For secretless GitHub Actions authentication
- **IAM Deploy Role**: Grants permission to assume CDK bootstrap roles for deployment

### CDK Configuration
Settings are in `infra/cdk.json` context:
- `domainName`: Custom domain (e.g., `www.example.com`)
- `hostedZoneName`: Route 53 hosted zone (e.g., `example.com`)
- `certificateArn`: Pre-existing ACM certificate ARN

### Stack Outputs
- `BucketName`: S3 bucket name
- `DistributionId`: CloudFront distribution ID
- `DistributionDomainName`: CloudFront domain
- `DeployRoleArn`: IAM role ARN → GitHub secret `AWS_ROLE_ARN`
- `SiteUrl`: Website URL (if custom domain configured)

## Repository Structure
```
/
├── .agents/
│   └── skills/
│       └── setup-site/
│           └── SKILL.md             # First-time setup skill for AI agents
├── .github/
│   ├── dependabot.yml               # Dependabot configuration
│   └── workflows/
│       ├── ci.yml                   # CI checks on pull requests
│       └── deploy-aws.yml           # GitHub Action for content deployment
├── docs/                            # Website content (deployed to S3)
│   ├── favicon.svg                  # Site favicon
│   └── index.html                   # Main landing page
├── infra/                           # AWS CDK infrastructure
│   ├── bin/app.ts                   # CDK app entry point
│   ├── lib/static-site-stack.ts     # Infrastructure stack
│   ├── cdk.json                     # CDK configuration
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
├── .gitignore
├── AGENTS.md                        # This file
├── LICENSE                          # MIT license
└── README.md                        # Repository documentation
```

## Technology Stack
- **Frontend**: React 18 (CDN-hosted via unpkg)
- **Infrastructure**: AWS CDK (TypeScript) — S3, CloudFront, ACM, Route 53, IAM
- **Hosting**: AWS S3 + CloudFront (GitHub Pages available as optional alternative)
- **CI/CD**: GitHub Actions with OIDC-based AWS authentication
- **Region**: Stack deploys to us-east-1 (required for CloudFront + ACM integration)

## Development Guidelines

### Infrastructure Changes
1. Edit CDK code in `infra/lib/static-site-stack.ts`
2. Run `cd infra && cdk diff` to preview changes
3. Run `cdk deploy` to apply

### Content Deployment
1. **Update files** in `docs/`
2. **Push to GitHub** — If GitHub Pages has been configured (see README), the site updates automatically on push
3. **Deploy to AWS** — Use the "Deploy to AWS" GitHub Action (manual trigger) or run locally:
   ```bash
   cd infra && npx cdk deploy --require-approval never
   ```

### GitHub Actions
- **CI** (`ci.yml`): Runs on pull requests targeting `main` — installs dependencies and runs `cdk synth` to validate infrastructure
  - Uses OIDC federation for AWS authentication (required for Route 53 hosted zone lookups during synth)
  - Secret: `AWS_ROLE_ARN`
- **Deploy to AWS** (`deploy-aws.yml`): Manual workflow that runs `cdk deploy` to deploy content and infrastructure
  - Uses OIDC federation for secure, secretless AWS authentication
  - Secret: `AWS_ROLE_ARN`
  - CDK `BucketDeployment` handles S3 sync and CloudFront cache invalidation automatically
  - Concurrency control prevents overlapping deployments

## First-Time Setup Workflow

When a user creates a repository from this template and asks an agent to set up their static website, follow this procedure **in order**. Ask the user for information where indicated; do not guess.

### Step 1: Verify Prerequisites

Run each command and confirm it succeeds before continuing:

```bash
node --version          # must be v18+
cdk --version           # AWS CDK CLI must be installed
gh --version            # GitHub CLI must be installed
gh auth status          # must be authenticated
aws sts get-caller-identity  # must return a valid account (confirms AWS CLI is configured)
```

If any check fails, refer the user to the Prerequisites section of the README.

### Step 2: Gather User Configuration

Ask the user (some or all of these may already have been provided in the initial prompt):

1. **Site title** — What should the website be called? *(used to update `docs/index.html` `<title>` and heading)*
2. **Custom domain** *(optional)* — Do you want a custom domain? If yes:
   - What is the domain name? (e.g., `www.example.com`)
   - Is the domain managed by Route 53? If yes: what is the hosted zone name? (e.g., `example.com`)
   - If not Route 53: do you have an existing ACM certificate ARN?
3. **Site content** — What content should the landing page display? *(use this to populate `docs/index.html`)*
4. **GitHub repository** — Where should the code be hosted? (e.g., `myuser/my-website`). Should it be public or private?

### Step 3: Configure CDK

Edit `infra/cdk.json` and set the `context` values:

```json
{
  "context": {
    "domainName": "<user's domain or empty string>",
    "hostedZoneName": "<user's hosted zone or empty string>",
    "certificateArn": "<user's cert ARN or empty string>"
  }
}
```

Leave values as empty strings (`""`) if not applicable — the CDK app treats empty strings as undefined.

### Step 4: Customize Site Content

Update `docs/index.html` with the user's desired content:  
- Set the `<title>` tag  
- Update the React `App` component to render the user's content  
- Update `docs/favicon.svg` if the user provides a custom icon  

### Step 5: Create GitHub Repository

If the user's GitHub repository doesn't already exist, create it:

```bash
# Create the repo (use --private or --public as requested by the user)
gh repo create <owner>/<repo> --private --source=. --push
```

If the repo already exists, add it as a remote and push:

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

> **Important:** The CI workflow (`.github/workflows/ci.yml`) triggers on pull requests to `main`. Make sure the default branch is named `main`. If `git init` created a `master` branch, rename it:
> ```bash
> git branch -m master main
> ```

### Step 6: Bootstrap CDK and Deploy

CDK requires a one-time bootstrap per AWS account/region. Check if it's already done and bootstrap if needed:

```bash
cd infra
npm install
cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/us-east-1
cdk deploy
```

Wait for the deploy to complete. Capture the stack outputs — they are printed at the end.

### Step 7: Set Up GitHub Actions Secret

If the stack output includes `DeployRoleArn` (it will when the repo is on GitHub):

```bash
cd infra && ./setup-github-secret.sh
```

Alternatively, set the secret directly:

```bash
gh secret set AWS_ROLE_ARN --repo <owner>/<repo> --body "<DeployRoleArn value>"
```

### Step 8: Commit and Push

Commit any changes made during setup (e.g., `cdk.json` configuration, `cdk.context.json`, content updates) and push:

```bash
git add -A
git commit -m "Configure site for deployment"
git push
```

### Step 9: Verify Deployment

Open the `DistributionDomainName` URL (or `SiteUrl` if a custom domain was configured) in a browser and confirm the site loads correctly.

> **Note:** CloudFront distributions can take a few minutes to fully propagate. If the custom domain doesn't resolve immediately, wait a moment and try again.

### Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `cdk deploy` fails with "Need to perform AWS calls" | AWS CLI not configured | Run `aws configure` |
| `cdk deploy` fails with "Has the environment been bootstrapped?" | CDK bootstrap not done | Run `cdk bootstrap aws://ACCOUNT-ID/us-east-1` |
| `cdk synth` fails with TS2591 "Cannot find name 'process'" | `@types/node` not resolved by TypeScript | Add `"types": ["node"]` to `compilerOptions` in `infra/tsconfig.json` |
| `DeployRoleArn` not in outputs | Repo not on GitHub / no `origin` remote | Push to GitHub first, then redeploy |
| CI workflow never runs on PRs | Default branch is `master`, not `main` | Rename with `git branch -m master main && git push -u origin main` |
| Certificate validation stuck | DNS not delegated to Route 53 | Check NS records at registrar match Route 53 hosted zone |
| Site shows old content after deploy | Browser cache | Hard-refresh or wait a few minutes for CloudFront edge propagation |

## Working with AI Agents

When collaborating with AI agents on an already-configured website:

1. **Content Changes**: Update [docs/index.html](docs/index.html) for text, layout, or structural changes
2. **Assets**: Add new images or assets to the `docs/` directory
3. **Infrastructure**: Modify `infra/lib/static-site-stack.ts` for AWS resource changes
4. **Local Preview**: Open `docs/index.html` directly in a browser, or run `npx serve docs` for a local HTTP server
5. **Deployment**: Run `cd infra && npx cdk deploy --require-approval never` — CDK `BucketDeployment` automatically syncs content to S3 and invalidates the CloudFront cache

## Notes
- The website uses CDN-hosted React 18 (via unpkg)
- The S3 bucket is private; CloudFront accesses it via Origin Access Control (OAC)
- The S3 bucket has a RETAIN removal policy — it won't be deleted on `cdk destroy`
- CDK `BucketDeployment` handles both S3 sync and CloudFront cache invalidation automatically — no separate invalidation step is needed
- GitHub Pages can optionally be configured as an alternative hosting target — see the README for setup instructions
- There is no automated GitHub Pages deployment workflow; it relies on GitHub's built-in Pages feature (Settings → Pages)
- The GitHub OIDC provider creation is idempotent; if one already exists in the account, it will be reused automatically
