import click
import sys
from paddle_cli.infra.runner import run_cdktf


@click.command()
@click.option('--env', required=True, type=click.Choice(['staging', 'production'], case_sensitive=False), help='Target environment to destroy.')
@click.confirmation_option(prompt='This will destroy ALL resources in the environment. Continue?')
def destroy(env: str) -> None:
    """Destroy infrastructure for the given environment."""
    click.secho(f'🔥 Destroying paddle-recommender infrastructure for env={env}...', fg='yellow')
    code = run_cdktf('destroy', env)
    if code == 0:
        click.secho(f'✓ Destruction complete for env={env}', fg='green')
    else:
        click.secho(f'✗ Destruction failed for env={env} (exit code {code})', fg='red', err=True)
    sys.exit(code)
