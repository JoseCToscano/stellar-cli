use clap::Parser;
use std::path::PathBuf;
use stellar_mcp_server_cli::{generate_mcp_server, ContractSource, NetworkConfig, Result};

#[derive(Parser, Debug)]
#[command(
    name = "stellar-mcp-server",
    about = "Generate MCP Server for Stellar/Soroban smart contracts",
    version,
    author = "Stellar Development Foundation <stellar-cli@stellar.org>"
)]
struct Args {
    /// Contract source: either a WASM file path or contract ID
    #[command(flatten)]
    pub contract_source: ContractSourceArgs,

    /// Directory where the MCP server project will be generated
    #[arg(long, short = 'o')]
    pub output_dir: PathBuf,

    /// Name for the generated MCP server project
    #[arg(long, short = 'n')]
    pub name: String,

    /// Network to use when fetching contract by ID (testnet, futurenet, mainnet)
    #[arg(long, default_value = "testnet")]
    pub network: String,

    /// Custom RPC URL (overrides network setting)
    #[arg(long)]
    pub rpc_url: Option<String>,

    /// Overwrite output directory if it already exists
    #[arg(long)]
    pub overwrite: bool,

    /// Suppress non-error output
    #[arg(long, short = 'q')]
    pub quiet: bool,
}

#[derive(Parser, Debug)]
#[group(required = true, multiple = false)]
struct ContractSourceArgs {
    /// Path to contract WASM file
    #[arg(long, group = "source")]
    pub wasm: Option<PathBuf>,

    /// Contract ID on the specified network
    #[arg(long, group = "source", visible_alias = "contract-id")]
    pub id: Option<String>,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    // Initialize logging
    if !args.quiet {
        tracing_subscriber::fmt()
            .with_writer(std::io::stderr)
            .with_env_filter(
                tracing_subscriber::EnvFilter::try_from_default_env()
                    .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"))
            )
            .init();
    }

    // Determine contract source
    let contract_source = if let Some(wasm_path) = args.contract_source.wasm {
        ContractSource::Wasm(wasm_path)
    } else if let Some(contract_id) = args.contract_source.id {
        ContractSource::ContractId {
            id: contract_id,
            network: NetworkConfig::from_name_or_url(&args.network, args.rpc_url)?,
        }
    } else {
        unreachable!("Clap should ensure one source is provided");
    };

    // Check output directory
    if args.output_dir.is_file() {
        return Err(stellar_mcp_server_cli::Error::OutputDirIsFile(args.output_dir));
    }
    
    if args.output_dir.exists() && !args.overwrite {
        return Err(stellar_mcp_server_cli::Error::OutputDirExists(args.output_dir));
    }
    
    // Generate the MCP server
    generate_mcp_server(
        &contract_source,
        &args.output_dir,
        &args.name,
        args.overwrite,
        !args.quiet,
    )
    .await?;

    Ok(())
}