use clap::Parser;
use stellar_mcp_server_cli::{run, Args, BoxError};

#[tokio::main]
async fn main() -> Result<(), BoxError> {
    let args = Args::parse();
    run(args).await.map_err(|e| e.into())
}
