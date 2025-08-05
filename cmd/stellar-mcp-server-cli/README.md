# stellar-mcp-server-cli

A Stellar CLI plugin that generates a Model Context Protocol (MCP) server project from a Soroban contract.

## Installation

From the repository root:

```bash
cargo install --path cmd/stellar-mcp-server-cli
```

After installation, verify the plugin is available:

```bash
stellar plugins --list
```

## Usage

Generate a server from a deployed contract:

```bash
stellar mcp-server --contract-id <ID> \
  --rpc-url <RPC_URL> --network-passphrase <PHRASE> \
  --output-dir ./my-server --name my-server
```

Use a local wasm or pre-fetched spec instead of fetching from the network:

```bash
stellar mcp-server --contract-id <ID> --wasm ./contract.wasm \
  --output-dir ./my-server --name my-server

stellar mcp-server --contract-id <ID> --spec ./spec.json \
  --output-dir ./my-server --name my-server
```

On success the plugin reports:

```
MCP Server created at: ./my-server
```
