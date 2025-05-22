#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { nativeToScVal, xdr, TransactionBuilder, Keypair, Address, BASE_FEE } from '@stellar/stellar-sdk';
import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';
import { 
  addressToScVal, 
  i128ToScVal, 
  u128ToScVal, 
  stringToSymbol, 
  numberToU64, 
  numberToI128, 
  boolToScVal, 
  u32ToScVal,
  submitTransaction,
  createSACClient,
  createContractClient,
  replacer
} from './helper.js';

// Load environment variables
dotenvConfig();

// Configuration
const config = {
  network: process.env.NETWORK || 'testnet',
  networkPassphrase: process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  rpcUrl: process.env.RPC_URL || 'https://soroban-testnet.stellar.org',
  contractId: process.env.CONTRACT_ID || '',
};

// Validate required environment variables
if (!config.contractId) {
  throw new Error('CONTRACT_ID environment variable is required');
}

// Create MCP server instance
const mcpServer = new McpServer({
  name: "contacts-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register contract methods as tools
// This will be populated by the generator based on contract spec
mcpServer.tool(
  "add_contact",
  "Add a new contact to the user's contact list",
  {
    owner: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    nickname: z.string().describe("Stellar symbol/enum value - Converts to: xdr.ScVal.scvSymbol(i)"),
    address: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
  },
  async (params) => {
    try {
      // Get the contract client
      const client = await createContractClient(config.contractId, config.networkPassphrase, config.rpcUrl);

      const functionName = 'add_contact';
      // @ts-ignore - This is a workaround to allow the function to be called
      const functionToCall = client[functionName];

      // For WASM contracts, we need to convert parameters to ScVal
      const scValParams = {
          owner: addressToScVal(params.owner as string),
          nickname: stringToSymbol(params.nickname as string),
          address: addressToScVal(params.address as string)
      };

      const result = await functionToCall(scValParams);

      // Get the XDR before simulation
      const txXdr = result.toXDR();

      // Default to write operation
      let isReadCall = false;

      // Run simulation and determine if it's a read call
      try {
        await result.simulate();
        isReadCall = result.isReadCall;
      } catch (e) {
        // Ignore simulation errors as they might be expected for write operations
      }

      // Return different responses for read and write operations
      if (isReadCall) {
        return {
          content: [
            { type: "text", text: result.result ? JSON.stringify(result.result, replacer, 2) : "No result returned" }
          ]
        };
      } else {
        return {
          content: [
            { type: "text", text: "Unsigned Stellar Transaction XDR generated successfully" },
            { type: "text", text: `<UnsignedXDR>${txXdr}</UnsignedXDR>` },
            { type: "text", text: "Next steps:" },
            { type: "text", text: "1. Sign the Stellar transaction XDR\n2. Submit the signed transaction XDR to the Stellar network\n3. Remember to use the smart contract ID when submitting the transaction" },
            { type: "text", text: `<SmartContractID>${config.contractId}</SmartContractID>` }
          ]
        };
      }
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing function 'add_contact': ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "get_contact",
  "Get a specific contact by nickname",
  {
    owner: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    nickname: z.string().describe("Stellar symbol/enum value - Converts to: xdr.ScVal.scvSymbol(i)"),
  },
  async (params) => {
    try {
      // Get the contract client
      const client = await createContractClient(config.contractId, config.networkPassphrase, config.rpcUrl);

      const functionName = 'get_contact';
      // @ts-ignore - This is a workaround to allow the function to be called
      const functionToCall = client[functionName];

      // For WASM contracts, we need to convert parameters to ScVal
      const scValParams = {
          owner: addressToScVal(params.owner as string),
          nickname: stringToSymbol(params.nickname as string)
      };

      const result = await functionToCall(scValParams);

      // Get the XDR before simulation
      const txXdr = result.toXDR();

      // Default to write operation
      let isReadCall = false;

      // Run simulation and determine if it's a read call
      try {
        await result.simulate();
        isReadCall = result.isReadCall;
      } catch (e) {
        // Ignore simulation errors as they might be expected for write operations
      }

      // Return different responses for read and write operations
      if (isReadCall) {
        return {
          content: [
            { type: "text", text: result.result ? JSON.stringify(result.result, replacer, 2) : "No result returned" }
          ]
        };
      } else {
        return {
          content: [
            { type: "text", text: "Unsigned Stellar Transaction XDR generated successfully" },
            { type: "text", text: `<UnsignedXDR>${txXdr}</UnsignedXDR>` },
            { type: "text", text: "Next steps:" },
            { type: "text", text: "1. Sign the Stellar transaction XDR\n2. Submit the signed transaction XDR to the Stellar network\n3. Remember to use the smart contract ID when submitting the transaction" },
            { type: "text", text: `<SmartContractID>${config.contractId}</SmartContractID>` }
          ]
        };
      }
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing function 'get_contact': ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "edit_contact",
  "Edit an existing contact's address",
  {
    owner: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    nickname: z.string().describe("Stellar symbol/enum value - Converts to: xdr.ScVal.scvSymbol(i)"),
    new_address: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
  },
  async (params) => {
    try {
      // Get the contract client
      const client = await createContractClient(config.contractId, config.networkPassphrase, config.rpcUrl);

      const functionName = 'edit_contact';
      // @ts-ignore - This is a workaround to allow the function to be called
      const functionToCall = client[functionName];

      // For WASM contracts, we need to convert parameters to ScVal
      const scValParams = {
          owner: addressToScVal(params.owner as string),
          nickname: stringToSymbol(params.nickname as string),
          new_address: addressToScVal(params.new_address as string)
      };

      const result = await functionToCall(scValParams);

      // Get the XDR before simulation
      const txXdr = result.toXDR();

      // Default to write operation
      let isReadCall = false;

      // Run simulation and determine if it's a read call
      try {
        await result.simulate();
        isReadCall = result.isReadCall;
      } catch (e) {
        // Ignore simulation errors as they might be expected for write operations
      }

      // Return different responses for read and write operations
      if (isReadCall) {
        return {
          content: [
            { type: "text", text: result.result ? JSON.stringify(result.result, replacer, 2) : "No result returned" }
          ]
        };
      } else {
        return {
          content: [
            { type: "text", text: "Unsigned Stellar Transaction XDR generated successfully" },
            { type: "text", text: `<UnsignedXDR>${txXdr}</UnsignedXDR>` },
            { type: "text", text: "Next steps:" },
            { type: "text", text: "1. Sign the Stellar transaction XDR\n2. Submit the signed transaction XDR to the Stellar network\n3. Remember to use the smart contract ID when submitting the transaction" },
            { type: "text", text: `<SmartContractID>${config.contractId}</SmartContractID>` }
          ]
        };
      }
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing function 'edit_contact': ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "delete_contact",
  "Delete a contact",
  {
    owner: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    nickname: z.string().describe("Stellar symbol/enum value - Converts to: xdr.ScVal.scvSymbol(i)"),
  },
  async (params) => {
    try {
      // Get the contract client
      const client = await createContractClient(config.contractId, config.networkPassphrase, config.rpcUrl);

      const functionName = 'delete_contact';
      // @ts-ignore - This is a workaround to allow the function to be called
      const functionToCall = client[functionName];

      // For WASM contracts, we need to convert parameters to ScVal
      const scValParams = {
          owner: addressToScVal(params.owner as string),
          nickname: stringToSymbol(params.nickname as string)
      };

      const result = await functionToCall(scValParams);

      // Get the XDR before simulation
      const txXdr = result.toXDR();

      // Default to write operation
      let isReadCall = false;

      // Run simulation and determine if it's a read call
      try {
        await result.simulate();
        isReadCall = result.isReadCall;
      } catch (e) {
        // Ignore simulation errors as they might be expected for write operations
      }

      // Return different responses for read and write operations
      if (isReadCall) {
        return {
          content: [
            { type: "text", text: result.result ? JSON.stringify(result.result, replacer, 2) : "No result returned" }
          ]
        };
      } else {
        return {
          content: [
            { type: "text", text: "Unsigned Stellar Transaction XDR generated successfully" },
            { type: "text", text: `<UnsignedXDR>${txXdr}</UnsignedXDR>` },
            { type: "text", text: "Next steps:" },
            { type: "text", text: "1. Sign the Stellar transaction XDR\n2. Submit the signed transaction XDR to the Stellar network\n3. Remember to use the smart contract ID when submitting the transaction" },
            { type: "text", text: `<SmartContractID>${config.contractId}</SmartContractID>` }
          ]
        };
      }
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing function 'delete_contact': ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "list_contacts",
  "Get all contacts for an owner",
  {
    owner: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
  },
  async (params) => {
    try {
      // Get the contract client
      const client = await createContractClient(config.contractId, config.networkPassphrase, config.rpcUrl);

      const functionName = 'list_contacts';
      // @ts-ignore - This is a workaround to allow the function to be called
      const functionToCall = client[functionName];

      // For WASM contracts, we need to convert parameters to ScVal
      const scValParams = {
          owner: addressToScVal(params.owner as string)
      };

      const result = await functionToCall(scValParams);

      // Get the XDR before simulation
      const txXdr = result.toXDR();

      // Default to write operation
      let isReadCall = false;

      // Run simulation and determine if it's a read call
      try {
        await result.simulate();
        isReadCall = result.isReadCall;
      } catch (e) {
        // Ignore simulation errors as they might be expected for write operations
      }

      // Return different responses for read and write operations
      if (isReadCall) {
        return {
          content: [
            { type: "text", text: result.result ? JSON.stringify(result.result, replacer, 2) : "No result returned" }
          ]
        };
      } else {
        return {
          content: [
            { type: "text", text: "Unsigned Stellar Transaction XDR generated successfully" },
            { type: "text", text: `<UnsignedXDR>${txXdr}</UnsignedXDR>` },
            { type: "text", text: "Next steps:" },
            { type: "text", text: "1. Sign the Stellar transaction XDR\n2. Submit the signed transaction XDR to the Stellar network\n3. Remember to use the smart contract ID when submitting the transaction" },
            { type: "text", text: `<SmartContractID>${config.contractId}</SmartContractID>` }
          ]
        };
      }
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing function 'list_contacts': ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "transfer_to_contact",
  "Transfer tokens to a contact using their nickname",
  {
    owner: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    nickname: z.string().describe("Stellar symbol/enum value - Converts to: xdr.ScVal.scvSymbol(i)"),
    token_id: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    amount: z.string().describe("Signed 128-bit integer as string (-170,141,183,460,469,231,731,687,303,715,884,105,728 to 170,141,183,460,469,231,731,687,303,715,884,105,727) - Converts to: i128ToScVal(i)"),
  },
  async (params) => {
    try {
      // Get the contract client
      const client = await createContractClient(config.contractId, config.networkPassphrase, config.rpcUrl);

      const functionName = 'transfer_to_contact';
      // @ts-ignore - This is a workaround to allow the function to be called
      const functionToCall = client[functionName];

      // For WASM contracts, we need to convert parameters to ScVal
      const scValParams = {
          owner: addressToScVal(params.owner as string),
          nickname: stringToSymbol(params.nickname as string),
          token_id: addressToScVal(params.token_id as string),
          amount: i128ToScVal(params.amount as string)
      };

      const result = await functionToCall(scValParams);

      // Get the XDR before simulation
      const txXdr = result.toXDR();

      // Default to write operation
      let isReadCall = false;

      // Run simulation and determine if it's a read call
      try {
        await result.simulate();
        isReadCall = result.isReadCall;
      } catch (e) {
        // Ignore simulation errors as they might be expected for write operations
      }

      // Return different responses for read and write operations
      if (isReadCall) {
        return {
          content: [
            { type: "text", text: result.result ? JSON.stringify(result.result, replacer, 2) : "No result returned" }
          ]
        };
      } else {
        return {
          content: [
            { type: "text", text: "Unsigned Stellar Transaction XDR generated successfully" },
            { type: "text", text: `<UnsignedXDR>${txXdr}</UnsignedXDR>` },
            { type: "text", text: "Next steps:" },
            { type: "text", text: "1. Sign the Stellar transaction XDR\n2. Submit the signed transaction XDR to the Stellar network\n3. Remember to use the smart contract ID when submitting the transaction" },
            { type: "text", text: `<SmartContractID>${config.contractId}</SmartContractID>` }
          ]
        };
      }
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing function 'transfer_to_contact': ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);


async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("Soroban MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1); 
});