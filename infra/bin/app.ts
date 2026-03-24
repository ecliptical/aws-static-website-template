#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from '../lib/static-site-stack';

const app = new cdk.App();

new StaticSiteStack(app, 'StaticSiteStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  domainName: app.node.tryGetContext('domainName') || undefined,
  hostedZoneName: app.node.tryGetContext('hostedZoneName') || undefined,
  certificateArn: app.node.tryGetContext('certificateArn') || undefined,
  githubRepo: app.node.tryGetContext('githubRepo') || undefined,
});
