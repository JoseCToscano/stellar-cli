use clap::Parser;
use soroban_cli::commands::{contract::bindings::mcp_server, global};

#[derive(Parser, Debug)]
#[command(name = "stellar-mcp-server")]
struct Cli {
    #[command(flatten)]
    global: global::Args,
    #[command(flatten)]
    cmd: mcp_server::Cmd,
}

#[tokio::main]
async fn main() -> Result<(), mcp_server::Error> {
    let cli = Cli::parse();
    cli.cmd.run(Some(&cli.global)).await
}
