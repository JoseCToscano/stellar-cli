//! MCP Server generation logic
//! 
//! This module contains the core logic for generating TypeScript MCP server projects
//! from Soroban contract specifications.

use std::{collections::HashSet, fs, io, path::Path};
use stellar_xdr::curr::ScSpecEntry;
use thiserror::Error;

use crate::templates::{Templates, TemplatePlaceholders};

/// Errors that can occur during generation
#[derive(Error, Debug)]
pub enum Error {
    #[error("IO error: {0}")]
    Io(#[from] io::Error),

    #[error("Template not found: {0}")]
    TemplateNotFound(String),

    #[error("Template processing error: {0}")]
    TemplateProcessing(String),
}

/// Result type for generation operations
pub type Result<T> = std::result::Result<T, Error>;

/// Generator for MCP server TypeScript projects
pub struct McpServerGenerator {
    used_imports: HashSet<String>,
    is_sac: bool,
}

impl McpServerGenerator {
    /// Create a new generator instance
    pub fn new(is_sac: bool) -> Self {
        Self {
            used_imports: HashSet::new(),
            is_sac,
        }
    }

    /// Add an import to the tracking set
    fn add_import(&mut self, import: &str) {
        self.used_imports.insert(import.to_string());
    }

    /// Generate dynamic imports based on usage
    fn get_imports(&self) -> String {
        let mut imports = vec![
            // Base imports that are always needed
            "import { McpServer } from \"@modelcontextprotocol/sdk/server/mcp.js\";",
            "import { StdioServerTransport } from \"@modelcontextprotocol/sdk/server/stdio.js\";",
            "import { z } from 'zod';",
            "import { config as dotenvConfig } from 'dotenv';",
        ];

        // Add stellar-sdk imports based on usage
        let mut stellar_imports = vec!["Contract", "nativeToScVal", "xdr", "rpc as SorobanRpc"];
        if self.used_imports.contains("Address") { stellar_imports.push("Address"); }
        if self.used_imports.contains("BASE_FEE") { stellar_imports.push("BASE_FEE"); }
        if self.used_imports.contains("Keypair") { stellar_imports.push("Keypair"); }
        
        let stellar_import = format!(
            "import {{ {} }} from '@stellar/stellar-sdk';",
            stellar_imports.join(", ")
        );
        imports.push(&stellar_import);

        // Add helper imports based on usage
        let mut helper_imports = vec!["createContractClient", "createSACClient"];
        if self.used_imports.contains("addressToScVal") { helper_imports.push("addressToScVal"); }
        if self.used_imports.contains("i128ToScVal") { helper_imports.push("i128ToScVal"); }
        if self.used_imports.contains("u128ToScVal") { helper_imports.push("u128ToScVal"); }
        if self.used_imports.contains("stringToSymbol") { helper_imports.push("stringToSymbol"); }
        if self.used_imports.contains("numberToU64") { helper_imports.push("numberToU64"); }
        if self.used_imports.contains("numberToI128") { helper_imports.push("numberToI128"); }
        if self.used_imports.contains("boolToScVal") { helper_imports.push("boolToScVal"); }
        if self.used_imports.contains("u32ToScVal") { helper_imports.push("u32ToScVal"); }
        if self.used_imports.contains("submitTransaction") { helper_imports.push("submitTransaction"); }

        let helper_import = format!(
            "import {{ {} }} from './helper.js';",
            helper_imports.join(",\n  ")
        );
        imports.push(&helper_import);

        // Add SAC SDK import if it's a SAC contract
        if self.is_sac {
            imports.push("import { Client as SacClient } from 'sac-sdk';");
        }

        imports.join("\n")
    }

    /// Generate the complete MCP server project
    pub fn generate(
        &mut self,
        output_dir: &Path,
        name: &str,
        spec: &[ScSpecEntry],
        contract_id: &str,
        verbose: bool,
    ) -> Result<()> {
        // Create the output directory structure
        fs::create_dir_all(output_dir.join("src"))?;

        // Generate tools code from spec
        let (tools_code, tool_list) = self.generate_tools(spec)?;

        // Process and write each template file
        self.write_template_file(output_dir, "package.json", name, &tool_list, &tools_code)?;
        self.write_template_file(output_dir, "README.md", name, &tool_list, &tools_code)?;
        self.write_template_file(output_dir, "tsconfig.json", name, &tool_list, &tools_code)?;
        self.write_template_file(output_dir, "build.ts", name, &tool_list, &tools_code)?;
        
        // Write src files
        self.write_template_file(output_dir, "src/helper.ts", name, &tool_list, &tools_code)?;
        
        // Process index.ts with dynamic imports and tools
        self.write_index_ts(output_dir, name, &tools_code)?;

        if verbose {
            self.print_success_message(output_dir, name, contract_id);
        }

        Ok(())
    }

    /// Write a template file with placeholder replacement
    fn write_template_file(
        &self,
        output_dir: &Path,
        template_path: &str,
        name: &str,
        tool_list: &str,
        tools_code: &str,
    ) -> Result<()> {
        let template_content = Templates::get_string(template_path)
            .ok_or_else(|| Error::TemplateNotFound(template_path.to_string()))?;

        let processed_content = template_content
            .replace(TemplatePlaceholders::NAME, name)
            .replace(TemplatePlaceholders::SNAKE_CASE_NAME, &name.replace('-', "_"))
            .replace(TemplatePlaceholders::OUTPUT_DIR, 
                output_dir.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("generated-server")
            )
            .replace(TemplatePlaceholders::TOOL_LIST, tool_list)
            .replace(TemplatePlaceholders::TOOLS, tools_code);

        let output_path = output_dir.join(template_path);
        fs::write(output_path, processed_content)?;

        Ok(())
    }

