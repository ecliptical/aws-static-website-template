# Example Static Website

An **example static website** demonstrating how to deploy a simple HTML site to AWS using S3 and CloudFront, with GitHub Pages as an alternative hosting option.

## Overview

This repository serves as a reference for static website deployment patterns, showcasing:
- Static website hosting on **AWS S3 + CloudFront**
- **GitHub Actions** workflow for automated deployment (OIDC-based AWS authentication)
- **GitHub Pages** as an optional alternative deployment target
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

### GitHub Pages (Optional)

This site can optionally be published via GitHub Pages since the web assets live in the `docs/` directory. To set it up:

1. Go to **Settings → Pages** in your GitHub repository
2. Under **Source**, select **Deploy from a branch**
3. Set the branch to `main` (or your default branch) and the folder to `/docs`
4. Click **Save**

Once configured, GitHub Pages will automatically publish the contents of `docs/` on every push to the selected branch. Your site will be available at `https://<owner>.github.io/<repo>/`.

> **Note:** GitHub Pages deployment is independent of the AWS deployment. You can use one or both.

## 📄 License

This project is proprietary software. See [LICENSE](LICENSE) for details.
