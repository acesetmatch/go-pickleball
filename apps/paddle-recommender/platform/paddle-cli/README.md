# paddle-cli

Self-service CLI for provisioning paddle-recommender infrastructure.

## Install

```sh
cd apps/paddle-recommender/platform/paddle-cli
pip install -e .
```

## Commands

```sh
paddle-cli provision --env staging      # Provision the staging stack
paddle-cli provision --env production   # Provision production
paddle-cli destroy   --env staging      # Tear down staging (prompts for confirmation)
paddle-cli --version                    # Print version
paddle-cli --help                       # Show help
```

## How it works

`paddle-cli` is a thin wrapper around CDKTF. When you run `paddle-cli provision --env staging`,
it shells out to `cdktf deploy paddle-staging --auto-approve` in the sibling `cdktf/` directory.

The CDKTF stack provisions:

- VPC + 2 public subnets in 2 AZs (RDS requirement)
- Internet Gateway + route table
- EC2 t3.micro running Ubuntu 22.04 with k3s installed via user-data
- RDS db.t3.micro PostgreSQL with master password in AWS Secrets Manager
- Security groups (EC2 open to internet on 22/80/443/6443; RDS only reachable from EC2)

## Prerequisites

- Python ≥ 3.11
- AWS CLI configured with credentials for the target account
- Node.js + CDKTF CLI: `npm install -g cdktf-cli`
- Terraform ≥ 1.5
- SSH public key at `~/.ssh/id_ed25519.pub` (or supply a custom path via `EnvConfig`)
- CDKTF Python packages installed: `cd ../cdktf && pip install -r requirements.txt && cdktf get`
