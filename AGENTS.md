# AGENTS.md - Example Static Website

## Overview
This repository is an **example static website** that demonstrates deploying a simple HTML site to AWS using S3 and CloudFront. GitHub Pages can optionally be configured as an alternative hosting option. It serves as a reference for static website deployment patterns.

## Purpose
This is a demonstration/example repository — not a production company website. It showcases:
- Static website hosting on AWS S3 + CloudFront
- GitHub Actions workflow for automated deployment
- GitHub Pages as an optional alternative deployment target (requires manual setup)
- React 18 minimal frontend

## AWS Infrastructure

### CloudFront Distribution
- **Distribution ID**: Stored as GitHub secret `CLOUDFRONT_DISTRIBUTION_ID`
- **Purpose**: CDN for global distribution of static assets

### S3 Bucket
- **Bucket Name**: Configured via `S3_BUCKET` env var in the deploy workflow
- **Region**: ca-central-1
- **Configuration**: Static website hosting via CloudFront (not direct S3 website hosting)

## Repository Structure
```
/
├── .github/
│   └── workflows/
│       └── deploy-aws.yml  # GitHub Action for AWS deployment
├── docs/                   # Public website assets (GitHub Pages root)
│   └── index.html          # Main landing page
├── AGENTS.md               # This file
├── LICENSE                 # Proprietary license
└── README.md               # Repository documentation
```

## Technology Stack
- **Frontend**: React 18 (CDN-hosted via unpkg)
- **Hosting**: AWS S3 + CloudFront (GitHub Pages available as optional alternative)
- **CI/CD**: GitHub Actions with OIDC-based AWS authentication

## Development Guidelines

### Deployment Process
To deploy changes to the website:

1. **Update local files** in this repository
2. **Push to GitHub** — If GitHub Pages has been configured (see README), the site updates automatically on push
3. **Deploy to AWS** — Use the "Deploy to AWS" GitHub Action (manual trigger) or run locally:
   ```bash
   aws s3 sync docs/ s3://$S3_BUCKET/
   aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
   ```

### GitHub Actions
- **Deploy to AWS** (`deploy-aws.yml`): Manual workflow for deploying to S3 and invalidating CloudFront cache
  - Uses OIDC federation for secure, secretless AWS authentication
  - Repository secrets: `AWS_ROLE_ARN`, `CLOUDFRONT_DISTRIBUTION_ID`

## Working with AI Agents
When collaborating with AI agents on this website:

1. **Content Changes**: Update [docs/index.html](docs/index.html) for text, layout, or structural changes
2. **Assets**: Add new images or assets to the `docs/` directory
3. **Testing**: Test locally before deploying
4. **Deployment**: Always invalidate CloudFront cache after S3 sync to ensure changes are visible

## Notes
- The website uses CDN-hosted React 18 (via unpkg)
- The S3 bucket is not configured for direct website hosting; CloudFront handles all requests
- GitHub Pages can optionally be configured as an alternative hosting target — see the README for setup instructions
- There is no automated GitHub Pages deployment workflow; it relies on GitHub's built-in Pages feature (Settings → Pages)
