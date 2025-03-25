#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Contract, nativeToScVal, xdr, TransactionBuilder, SorobanRpc, Keypair, Address, BASE_FEE } from '@stellar/stellar-sdk';
import { z } from 'zod';
import { addressToScVal, i128ToScVal, u128ToScVal, stringToSymbol, numberToU64, numberToI128, boolToScVal, u32ToScVal } from './helper.js';

// Configuration
const config = {
  network: process.env.NETWORK || 'testnet',
  networkPassphrase: process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  rpcUrl: process.env.RPC_URL || 'https://soroban-testnet.stellar.org',
  contractId: process.env.CONTRACT_ID || '',
};

const server = new SorobanRpc.Server(config.rpcUrl);

// Initialize Stellar connection
const contract = new Contract(config.contractId);

// Create MCP server instance
const mcpServer = new McpServer({
  name: "native-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register contract methods as tools
// This will be populated by the generator based on contract spec
mcpServer.tool(
  "allowance",
  "Returns the allowance for \`spender\` to transfer from \`from\`.\n\nThe amount returned is the amount that spender is allowed to transfer out of from's balance. When the spender transfers amounts, the allowance will be reduced by the amount transferred.\n\n# Arguments\n\n* \`from\` - The address holding the balance of tokens to be drawn from. * \`spender\` - The address spending the tokens held by \`from\`.",
  {
    from: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    spender: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['from', 'spender'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'from':
            return addressToScVal(value as string);
          case 'spender':
            return addressToScVal(value as string);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("allowance", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing allowance: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "authorized",
  "Returns true if \`id\` is authorized to use its balance.\n\n# Arguments\n\n* \`id\` - The address for which token authorization is being checked.",
  {
    id: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['id'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'id':
            return addressToScVal(value as string);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("authorized", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing authorized: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "approve",
  "Set the allowance by \`amount\` for \`spender\` to transfer/burn from \`from\`.\n\nThe amount set is the amount that spender is approved to transfer out of from's balance. The spender will be allowed to transfer amounts, and when an amount is transferred the allowance will be reduced by the amount transferred.\n\n# Arguments\n\n* \`from\` - The address holding the balance of tokens to be drawn from. * \`spender\` - The address being authorized to spend the tokens held by \`from\`. * \`amount\` - The tokens to be made available to \`spender\`. * \`expiration_ledger\` - The ledger number where this allowance expires. Cannot be less than the current ledger number unless the amount is being set to 0. An expired entry (where expiration_ledger < the current ledger number) should be treated as a 0 amount allowance.\n\n# Events\n\nEmits an event with topics \`[\"approve\", from: Address, spender: Address], data = [amount: i128, expiration_ledger: u32]\`",
  {
    from: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    spender: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    amount: z.string().describe("Signed 128-bit integer as string (-170,141,183,460,469,231,731,687,303,715,884,105,728 to 170,141,183,460,469,231,731,687,303,715,884,105,727) - Converts to: i128ToScVal(i)"),
    expiration_ledger: z.number().describe("Unsigned 32-bit integer (0 to 4,294,967,295) - Converts to: xdr.ScVal.scvU32(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['from', 'spender', 'amount', 'expiration_ledger'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'from':
            return addressToScVal(value as string);
          case 'spender':
            return addressToScVal(value as string);
          case 'amount':
            return i128ToScVal(value as string);
          case 'expiration_ledger':
            return u32ToScVal(value as number);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("approve", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing approve: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "balance",
  "Returns the balance of \`id\`.\n\n# Arguments\n\n* \`id\` - The address for which a balance is being queried. If the address has no existing balance, returns 0.",
  {
    id: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['id'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'id':
            return addressToScVal(value as string);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("balance", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing balance: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "burn",
  "Burn \`amount\` from \`from\`.\n\nReduces from's balance by the amount, without transferring the balance to another holder's balance.\n\n# Arguments\n\n* \`from\` - The address holding the balance of tokens which will be burned from. * \`amount\` - The amount of tokens to be burned.\n\n# Events\n\nEmits an event with topics \`[\"burn\", from: Address], data = amount: i128\`",
  {
    from: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    amount: z.string().describe("Signed 128-bit integer as string (-170,141,183,460,469,231,731,687,303,715,884,105,728 to 170,141,183,460,469,231,731,687,303,715,884,105,727) - Converts to: i128ToScVal(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['from', 'amount'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'from':
            return addressToScVal(value as string);
          case 'amount':
            return i128ToScVal(value as string);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("burn", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing burn: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "burn_from",
  "Burn \`amount\` from \`from\`, consuming the allowance of \`spender\`.\n\nReduces from's balance by the amount, without transferring the balance to another holder's balance.\n\nThe spender will be allowed to burn the amount from from's balance, if the amount is less than or equal to the allowance that the spender has on the from's balance. The spender's allowance on from's balance will be reduced by the amount.\n\n# Arguments\n\n* \`spender\` - The address authorizing the burn, and having its allowance consumed during the burn. * \`from\` - The address holding the balance of tokens which will be burned from. * \`amount\` - The amount of tokens to be burned.\n\n# Events\n\nEmits an event with topics \`[\"burn\", from: Address], data = amount: i128\`",
  {
    spender: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    from: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    amount: z.string().describe("Signed 128-bit integer as string (-170,141,183,460,469,231,731,687,303,715,884,105,728 to 170,141,183,460,469,231,731,687,303,715,884,105,727) - Converts to: i128ToScVal(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['spender', 'from', 'amount'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'spender':
            return addressToScVal(value as string);
          case 'from':
            return addressToScVal(value as string);
          case 'amount':
            return i128ToScVal(value as string);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("burn_from", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing burn_from: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "clawback",
  "Clawback \`amount\` from \`from\` account. \`amount\` is burned in the clawback process.\n\n# Arguments\n\n* \`from\` - The address holding the balance from which the clawback will take tokens. * \`amount\` - The amount of tokens to be clawed back.\n\n# Events\n\nEmits an event with topics \`[\"clawback\", admin: Address, to: Address], data = amount: i128\`",
  {
    from: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    amount: z.string().describe("Signed 128-bit integer as string (-170,141,183,460,469,231,731,687,303,715,884,105,728 to 170,141,183,460,469,231,731,687,303,715,884,105,727) - Converts to: i128ToScVal(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['from', 'amount'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'from':
            return addressToScVal(value as string);
          case 'amount':
            return i128ToScVal(value as string);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("clawback", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing clawback: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "decimals",
  "Returns the number of decimals used to represent amounts of this token.\n\n# Panics\n\nIf the contract has not yet been initialized.",
  {
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey } = params;
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("decimals");
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing decimals: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "mint",
  "Mints \`amount\` to \`to\`.\n\n# Arguments\n\n* \`to\` - The address which will receive the minted tokens. * \`amount\` - The amount of tokens to be minted.\n\n# Events\n\nEmits an event with topics \`[\"mint\", admin: Address, to: Address], data = amount: i128\`",
  {
    to: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    amount: z.string().describe("Signed 128-bit integer as string (-170,141,183,460,469,231,731,687,303,715,884,105,728 to 170,141,183,460,469,231,731,687,303,715,884,105,727) - Converts to: i128ToScVal(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['to', 'amount'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'to':
            return addressToScVal(value as string);
          case 'amount':
            return i128ToScVal(value as string);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("mint", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing mint: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "name",
  "Returns the name for this token.\n\n# Panics\n\nIf the contract has not yet been initialized.",
  {
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey } = params;
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("name");
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing name: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "set_admin",
  "Sets the administrator to the specified address \`new_admin\`.\n\n# Arguments\n\n* \`new_admin\` - The address which will henceforth be the administrator of this token contract.\n\n# Events\n\nEmits an event with topics \`[\"set_admin\", admin: Address], data = [new_admin: Address]\`",
  {
    new_admin: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['new_admin'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'new_admin':
            return addressToScVal(value as string);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("set_admin", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing set_admin: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "admin",
  "Returns the admin of the contract.\n\n# Panics\n\nIf the admin is not set.",
  {
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey } = params;
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("admin");
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing admin: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "set_authorized",
  "Sets whether the account is authorized to use its balance. If \`authorized\` is true, \`id\` should be able to use its balance.\n\n# Arguments\n\n* \`id\` - The address being (de-)authorized. * \`authorize\` - Whether or not \`id\` can use its balance.\n\n# Events\n\nEmits an event with topics \`[\"set_authorized\", id: Address], data = [authorize: bool]\`",
  {
    id: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    authorize: z.boolean().describe("Boolean value (true/false) - Converts to: xdr.ScVal.scvBool(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['id', 'authorize'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'id':
            return addressToScVal(value as string);
          case 'authorize':
            return boolToScVal(value as boolean);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("set_authorized", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing set_authorized: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "symbol",
  "Returns the symbol for this token.\n\n# Panics\n\nIf the contract has not yet been initialized.",
  {
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey } = params;
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("symbol");
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing symbol: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "transfer",
  "Transfer \`amount\` from \`from\` to \`to\`.\n\n# Arguments\n\n* \`from\` - The address holding the balance of tokens which will be withdrawn from. * \`to\` - The address which will receive the transferred tokens. * \`amount\` - The amount of tokens to be transferred.\n\n# Events\n\nEmits an event with topics \`[\"transfer\", from: Address, to: Address], data = amount: i128\`",
  {
    from: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    to: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    amount: z.string().describe("Signed 128-bit integer as string (-170,141,183,460,469,231,731,687,303,715,884,105,728 to 170,141,183,460,469,231,731,687,303,715,884,105,727) - Converts to: i128ToScVal(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['from', 'to', 'amount'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'from':
            return addressToScVal(value as string);
          case 'to':
            return addressToScVal(value as string);
          case 'amount':
            return i128ToScVal(value as string);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("transfer", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing transfer: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);
mcpServer.tool(
  "transfer_from",
  "Transfer \`amount\` from \`from\` to \`to\`, consuming the allowance that \`spender\` has on \`from\`'s balance. Authorized by spender (\`spender.require_auth()\`).\n\nThe spender will be allowed to transfer the amount from from's balance if the amount is less than or equal to the allowance that the spender has on the from's balance. The spender's allowance on from's balance will be reduced by the amount.\n\n# Arguments\n\n* \`spender\` - The address authorizing the transfer, and having its allowance consumed during the transfer. * \`from\` - The address holding the balance of tokens which will be withdrawn from. * \`to\` - The address which will receive the transferred tokens. * \`amount\` - The amount of tokens to be transferred.\n\n# Events\n\nEmits an event with topics \`[\"transfer\", from: Address, to: Address], data = amount: i128\`",
  {
    spender: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    from: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    to: z.string().describe("Stellar address in strkey format (G... for public keys, C... for contract) - Converts to: addressToScVal(i)"),
    amount: z.string().describe("Signed 128-bit integer as string (-170,141,183,460,469,231,731,687,303,715,884,105,728 to 170,141,183,460,469,231,731,687,303,715,884,105,727) - Converts to: i128ToScVal(i)"),
    simulate: z.boolean().optional().describe("If true, simulate the transaction instead of submitting it"),
    signAndSubmit: z.boolean().optional().describe("If true, sign and submit the transaction"),
    secretKey: z.string().optional().describe("Secret key in strkey format (S... for secret keys)")
  },
  async (params) => {
    try {
      const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
      // Ensure parameters are in the correct order as defined in the contract
      const orderedParams = ['spender', 'from', 'to', 'amount'];
      const scValParams = orderedParams.map(paramName => {
        const value = functionParams[paramName as keyof typeof functionParams];
        if (value === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }
        // Use appropriate conversion based on parameter type
        switch(paramName) {
          case 'spender':
            return addressToScVal(value as string);
          case 'from':
            return addressToScVal(value as string);
          case 'to':
            return addressToScVal(value as string);
          case 'amount':
            return i128ToScVal(value as string);
          default:
            return nativeToScVal(value);
        }
      });
      
      // Call the contract to get the assembled transaction
      const tx = await contract.call("transfer_from", ...scValParams);
      
      // Get the XDR of the transaction and convert to base64 string
      const xdr = tx.toXDR('base64');
      
      // Create a new TransactionBuilder from the XDR
      const transaction = TransactionBuilder.fromXDR(xdr, config.networkPassphrase);
      
      if (simulate) {
        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Simulation Results:" },
            { type: "text", text: JSON.stringify(simulateResult, null, 2) }
          ]
        };
      }

      if (signAndSubmit) {
        if (!secretKey) {
          throw new Error("secretKey is required when signAndSubmit is true");
        }
        
        // Sign the transaction with the provided secret key
        transaction.sign(Keypair.fromSecret(secretKey));
        
        // Submit the transaction
        const submittedTx = await server.sendTransaction(transaction);
        
        return {
          content: [
            { type: "text", text: "Transaction submitted!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(submittedTx, null, 2) }
          ]
        };
      }

      // If neither simulate nor signAndSubmit, return the XDR
      return {
        content: [
          { type: "text", text: "Transaction XDR:" },
          { type: "text", text: xdr }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ 
          type: "text", 
          text: `Error executing transfer_from: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
        }]
      };
    }
  }
);

const MAX_RETRIES = 10;
const POLLING_INTERVAL = 2000; // 2 seconds

async function waitForTransaction(hash: string): Promise<any> {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      const tx = await server.getTransaction(hash);
      
      if (tx.status === "SUCCESS") {
        return tx;
      } else if (tx.status === "FAILED") {
        throw new Error(`Transaction failed: ${tx.resultXdr}`);
      }
      
      // If not SUCCESS or FAILED, wait and retry
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      retries++;
      
    } catch (error: any) {
      if (error.message.includes("404") || error.message.includes("NOT_FOUND")) {
        // Transaction not found yet, continue polling
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        retries++;
        continue;
      }
      throw error; // Re-throw other errors
    }
  }
  
  throw new Error(`Transaction ${hash} timed out after ${MAX_RETRIES} retries`);
}

async function main() {
  try {
    console.log("Hello, world!");
    const params = {
      to: `GDLS6OIZ3TOC7NXHB3OZKHXLUEZV4EUANOMOOMOHUZAZHLLGNN43IALX`,
      from: `GATTY34753DCFYHRALQQDIZZSLHDVVFZLTQHYBTVVVYNEBGW6OKWGZ5L`,
      amount: `10000000`,
      secretKey: `SCQ34W7AZXNB77FBDLV43IMTZRNMVSRNMGGFXAXPH4JPNDESJSSIH3QN`,
      signAndSubmit: true,
      simulate: false,
    };

    const { simulate, signAndSubmit, secretKey, ...functionParams } = params;
    // Ensure parameters are in the correct order as defined in the contract
    const orderedParams = ['from', 'to', 'amount'];
    const scValParams = orderedParams.map(paramName => {
      const value = functionParams[paramName as keyof typeof functionParams];
      if (value === undefined) {
        throw new Error(`Missing required parameter: ${paramName}`);
      }
      // Use appropriate conversion based on parameter type
      switch(paramName) {
        case 'from':
          return addressToScVal(value as string);
        case 'to':
          return addressToScVal(value as string);
        case 'amount':
          return i128ToScVal(value as string);
        default:
          return nativeToScVal(value);
      }
    });
    console.log(scValParams);
    // Create a new TransactionBuilder from the XDR
    const keypair = Keypair.fromSecret(secretKey);
    const account = await server.getAccount(keypair.publicKey());
    console.log(account);
    const transaction = new TransactionBuilder(account,{
      networkPassphrase: config.networkPassphrase,
      fee: BASE_FEE,
    })
    .addOperation(contract.call("transfer", ...scValParams))
    .setTimeout(10000)
    .build();

    const prepareTx = await server.prepareTransaction(transaction);

    const preparedxdr =  prepareTx.toXDR();

    
    if (simulate) {
      // Simulate the transaction using the server
      const simulateResult = await server.simulateTransaction(transaction);
      
      return {
        content: [
          { type: "text", text: "Simulation Results:" },
          { type: "text", text: JSON.stringify(simulateResult, null, 2) }
        ]
      };
    }

    if (signAndSubmit) {
      if (!secretKey) {
        throw new Error("secretKey is required when signAndSubmit is true");
      }
      
      // Sign and submit transaction
      const newTransaction = TransactionBuilder.fromXDR(preparedxdr, config.networkPassphrase);
      newTransaction.sign(keypair);
      
      try {
        const submittedTx = await server.sendTransaction(newTransaction);
        console.log('Transaction submitted:', submittedTx.hash);
        
        // Wait for transaction completion
        const finalTx = await waitForTransaction(submittedTx.hash);
        
        return {
          content: [
            { type: "text", text: "Transaction completed successfully!" },
            { type: "text", text: `Transaction hash: ${submittedTx.hash}` },
            { type: "text", text: "Full response:" },
            { type: "text", text: JSON.stringify(finalTx, null, 2) }
          ]
        };
        
      } catch (error: any) {
        return {
          content: [
            { type: "text", text: "Transaction failed!" },
            { type: "text", text: error.message },
            { type: "text", text: "Please check the transaction hash on the network explorer." }
          ]
        };
      }
    }

    // If neither simulate nor signAndSubmit, return the XDR
    return {
      content: [
        { type: "text", text: "Transaction XDR:" },
        { type: "text", text: xdr }
      ]
    };
  } catch (error: any) {
    return {
      content: [{ 
        type: "text", 
        text: `Error executing transfer: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}` 
      }]
    };
  }

  // const transport = new StdioServerTransport();
  // await mcpServer.connect(transport);
  // console.error("Soroban MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1); 
});