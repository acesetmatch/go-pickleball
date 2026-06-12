import click
import sys

from paddle_cli.infra.runner import run_cdktf


@click.command()
@click.option('--env', required=True, type=click.Choice(['staging', 'production'], case_sensitive=False), help='Target environment to provision.')
def provision(env: str) -> None:
    """Provision infrastructure for the given environment."""
    click.secho(f'🚀 Provisioning paddle-recommender infrastructure for env={env}...', fg='cyan')
    code = run_cdktf('deploy', env)
    if code == 0:
        click.secho(f'✓ Provisioning complete for env={env}', fg='green')
    else:
        click.secho(f'✗ Provisioning failed for env={env} (exit code {code})', fg='red', err=True)
    sys.exit(code)
