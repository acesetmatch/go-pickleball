# CDKTF — paddle-recommender infrastructure

CDKTF (Python) Infrastructure as Code for the paddle-recommender platform.

## Setup

```sh
pip install -r requirements.txt
cdktf get   # Generates Python bindings for the AWS provider
```

## Manual usage

Normally driven via `paddle-cli`, but you can also run CDKTF directly:

```sh
cdktf synth                            # Generate Terraform config to ./cdktf.out
cdktf plan paddle-staging              # Preview changes
cdktf deploy paddle-staging --auto-approve
cdktf destroy paddle-staging --auto-approve
```

## Stacks

| Stack name           | Purpose                          |
|----------------------|----------------------------------|
| `paddle-staging`     | Staging environment              |
| `paddle-production`  | Production environment           |

Each stack provisions an isolated VPC, EC2 (k3s), and RDS PostgreSQL.

## Outputs

After `cdktf deploy`, retrieve outputs with:

```sh
cdktf output paddle-staging
```

Key outputs:

- `ec2_public_ip` / `ec2_public_dns` — k3s node access
- `db_endpoint` — RDS hostname
- `db_secret_lookup_hint` — AWS CLI command to fetch the RDS master password from Secrets Manager

## Retrieving the kubeconfig

After provisioning, copy the k3s kubeconfig from EC2 and rewrite the server URL:

```sh
PUBLIC_IP=$(cdktf output paddle-staging | grep ec2_public_ip | awk '{print $3}')
scp -i ~/.ssh/id_ed25519 ubuntu@$PUBLIC_IP:.kube/config /tmp/paddle-staging.yaml
sed -i '' "s/127.0.0.1/$PUBLIC_IP/" /tmp/paddle-staging.yaml
export KUBECONFIG=/tmp/paddle-staging.yaml
kubectl get nodes
```
