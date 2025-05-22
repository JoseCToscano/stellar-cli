# contacts-mcp

MCP Server for Stellar Smart Contract

This server implements the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) and acts as a **tool provider** for a Soroban smart contract deployed on the Stellar blockchain.

It exposes a standardized MCP interface that allows agents (such as AI models, orchestration frameworks, or automation tools) to discover and invoke the smart contract's available functions safely and consistently.

This server was auto-generated using the Soroban CLI and is optimized for plug-and-play integration into any MCP-compatible environment.

---

## 📝 Next steps

1. **Install dependencies and build the project:**
   ```bash
   cd contacts-mcp
   npm install
   npm run build
   ```

2. Add the following configuration to your MCP config file (e.g., in claude_desktop_config.json, mcp.config.json, etc.):
```json
"contacts_mcp": {
  "command": "node",
  "args": [
    "contacts-mcp/build/index.js"
  ],
  "env": {
    "NETWORK": "testnet",
    "NETWORK_PASSPHRASE": "Test SDF Network ; September 2015",
    "RPC_URL": "https://soroban-testnet.stellar.org",
    "CONTRACT_ID": "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
  }
}
```
This allows MCP runtimes to run your tool seamlessly.

🧠 What This Server Does
Implements the MCP spec to serve Soroban contract methods as tools.

Each method is described via a JSON schema (input/output), allowing agents to introspect and invoke them programmatically.

All logic is executed via Stellar's Soroban smart contract runtime.

⚠️ There are no REST endpoints exposed. Tool interaction happens via MCP-compatible interfaces.



🧪 Exposed Contract Tools
The following contract methods are exposed as MCP tools:

- **add_contact**: Add a new contact to the user's contact list
- **get_contact**: Get a specific contact by nickname
- **edit_contact**: Edit an existing contact's address
- **delete_contact**: Delete a contact
- **list_contacts**: Get all contacts for an owner
- **transfer_to_contact**: Transfer tokens to a contact using their nickname


Each tool includes parameter validation, metadata, and underlying Soroban invocation logic.



📘 About Model Context Protocol (MCP)
MCP enables agents to discover and use tools through a structured protocol — no hardcoded APIs, just standardized tool definitions and execution environments.

Learn more at modelcontextprotocol.io.

This is an auto-generated server. If you need to modify the contract interface, it's recommended to regenerate the server using the Stellar CLI rather than modifying the generated code directly. 