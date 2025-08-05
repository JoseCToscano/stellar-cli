use std::{fs, path::PathBuf};

use clap::Parser;
use soroban_rpc::Client;
use soroban_spec_tools::contract::Spec;
use soroban_spec_tools::utils::contract_id_from_str;
use soroban_spec_typescript::mcp_server::McpServerGenerator;
use stellar_xdr::curr::{
    ContractExecutable, Hash, LedgerEntryData, LedgerKey, Limits, ReadXdr, ScVal,
};
use thiserror::Error;

pub type BoxError = Box<dyn std::error::Error + Send + Sync>;

const EXAMPLES: &str = r#"Examples:
  stellar mcp-server --contract-id <ID> --rpc-url <URL> --network-passphrase <PHRASE> --output-dir ./server --name my-server
  stellar mcp-server --contract-id <ID> --wasm ./contract.wasm --output-dir ./server --name my-server
"#;

#[derive(Parser, Debug)]
#[command(
    author,
    version,
    about = "Generate an MCP server for a Soroban contract",
    long_about = None,
    after_long_help = EXAMPLES
)]
pub struct Args {
    /// Contract ID for the contract
    #[arg(long, env = "STELLAR_CONTRACT_ID", alias = "id")]
    pub contract_id: String,
    /// Optional local wasm file to use for spec generation instead of fetching from network
    #[arg(long)]
    pub wasm: Option<PathBuf>,
    /// RPC URL of the network (required if --wasm not provided)
    #[arg(long)]
    pub rpc_url: Option<String>,
    /// Network passphrase of the network (required if --wasm not provided)
    #[arg(long)]
    pub network_passphrase: Option<String>,
    /// Output directory for generated project
    #[arg(long)]
    pub output_dir: PathBuf,
    /// Overwrite output directory if it exists
    #[arg(long)]
    pub overwrite: bool,
    /// Name for the generated MCP server project
    #[arg(long)]
    pub name: String,
}

#[derive(Error, Debug)]
pub enum CliError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Spec(#[from] soroban_spec_tools::contract::Error),
    #[error(transparent)]
    Rpc(#[from] soroban_rpc::Error),
    #[error(transparent)]
    Xdr(#[from] stellar_xdr::curr::Error),
    #[error(transparent)]
    StrKey(#[from] stellar_strkey::DecodeError),
    #[error(transparent)]
    Mcp(#[from] soroban_spec_typescript::mcp_server::Error),
    #[error("missing required --rpc-url and --network-passphrase when no --wasm provided")]
    MissingNetwork,
    #[error("--output-dir cannot be a file: {0:?}")]
    IsFile(PathBuf),
    #[error("--output-dir already exists and you did not specify --overwrite: {0:?}")]
    OutputDirExists(PathBuf),
    #[error("unexpected contract data entry type")]
    UnexpectedContractData,
}

pub async fn run(args: Args) -> Result<(), CliError> {
    if args.output_dir.is_file() {
        return Err(CliError::IsFile(args.output_dir.clone()));
    }
    if args.output_dir.exists() {
        if args.overwrite {
            fs::remove_dir_all(&args.output_dir)?;
        } else {
            return Err(CliError::OutputDirExists(args.output_dir.clone()));
        }
    }
    fs::create_dir_all(&args.output_dir)?;

    let contract_id = args.contract_id.clone();
    let spec = if let Some(wasm_path) = args.wasm.clone() {
        let wasm_bytes = fs::read(wasm_path)?;
        let spec = Spec::new(&wasm_bytes)?.spec;
        if spec.is_empty() {
            eprintln!("Warning: contract spec returned no entries");
        }
        spec
    } else {
        let rpc_url = args.rpc_url.clone().ok_or(CliError::MissingNetwork)?;
        let passphrase = args
            .network_passphrase
            .clone()
            .ok_or(CliError::MissingNetwork)?;
        let wasm_bytes = fetch_wasm(&contract_id, &rpc_url, &passphrase).await?;
        let spec = Spec::new(&wasm_bytes)?.spec;
        if spec.is_empty() {
            eprintln!("Warning: contract spec returned no entries");
        }
        spec
    };

    let mut generator = McpServerGenerator::new(false);
    generator.generate(&args.output_dir, &args.name, &spec, &contract_id)?;
    println!(
        "MCP Server created at: {}",
        args.output_dir.display()
    );
    Ok(())
}

async fn fetch_wasm(
    contract_id: &str,
    rpc_url: &str,
    passphrase: &str,
) -> Result<Vec<u8>, CliError> {
    let client = Client::new(rpc_url)?;
    client.verify_network_passphrase(Some(passphrase)).await?;
    let contract_id_bytes = contract_id_from_str(contract_id)?;
    let data_entry = client.get_contract_data(&contract_id_bytes).await?;
    if let ScVal::ContractInstance(contract) = &data_entry.val {
        match &contract.executable {
            ContractExecutable::Wasm(hash) => Ok(get_remote_wasm_from_hash(&client, hash).await?),
            ContractExecutable::StellarAsset => {
                eprintln!("Warning: contract executable is StellarAsset");
                Err(CliError::UnexpectedContractData)
            }
        }
    } else {
        eprintln!("Warning: unexpected contract data entry type");
        Err(CliError::UnexpectedContractData)
    }
}

async fn get_remote_wasm_from_hash(
    client: &Client,
    hash: &Hash,
) -> Result<Vec<u8>, soroban_rpc::Error> {
    let code_key =
        LedgerKey::ContractCode(stellar_xdr::curr::LedgerKeyContractCode { hash: hash.clone() });
    let res = client.get_ledger_entries(&[code_key]).await?;
    let entries = res.entries.unwrap_or_default();
    if entries.is_empty() {
        eprintln!("Warning: empty response fetching contract code");
        return Err(soroban_rpc::Error::NotFound(
            "Contract Code".into(),
            hex::encode(hash),
        ));
    }
    match LedgerEntryData::from_xdr_base64(&entries[0].xdr, Limits::none())? {
        LedgerEntryData::ContractCode(stellar_xdr::curr::ContractCodeEntry { code, .. }) => {
            Ok(code.into())
        }
        scval => {
            eprintln!("Warning: unexpected ledger entry data type");
            Err(soroban_rpc::Error::UnexpectedContractCodeDataType(scval))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_args() {
        let args = Args::parse_from([
            "stellar-mcp-server",
            "--contract-id",
            "DEADBEEF",
            "--wasm",
            "contract.wasm",
            "--output-dir",
            "out",
            "--name",
            "demo",
        ]);
        assert_eq!(args.contract_id, "DEADBEEF");
        assert!(args.wasm.is_some());
    }
}

