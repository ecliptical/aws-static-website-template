import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export interface StaticSiteStackProps extends cdk.StackProps {
  domainName?: string;
  hostedZoneName?: string;
  certificateArn?: string;
  githubRepo?: string;
}

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StaticSiteStackProps = {}) {
    super(scope, id, props);

    // S3 bucket for website content
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Resolve certificate and hosted zone for custom domain
    let certificate: acm.ICertificate | undefined;
    let hostedZone: route53.IHostedZone | undefined;

    if (props.domainName && props.hostedZoneName) {
      // Look up existing Route 53 hosted zone
      hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: props.hostedZoneName,
      });

      // Create ACM certificate with automatic DNS validation via Route 53
      certificate = new acm.Certificate(this, 'SiteCertificate', {
        domainName: props.domainName,
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });
    } else if (props.domainName && props.certificateArn) {
      // Use a pre-existing ACM certificate
      certificate = acm.Certificate.fromCertificateArn(
        this, 'SiteCertificate', props.certificateArn,
      );
    }

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      ...(props.domainName && certificate
        ? { domainNames: [props.domainName], certificate }
        : {}),
    });

    // Deploy site content from docs/ directory
    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset('../docs')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Route 53 alias records (only when using Route 53 for DNS)
    if (hostedZone && props.domainName) {
      new route53.ARecord(this, 'SiteAliasRecord', {
        zone: hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution),
        ),
      });

      new route53.AaaaRecord(this, 'SiteAliasRecordV6', {
        zone: hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution),
        ),
      });
    }

    // GitHub Actions OIDC provider and deploy role
    if (props.githubRepo) {
      const githubOidcProviderArn = `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`;

      // Ensure the GitHub OIDC provider exists (idempotent — skips if already present)
      new cr.AwsCustomResource(this, 'EnsureGitHubOidc', {
        onCreate: {
          service: 'IAM',
          action: 'CreateOpenIDConnectProvider',
          parameters: {
            Url: 'https://token.actions.githubusercontent.com',
            ClientIDList: ['sts.amazonaws.com'],
            ThumbprintList: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
          },
          physicalResourceId: cr.PhysicalResourceId.of(githubOidcProviderArn),
          ignoreErrorCodesMatching: 'EntityAlreadyExists',
        },
        policy: cr.AwsCustomResourcePolicy.fromStatements([
          new iam.PolicyStatement({
            actions: ['iam:CreateOpenIDConnectProvider'],
            resources: ['*'],
          }),
        ]),
      });

      const oidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        this, 'GitHubOidc', githubOidcProviderArn,
      );

      const deployRole = new iam.Role(this, 'GitHubActionsDeployRole', {
        assumedBy: new iam.WebIdentityPrincipal(
          oidcProvider.openIdConnectProviderArn,
          {
            StringEquals: {
              'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            },
            StringLike: {
              'token.actions.githubusercontent.com:sub': `repo:${props.githubRepo}:*`,
            },
          },
        ),
        description: 'Role for GitHub Actions to deploy static site',
      });

      deployRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ['sts:AssumeRole'],
          resources: [
            `arn:aws:iam::${this.account}:role/cdk-hnb659fds-*-role-${this.account}-${this.region}`,
          ],
        }),
      );

      new cdk.CfnOutput(this, 'DeployRoleArn', {
        value: deployRole.roleArn,
        description: 'IAM role ARN for GitHub Actions (set as AWS_ROLE_ARN secret)',
      });
    }

    // Stack outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: siteBucket.bucketName,
      description: 'S3 bucket name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    if (props.domainName) {
      new cdk.CfnOutput(this, 'SiteUrl', {
        value: `https://${props.domainName}`,
        description: 'Website URL',
      });
    }
  }
}
