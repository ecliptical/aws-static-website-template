# Example Static Website

An **example static website** demonstrating how to deploy a simple HTML site to AWS using S3 and CloudFront, with GitHub Pages as an alternative hosting option.

## Overview

This repository serves as a reference for static website deployment patterns, showcasing:
- Static website hosting on **AWS S3 + CloudFront**
- **GitHub Actions** workflow for automated deployment (OIDC-based AWS authentication)
- **GitHub Pages** as an alternative deployment target
- **React 18** minimal frontend

## 📁 Repository Structure

```
/
├── .github/
│   └── workflows/
│       └── deploy-aws.yml  # GitHub Action for AWS deployment
├── docs/                   # Public website assets (GitHub Pages root)
│   └── index.html          # Main landing page
├── AGENTS.md               # AI agent collaboration guidelines
├── LICENSE                 # Proprietary license
└── README.md               # This file
```

## 🚀 Deployment

### GitHub Pages

If configured, the site deploys automatically from the `/docs` folder on push.

### AWS (S3 + CloudFront)

Use the **"Deploy to AWS"** GitHub Action (manual trigger) or run locally:

```bash
# Sync to S3
aws s3 sync docs/ s3://$S3_BUCKET/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
```

The GitHub Action uses OIDC federation for secure, secretless authentication with AWS.

#### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC authentication |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution to invalidate |

## 📄 License

This project is proprietary software. See [LICENSE](LICENSE) for details.
