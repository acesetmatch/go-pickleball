import subprocess
import sys
from pathlib import Path
from typing import Literal


CDKTF_DIR: Path = Path(__file__).resolve().parents[3] / 'cdktf'

Env = Literal['staging', 'production']


def stack_name(env: Env) -> str:
    return f'paddle-{env}'


def run_cdktf(action: Literal['deploy', 'destroy'], env: Env) -> int:
    stack = stack_name(env)
    cmd = ['cdktf', action, stack, '--auto-approve']
    print(f'→ Running: cdktf {action} {stack} in {CDKTF_DIR}', file=sys.stderr)
    if not CDKTF_DIR.exists():
        print(f'Error: CDKTF directory not found: {CDKTF_DIR}', file=sys.stderr)
        return 2
    result = subprocess.run(cmd, cwd=CDKTF_DIR)
    return result.returncode