    /// Write the index.ts file with dynamic imports
    fn write_index_ts(&mut self, output_dir: &Path, name: &str, tools_code: &str) -> Result<()> {
        let template_content = Templates::get_string("src/index.ts")
            .ok_or_else(|| Error::TemplateNotFound("src/index.ts".to_string()))?;

        // Replace the old static imports with our dynamic imports
        let old_imports = r#"import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { nativeToScVal, xdr, TransactionBuilder, Keypair, Address, BASE_FEE } from '@stellar/stellar-sdk';
import { z } from 'zod';"#;

        let processed_content = template_content
            .replace(old_imports, &self.get_imports())
            .replace(TemplatePlaceholders::NAME, name)
            .replace(TemplatePlaceholders::TOOLS, tools_code);

        let output_path = output_dir.join("src/index.ts");
        fs::write(output_path, processed_content)?;

        Ok(())
    }

    /// Generate tools code and tool list from contract spec
    fn generate_tools(&mut self, spec: &[ScSpecEntry]) -> Result<(String, String)> {
        let mut tools_code = String::new();
        let mut tool_list = String::new();

        for entry in spec {
            if let Some(tool) = self.generate_tool_from_spec(entry)? {
                tools_code.push_str(&tool);
                tools_code.push('\n');
                
                // Add to tool list for README
                if let Some(function_info) = self.extract_function_info(entry) {
                    let description = if function_info.doc.is_empty() {
                        format!("Call the {} function", function_info.name)
                    } else {
                        function_info.doc.replace('\n', " ")
                    };
                    tool_list.push_str(&format!("- **{}**: {}\n", function_info.name, description));
                }
            }
        }

        Ok((tools_code, tool_list))
    }

    /// Generate a single tool from a spec entry
    fn generate_tool_from_spec(&mut self, _entry: &ScSpecEntry) -> Result<Option<String>> {
        // This is a simplified version - in a full implementation, you'd need to
        // fully parse the ScSpecEntry and generate the appropriate TypeScript code
        // For now, we'll create a placeholder
        
        // This would need the full type conversion logic from the original code
        // Including type_to_zod, parameter handling, etc.
        
        Ok(Some(format!(
            r#"// Tool generated from spec entry
// TODO: Implement full spec entry parsing"#
        )))
    }

    /// Extract function information from spec entry
    fn extract_function_info(&self, _entry: &ScSpecEntry) -> Option<FunctionInfo> {
        // Placeholder - would need full spec parsing
        Some(FunctionInfo {
            name: "example_function".to_string(),
            doc: "Example function description".to_string(),
        })
    }

    /// Print success message with next steps
    fn print_success_message(&self, output_dir: &Path, name: &str, contract_id: &str) {
        println!("\n✨ Generated MCP server in {}", output_dir.display());
        println!("\n📝 Next steps:");
        println!("1. Install dependencies and build the project:");
        println!("   ```");
        println!("   cd {}", output_dir.display());
        println!("   npm install");
        println!("   npm run build");
        println!("   ```");
        println!("\n2. Set up your environment variables:");
        println!("\n3. Add the following configuration to your MCP config file:");
        println!("   ```json");
        println!("   \"{}\": {{", name);
        println!("     \"command\": \"node\",");
        println!("     \"args\": [");
        println!("       \"{}/build/index.js\"", output_dir.display());
        println!("     ],");
        println!("     \"env\": {{");
        println!("       \"NETWORK\": \"testnet\",");
        println!("       \"NETWORK_PASSPHRASE\": \"Test SDF Network ; September 2015\",");
        println!("       \"RPC_URL\": \"https://soroban-testnet.stellar.org\",");
        println!("       \"CONTRACT_ID\": \"{}\"", contract_id);
        println!("     }}");
        println!("   }}");
        println!("   ```");
        println!("\n📚 For more information, check the README.md file in the generated project.");
    }
}

/// Function information extracted from spec
struct FunctionInfo {
    name: String,
    doc: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_generator_creation() {
        let generator = McpServerGenerator::new(false);
        assert!(!generator.is_sac);
        assert!(generator.used_imports.is_empty());
    }

    #[test]
    fn test_import_tracking() {
        let mut generator = McpServerGenerator::new(false);
        generator.add_import("addressToScVal");
        assert!(generator.used_imports.contains("addressToScVal"));
    }

    #[test]
    fn test_imports_generation() {
        let mut generator = McpServerGenerator::new(false);
        generator.add_import("addressToScVal");
        generator.add_import("i128ToScVal");
        
        let imports = generator.get_imports();
        assert!(imports.contains("addressToScVal"));
        assert!(imports.contains("i128ToScVal"));
        assert!(imports.contains("@modelcontextprotocol/sdk"));
    }

    #[test]
    fn test_sac_imports() {
        let generator = McpServerGenerator::new(true);
        let imports = generator.get_imports();
        assert!(imports.contains("sac-sdk"));
    }
}