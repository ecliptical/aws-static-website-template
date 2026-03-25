#!/usr/bin/env bash
set -euo pipefail

# Reads the DeployRoleArn from the CDK stack outputs and sets it
# as the AWS_ROLE_ARN secret in the GitHub repository.
#
# Prerequisites: aws cli, gh cli (authenticated), and a deployed stack.

STACK_NAME="${1:-StaticSiteStack}"
REGION="${AWS_REGION:-us-east-1}"

echo "Fetching DeployRoleArn from stack ${STACK_NAME}..."
ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='DeployRoleArn'].OutputValue" \
  --output text)

if [[ -z "$ROLE_ARN" || "$ROLE_ARN" == "None" ]]; then
  echo "Error: DeployRoleArn output not found. Is githubRepo set in cdk.json?" >&2
  exit 1
fi

echo "Setting GitHub Actions secret AWS_ROLE_ARN..."
gh secret set AWS_ROLE_ARN --body "$ROLE_ARN"

echo "Done. AWS_ROLE_ARN set to: ${ROLE_ARN}"
