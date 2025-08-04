# stellar-mcp-server-cli

[![Crates.io](https://img.shields.io/crates/v/stellar-mcp-server-cli.svg)](https://crates.io/crates/stellar-mcp-server-cli)
[![Documentation](https://docs.rs/stellar-mcp-server-cli/badge.svg)](https://docs.rs/stellar-mcp-server-cli)

A Stellar CLI plugin that generates [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers for Stellar/Soroban smart contracts.

This plugin extracts contract specifications from deployed contracts or WASM files and generates complete TypeScript MCP server projects that can be used to interact with smart contracts through AI agents and automation tools.

## Installation

Install the plugin using Cargo:

```bash
cargo install stellar-mcp-server-cli
```

After installation, verify that the Stellar CLI recognizes the plugin:

```bash
stellar plugins --list
```

You should see `mcp-server` listed as an available plugin.

## Usage

### Generate from Local WASM File

```bash
stellar mcp-server \
  --wasm path/to/contract.wasm \
  --output-dir ./my-mcp-server \
  --name my-contract-server
```

### Generate from Deployed Contract

```bash
stellar mcp-server \
  --id CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC \
  --network testnet \
  --output-dir ./my-mcp-server \
  --name my-contract-server
```

### Command Options

- `--wasm FILE`: Path to contract WASM file (use this OR `--id`)
- `--id CONTRACT_ID`: Contract ID on the specified network (use this OR `--wasm`)
- `--output-dir DIR`: Directory where the MCP server project will be generated
- `--name NAME`: Name for the generated MCP server project
- `--network NETWORK`: Network to use when fetching by contract ID (testnet, futurenet, mainnet)
- `--rpc-url URL`: Custom RPC URL (overrides network setting)
- `--overwrite`: Overwrite output directory if it already exists
- `--quiet`: Suppress non-error output

### Supported Networks

- `testnet`: Stellar testnet (default)
- `futurenet`: Stellar futurenet
- `mainnet`: Stellar mainnet
- Custom: Use `--rpc-url` to specify a custom RPC endpoint

## Generated Project Structure

The plugin generates a complete TypeScript project:

```
my-mcp-server/
├── package.json          # Node.js project configuration
├── tsconfig.json         # TypeScript configuration
├── build.ts              # Build script
├── README.md             # Generated project documentation
└── src/
    ├── index.ts          # Main MCP server entry point
    └── helper.ts         # Utility functions for contract interaction
```

## Using the Generated MCP Server

1. **Install dependencies and build:**
   ```bash
   cd my-mcp-server
   npm install
   npm run build
   ```

2. **Configure environment variables** (create `.env` file or set in MCP config):
   ```
   NETWORK=testnet
   NETWORK_PASSPHRASE=Test SDF Network ; September 2015
   RPC_URL=https://soroban-testnet.stellar.org
   CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
   ```

3. **Add to your MCP configuration** (e.g., `claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "my-contract-server": {
         "command": "node",
         "args": ["./my-mcp-server/build/index.js"],
         "env": {
           "NETWORK": "testnet",
           "NETWORK_PASSPHRASE": "Test SDF Network ; September 2015",
           "RPC_URL": "https://soroban-testnet.stellar.org",
           "CONTRACT_ID": "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
         }
       }
     }
   }
   ```

## Features

- **Contract Discovery**: Automatically extracts function signatures and types from contract specifications
- **Type Safety**: Generates Zod schemas for parameter validation
- **Network Support**: Works with all Stellar networks (testnet, futurenet, mainnet)
- **SAC Support**: Special handling for Stellar Asset Contracts
- **Read/Write Operations**: Distinguishes between read calls and transaction generation
- **Error Handling**: Comprehensive error reporting and validation

## Architecture

The generated MCP server:

- Implements the Model Context Protocol specification
- Exposes each contract function as an MCP tool
- Handles parameter validation using Zod schemas
- Manages Stellar SDK integration for contract interaction
- Provides detailed error messages and type information

## Contributing

This plugin is part of the [Stellar CLI](https://github.com/stellar/stellar-cli) ecosystem. Please report issues and contribute improvements through the main repository.

## License

Licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

## Related Projects

- [Stellar CLI](https://github.com/stellar/stellar-cli) - Main Stellar command-line tool
- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocol specification
- [Soroban](https://soroban.stellar.org/) - Stellar smart contracts platform