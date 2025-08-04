//! Stellar MCP Server CLI Plugin
//! 
//! Generate MCP (Model Context Protocol) servers for Stellar/Soroban smart contracts.
//! This plugin extracts contract specifications and creates TypeScript MCP server projects
//! that can be used to interact with smart contracts through AI agents and automation tools.

use std::path::{Path, PathBuf};
use thiserror::Error;

pub mod generator;
pub mod templates;
pub mod contract_fetcher;

pub use generator::McpServerGenerator;

/// Result type for all operations in this crate
pub type Result<T> = std::result::Result<T, Error>;

/// Errors that can occur during MCP server generation
#[derive(Error, Debug)]
pub enum Error {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Output directory is a file: {0:?}")]
    OutputDirIsFile(PathBuf),

    #[error("Output directory already exists and --overwrite not specified: {0:?}")]
    OutputDirExists(PathBuf),

    #[error("Invalid network name: {0}. Supported networks: testnet, futurenet, mainnet")]
    InvalidNetwork(String),

    #[error("Contract fetching error: {0}")]
    ContractFetch(#[from] contract_fetcher::Error),

    #[error("Generation error: {0}")]
    Generation(#[from] generator::Error),

    #[error("JSON parsing error: {0}")]
    Json(#[from] serde_json::Error),
}

/// Contract source specification
#[derive(Debug, Clone)]
pub enum ContractSource {
    /// Local WASM file
    Wasm(PathBuf),
    /// Contract ID on a network
    ContractId {
        id: String,
        network: NetworkConfig,
    },
}

/// Network configuration for fetching contracts
#[derive(Debug, Clone)]
pub struct NetworkConfig {
    pub name: String,
    pub rpc_url: String,
    pub network_passphrase: String,
}

impl NetworkConfig {
    /// Create network config from name or custom URL
    pub fn from_name_or_url(network: &str, custom_rpc_url: Option<String>) -> Result<Self> {
        if let Some(url) = custom_rpc_url {
            // Custom RPC URL provided
            Ok(Self {
                name: "custom".to_string(),
                rpc_url: url,
                network_passphrase: "Unknown Network ; September 2015".to_string(),
            })
        } else {
            // Use predefined network
            match network.to_lowercase().as_str() {
                "testnet" => Ok(Self {
                    name: "testnet".to_string(),
                    rpc_url: "https://soroban-testnet.stellar.org".to_string(),
                    network_passphrase: "Test SDF Network ; September 2015".to_string(),
                }),
                "futurenet" => Ok(Self {
                    name: "futurenet".to_string(),
                    rpc_url: "https://rpc-futurenet.stellar.org".to_string(),
                    network_passphrase: "Test SDF Future Network ; October 2022".to_string(), 
                }),
                "mainnet" => Ok(Self {
                    name: "mainnet".to_string(),
                    rpc_url: "https://horizon.stellar.org".to_string(),
                    network_passphrase: "Public Global Stellar Network ; September 2015".to_string(),
                }),
                _ => Err(Error::InvalidNetwork(network.to_string())),
            }
        }
    }
}

/// Main entry point for generating MCP server projects
pub async fn generate_mcp_server(
    contract_source: &ContractSource,
    output_dir: &Path,
    name: &str,
    overwrite: bool,
    verbose: bool,
) -> Result<()> {
    if verbose {
        println!("🔍 Fetching contract specification...");
    }

    // Fetch contract specification
    let (spec, contract_id, is_sac) = contract_fetcher::fetch_contract_spec(contract_source).await?;

    if verbose {
        println!("✅ Contract specification loaded ({} entries)", spec.len());
        println!("🏗️  Generating MCP server project...");
    }

    // Create output directory
    if output_dir.exists() && overwrite {
        std::fs::remove_dir_all(output_dir)?;
    }
    std::fs::create_dir_all(output_dir)?;

    // Generate MCP server code
    let mut generator = McpServerGenerator::new(is_sac);
    generator.generate(output_dir, name, &spec, &contract_id, verbose)?;

    if verbose {
        println!("✨ Generated MCP server project in: {}", output_dir.display());
    }

    Ok(())
}