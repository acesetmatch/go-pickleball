from dataclasses import dataclass
from pathlib import Path

from cdktf import TerraformOutput, TerraformStack
from constructs import Construct

from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import (
    SecurityGroup,
    SecurityGroupIngress,
    SecurityGroupEgress,
)
from cdktf_cdktf_provider_aws.key_pair import KeyPair
from cdktf_cdktf_provider_aws.instance import Instance
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance


@dataclass
class EnvConfig:
    env_name: str
    aws_region: str = "us-east-1"
    instance_type: str = "t3.micro"
    db_instance_class: str = "db.t3.micro"
    db_engine_version: str = "16.4"
    db_allocated_storage: int = 20
    db_name: str = "paddle_recommender_db"
    db_username: str = "paddle_admin"
    ssh_public_key_path: str = "~/.ssh/id_ed25519.pub"


K3S_USER_DATA = """#!/bin/bash
set -eu
apt-get update -y
curl -sfL https://get.k3s.io | sh -
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
chmod 600 /home/ubuntu/.kube/config
"""


class PaddleStack(TerraformStack):
    def __init__(self, scope: Construct, ns: str, config: EnvConfig) -> None:
        super().__init__(scope, ns)

        prefix = f"paddle-{config.env_name}"
        common_tags = {"Project": "paddle-recommender", "Environment": config.env_name}

        AwsProvider(self, "aws", region=config.aws_region)

        public_key = Path(config.ssh_public_key_path).expanduser().read_text().strip()

        # ── Networking ────────────────────────────────────────────────────
        vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"{prefix}-vpc"},
        )

        subnet_a = Subnet(
            self,
            "subnet-a",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{config.aws_region}a",
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"{prefix}-subnet-a"},
        )

        # Second subnet exists only to satisfy RDS DB subnet group's two-AZ
        # requirement — the EC2 instance lives in subnet-a.
        subnet_b = Subnet(
            self,
            "subnet-b",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{config.aws_region}b",
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"{prefix}-subnet-b"},
        )

        igw = InternetGateway(
            self,
            "igw",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"{prefix}-igw"},
        )

        rt = RouteTable(
            self,
            "rt",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"{prefix}-rt"},
        )

        Route(
            self,
            "default-route",
            route_table_id=rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
        )

        RouteTableAssociation(self, "rta-a", subnet_id=subnet_a.id, route_table_id=rt.id)
        RouteTableAssociation(self, "rta-b", subnet_id=subnet_b.id, route_table_id=rt.id)

        # ── Security Groups ───────────────────────────────────────────────
        ec2_sg = SecurityGroup(
            self,
            "ec2-sg",
            name=f"{prefix}-ec2",
            vpc_id=vpc.id,
            description="paddle-recommender k3s node",
            ingress=[
                SecurityGroupIngress(
                    description="SSH",
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                ),
                SecurityGroupIngress(
                    description="Kubernetes API",
                    from_port=6443,
                    to_port=6443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                ),
                SecurityGroupIngress(
                    description="HTTP",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                ),
                SecurityGroupIngress(
                    description="HTTPS",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                ),
            ],
            egress=[
                SecurityGroupEgress(
                    description="All outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                ),
            ],
            tags={**common_tags, "Name": f"{prefix}-ec2-sg"},
        )

        rds_sg = SecurityGroup(
            self,
            "rds-sg",
            name=f"{prefix}-rds",
            vpc_id=vpc.id,
            description="paddle-recommender RDS PostgreSQL",
            ingress=[
                SecurityGroupIngress(
                    description="PostgreSQL from EC2 only",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[ec2_sg.id],
                ),
            ],
            egress=[
                SecurityGroupEgress(
                    description="All outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                ),
            ],
            tags={**common_tags, "Name": f"{prefix}-rds-sg"},
        )

        # ── Compute ───────────────────────────────────────────────────────
        key_pair = KeyPair(
            self,
            "ssh-key",
            key_name=prefix,
            public_key=public_key,
            tags=common_tags,
        )

        ubuntu_ami = DataAwsAmi(
            self,
            "ubuntu-ami",
            most_recent=True,
            owners=["099720109477"],  # Canonical
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"],
                ),
                DataAwsAmiFilter(name="virtualization-type", values=["hvm"]),
            ],
        )

        ec2 = Instance(
            self,
            "k3s-node",
            ami=ubuntu_ami.id,
            instance_type=config.instance_type,
            subnet_id=subnet_a.id,
            vpc_security_group_ids=[ec2_sg.id],
            key_name=key_pair.key_name,
            user_data=K3S_USER_DATA,
            user_data_replace_on_change=True,
            tags={**common_tags, "Name": f"{prefix}-k3s", "Role": "k3s-server"},
        )

        # ── Database ──────────────────────────────────────────────────────
        db_subnet_group = DbSubnetGroup(
            self,
            "db-subnet-group",
            name=prefix,
            subnet_ids=[subnet_a.id, subnet_b.id],
            tags=common_tags,
        )

        db = DbInstance(
            self,
            "postgres",
            identifier=prefix,
            engine="postgres",
            engine_version=config.db_engine_version,
            instance_class=config.db_instance_class,
            allocated_storage=config.db_allocated_storage,
            storage_type="gp3",
            db_name=config.db_name,
            username=config.db_username,
            manage_master_user_password=True,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            publicly_accessible=False,
            skip_final_snapshot=True,
            deletion_protection=False,
            tags={**common_tags, "Name": f"{prefix}-postgres"},
        )

        # ── Outputs ───────────────────────────────────────────────────────
        TerraformOutput(self, "ec2_public_ip", value=ec2.public_ip)
        TerraformOutput(self, "ec2_public_dns", value=ec2.public_dns)
        TerraformOutput(self, "db_endpoint", value=db.endpoint)
        TerraformOutput(self, "db_port", value=db.port)
        TerraformOutput(self, "db_name", value=config.db_name)
        TerraformOutput(self, "db_username", value=config.db_username)
        TerraformOutput(
            self,
            "db_secret_lookup_hint",
            value=f"aws secretsmanager get-secret-value --secret-id $(aws rds describe-db-instances --db-instance-identifier {prefix} --query 'DBInstances[0].MasterUserSecret.SecretArn' --output text) --query SecretString --output text",
        )
