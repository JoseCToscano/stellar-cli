//! Template files for MCP server generation
//! 
//! This module embeds all the template files needed to generate a complete
//! TypeScript MCP server project.

use rust_embed::RustEmbed;

/// Embedded template assets for MCP server generation
#[derive(RustEmbed)]
#[folder = "src/templates/"]
pub struct Templates;

impl Templates {
    /// Get template file content as a string
    pub fn get_string(path: &str) -> Option<String> {
        Self::get(path).and_then(|file| {
            String::from_utf8(file.data.into_owned()).ok()
        })
    }

    /// Get all template files
    pub fn list_files() -> impl Iterator<Item = std::borrow::Cow<'static, str>> {
        Self::iter()
    }
}

/// Template placeholders that need to be replaced during generation
pub struct TemplatePlaceholders;

impl TemplatePlaceholders {
    pub const NAME: &'static str = "INSERT_NAME_HERE";
    pub const SNAKE_CASE_NAME: &'static str = "INSERT_SNAKE_CASE_NAME_HERE";
    pub const OUTPUT_DIR: &'static str = "INSERT_OUTPUT_DIR_HERE";
    pub const TOOL_LIST: &'static str = "INSERT_TOOL_LIST_HERE";
    pub const TOOLS: &'static str = "INSERT_TOOLS_HERE";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_templates_exist() {
        // Verify that key template files are embedded
        assert!(Templates::get("package.json").is_some());
        assert!(Templates::get("src/index.ts").is_some());
        assert!(Templates::get("src/helper.ts").is_some());
        assert!(Templates::get("README.md").is_some());
        assert!(Templates::get("tsconfig.json").is_some());
        assert!(Templates::get("build.ts").is_some());
    }

    #[test]
    fn test_template_content() {
        let package_json = Templates::get_string("package.json").unwrap();
        assert!(package_json.contains(TemplatePlaceholders::NAME));
        
        let readme = Templates::get_string("README.md").unwrap();
        assert!(readme.contains(TemplatePlaceholders::TOOL_LIST));
    }
}