#!/usr/bin/env node
import { execSync } from 'child_process';
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from '../lib/static-site-stack';

function detectGithubRepo(): string | undefined {
  try {
    const url = execSync('git remote get-url origin', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    // Match SSH (git@github.com:owner/repo.git) or HTTPS (https://github.com/owner/repo.git)
    const match = url.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

const app = new cdk.App();

new StaticSiteStack(app, 'StaticSiteStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  domainName: app.node.tryGetContext('domainName') || undefined,
  hostedZoneName: app.node.tryGetContext('hostedZoneName') || undefined,
  certificateArn: app.node.tryGetContext('certificateArn') || undefined,
  githubRepo: detectGithubRepo(),
});
