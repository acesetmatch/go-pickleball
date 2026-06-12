import click
from paddle_cli import __version__
from paddle_cli.commands.provision import provision
from paddle_cli.commands.destroy import destroy


@click.group()
@click.version_option(version=__version__, prog_name='paddle-cli')
def main():
    """paddle-cli — Self-service infrastructure for the paddle-recommender platform."""


main.add_command(provision)
main.add_command(destroy)
