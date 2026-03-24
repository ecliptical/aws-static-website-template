# Static Website Starter Template

A starter template for deploying a static website to AWS using S3 and CloudFront, provisioned with AWS CDK (TypeScript).

## Features

- **AWS S3 + CloudFront** for global static site hosting
- **AWS CDK** (TypeScript) for infrastructure as code
- **Custom domain** support with ACM TLS certificates
- **Route 53** integration for DNS management (optional)
- **GitHub Actions** workflow with OIDC authentication for automated deployment
- **GitHub Pages** as an optional alternative deployment target
- **React 18** minimal frontend example

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- [AWS CDK CLI](https://docs.aws.amazon.com/cdk/latest/guide/cli.html): `npm install -g aws-cdk`
- An AWS account with CDK bootstrapped: `cdk bootstrap aws://ACCOUNT-ID/us-east-1`

## Quick Start

1. **Use this template** — Click "Use this template" on GitHub, or clone the repository
2. **Configure** — Edit `infra/cdk.json` context with your settings (see [Configuration](#configuration))
3. **Deploy infrastructure** — `cd infra && npm install && cdk deploy`
4. **Set GitHub secrets/variables** — Copy CDK outputs into your repository settings (see [GitHub Actions Setup](#github-actions-setup))
5. **Deploy content** — Push to GitHub and run the "Deploy to AWS" action

## 📁 Repository Structure

```
/
├── .github/workflows/
│   └── deploy-aws.yml          # GitHub Action for content deployment
├── docs/                        # Website content (deployed to S3)
│   └── index.html               # Main landing page
├── infra/                       # AWS CDK infrastructure
│   ├── bin/app.ts               # CDK app entry point
│   ├── lib/static-site-stack.ts # Infrastructure stack
│   ├── cdk.json                 # CDK configuration
│   ├── package.json
│   └── tsconfig.json
├── AGENTS.md
├── LICENSE
└── README.md
```

## Infrastructure Setup

### Configuration

Edit `infra/cdk.json` to set your configuration in the `context` section:

| Setting | Required | Description |
|---------|----------|-------------|
| `githubRepo` | Recommended | Your GitHub repo (`owner/repo`) for OIDC deployment role |
| `domainName` | No | Custom domain (e.g., `www.example.com`) |
| `hostedZoneName` | No | Route 53 hosted zone (e.g., `example.com`); enables automatic cert validation and DNS records |
| `certificateArn` | No | Pre-existing ACM certificate ARN (alternative to Route 53 for custom domain) |

Example with a custom domain and Route 53:

```json
{
  "context": {
    "githubRepo": "your-org/your-repo",
    "domainName": "www.example.com",
    "hostedZoneName": "example.com"
  }
}
```

Example without a custom domain:

```json
{
  "context": {
    "githubRepo": "your-org/your-repo"
  }
}
```

### Deploy Infrastructure

```bash
cd infra
npm install
cdk deploy
```

The stack is deployed to **us-east-1** (required for CloudFront + ACM certificate integration). S3 content is served globally via CloudFront regardless of bucket region.

CDK will output the values needed for GitHub Actions:

| CDK Output | Set in GitHub as |
|------------|-----------------|
| `DeployRoleArn` | Secret: `AWS_ROLE_ARN` |
| `BucketName` | Variable: `S3_BUCKET` |
| `DistributionId` | Variable: `CLOUDFRONT_DISTRIBUTION_ID` |

> **Note:** The stack creates a GitHub OIDC identity provider in your AWS account. If you already have one (from another project), the deploy will fail. In that case, remove the `githubRepo` context value, deploy without it, and create the IAM role manually referencing your existing OIDC provider.

### Custom Domain Setup

#### Option A: Using Route 53 (Recommended)

This is the fully automated path. If your domain is registered outside of AWS, you first need to delegate DNS to Route 53:

1. **Create a hosted zone** in the [Route 53 console](https://console.aws.amazon.com/route53/v2/hostedzones)
   - Go to **Hosted zones → Create hosted zone**
   - Enter your domain name (e.g., `example.com`) and click **Create**
2. **Update name servers** at your domain registrar
   - Copy the 4 NS record values from the new Route 53 hosted zone
   - Replace the name servers at your domain registrar with these values
   - Wait for DNS propagation (can take up to 48 hours, but usually minutes)
3. **Configure CDK** — Set both `domainName` and `hostedZoneName` in `infra/cdk.json`
4. **Deploy** — Run `cdk deploy`. CDK will automatically:
   - Create an ACM TLS certificate (validated via Route 53 DNS)
   - Configure CloudFront with your custom domain
   - Create Route 53 A and AAAA alias records pointing to CloudFront

#### Option B: Using External DNS (Without Route 53)

If you prefer to manage DNS entirely outside of AWS:

1. **Create an ACM certificate** in the [ACM console](https://console.aws.amazon.com/acm/) (**must be in us-east-1**)
   - Request a public certificate for your domain
   - Choose DNS validation
   - Add the provided CNAME record at your DNS provider
   - Wait for validation to complete
2. **Configure CDK** — Set `domainName` and `certificateArn` in `infra/cdk.json`
3. **Deploy** — Run `cdk deploy`
4. **Create DNS record** at your DNS provider pointing to the CloudFront domain (from the `DistributionDomainName` output):
   - For a subdomain (e.g., `www.example.com`): add a CNAME record
   - For an apex domain (e.g., `example.com`): CNAME records don't work — use Route 53 (Option A) or a DNS provider that supports ALIAS/ANAME records

## Content Deployment

### GitHub Actions Setup

After running `cdk deploy`, configure your GitHub repository:

1. Go to **Settings → Secrets and variables → Actions**
2. Add a **Repository secret**: `AWS_ROLE_ARN` (from CDK output `DeployRoleArn`)
3. Add **Repository variables**: `S3_BUCKET` and `CLOUDFRONT_DISTRIBUTION_ID` (from CDK outputs)

Then go to **Actions → Deploy to AWS → Run workflow** to deploy content.

### Via CLI

```bash
aws s3 sync docs/ s3://YOUR_BUCKET_NAME/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## GitHub Pages (Optional)

The site can also be published via GitHub Pages since web assets live in the `docs/` directory:

1. Go to **Settings → Pages** in your GitHub repository
2. Under **Source**, select **Deploy from a branch**
3. Set the branch to `main` and the folder to `/docs`
4. Click **Save**

The site will be available at `https://<owner>.github.io/<repo>/` and updates automatically on push.

> **Note:** GitHub Pages is independent of the AWS deployment. You can use one or both.

## 📄 License

This project is proprietary software. See [LICENSE](LICENSE) for details.
