#!/usr/bin/env python
from cdktf import App
from stacks.paddle_stack import PaddleStack, EnvConfig

app = App()

PaddleStack(
    app,
    "paddle-staging",
    config=EnvConfig(
        env_name="staging",
        aws_region="us-east-1",
        instance_type="t3.micro",
        db_instance_class="db.t3.micro",
    ),
)

PaddleStack(
    app,
    "paddle-production",
    config=EnvConfig(
        env_name="production",
        aws_region="us-east-1",
        instance_type="t3.micro",
        db_instance_class="db.t3.micro",
    ),
)

app.synth()
