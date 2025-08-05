use clap::Parser;
use stellar_mcp_server_cli::{run, Args, BoxError};
use tracing_subscriber::fmt;

#[tokio::main]
async fn main() -> Result<(), BoxError> {
    fmt::init();
    let args = Args::parse();
    run(args).await.map_err(|e| e.into())
}
