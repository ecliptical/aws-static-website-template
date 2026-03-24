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

### Created When `githubRepo` Is Set
- **GitHub OIDC Provider**: For secretless GitHub Actions authentication
- **IAM Deploy Role**: Grants S3 read/write and CloudFront invalidation permissions

### CDK Configuration
Settings are in `infra/cdk.json` context:
- `githubRepo`: GitHub repo (`owner/repo`) for OIDC role
- `domainName`: Custom domain (e.g., `www.example.com`)
- `hostedZoneName`: Route 53 hosted zone (e.g., `example.com`)
- `certificateArn`: Pre-existing ACM certificate ARN

### Stack Outputs
- `BucketName`: S3 bucket name → GitHub variable `S3_BUCKET`
- `DistributionId`: CloudFront distribution ID → GitHub variable `CLOUDFRONT_DISTRIBUTION_ID`
- `DistributionDomainName`: CloudFront domain
- `DeployRoleArn`: IAM role ARN → GitHub secret `AWS_ROLE_ARN`
- `SiteUrl`: Website URL (if custom domain configured)

## Repository Structure
```
/
├── .github/
│   └── workflows/
│       └── deploy-aws.yml          # GitHub Action for content deployment
├── docs/                            # Website content (deployed to S3)
│   └── index.html                   # Main landing page
├── infra/                           # AWS CDK infrastructure
│   ├── bin/app.ts                   # CDK app entry point
│   ├── lib/static-site-stack.ts     # Infrastructure stack
│   ├── cdk.json                     # CDK configuration
│   ├── package.json
│   └── tsconfig.json
├── AGENTS.md                        # This file
├── LICENSE                          # Proprietary license
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
   aws s3 sync docs/ s3://$S3_BUCKET/ --delete
   aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
   ```

### GitHub Actions
- **Deploy to AWS** (`deploy-aws.yml`): Manual workflow for deploying content to S3 and invalidating CloudFront cache
  - Uses OIDC federation for secure, secretless AWS authentication
  - Secret: `AWS_ROLE_ARN`
  - Variables: `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`

## Working with AI Agents
When collaborating with AI agents on this website:

1. **Content Changes**: Update [docs/index.html](docs/index.html) for text, layout, or structural changes
2. **Assets**: Add new images or assets to the `docs/` directory
3. **Infrastructure**: Modify `infra/lib/static-site-stack.ts` for AWS resource changes
4. **Testing**: Test locally before deploying
5. **Deployment**: Always invalidate CloudFront cache after S3 sync to ensure changes are visible

## Notes
- The website uses CDN-hosted React 18 (via unpkg)
- The S3 bucket is private; CloudFront accesses it via Origin Access Control (OAC)
- The S3 bucket has a RETAIN removal policy — it won't be deleted on `cdk destroy`
- GitHub Pages can optionally be configured as an alternative hosting target — see the README for setup instructions
- There is no automated GitHub Pages deployment workflow; it relies on GitHub's built-in Pages feature (Settings → Pages)
- The GitHub OIDC provider is account-wide; if one already exists, remove `githubRepo` from context and create the IAM role manually
