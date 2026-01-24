# @scell/mcp-client

MCP (Model Context Protocol) client configuration generator for [Scell.io](https://scell.io) API.

Scell.io provides electronic invoicing (Factur-X/UBL/CII) and simple electronic signatures (eIDAS EU-SES) via API.

## Installation

```bash
npm install @scell/mcp-client
```

Or use directly with npx:

```bash
npx @scell/mcp-client claude YOUR_API_KEY
```

## Quick Start

### Claude Desktop

1. Generate the configuration:

```bash
npx @scell/mcp-client claude sk_live_your_api_key_here
```

2. Save the output to your Claude Desktop config file:

| Platform | Config Path |
|----------|-------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

3. Restart Claude Desktop

### Cursor IDE

1. Generate the configuration:

```bash
npx @scell/mcp-client cursor sk_live_your_api_key_here
```

2. Save to `.cursor/mcp.json` in your project root (or `~/.cursor/mcp.json` for global config)

3. Restart Cursor

### VS Code

1. Generate the configuration:

```bash
npx @scell/mcp-client vscode sk_live_your_api_key_here
```

2. Save to `.vscode/mcp.json` in your project root

3. Restart VS Code

## CLI Usage

```bash
scell-mcp <command> <api-key> [options]

Commands:
  claude <api-key>     Generate Claude Desktop configuration
  cursor <api-key>     Generate Cursor IDE configuration
  vscode <api-key>     Generate VS Code configuration
  generic <api-key>    Generate generic MCP configuration

Options:
  --base-url <url>     Custom API base URL (default: https://api.scell.io/api)
  --env <environment>  Environment: production, staging, development
  --output <file>      Write configuration to file instead of stdout
  --help, -h           Show help message
  --version, -v        Show version number
```

### Examples

```bash
# Generate Claude Desktop config
scell-mcp claude sk_live_your_api_key_here

# Generate Cursor config with staging environment
scell-mcp cursor sk_live_your_api_key_here --env staging

# Generate config and save directly to file
scell-mcp claude sk_live_your_api_key_here --output ~/.config/Claude/claude_desktop_config.json

# Use environment variable for API key
export SCELL_API_KEY=sk_live_your_api_key_here
scell-mcp claude
```

## Available Tools

Once configured, your AI assistant will have access to these tools:

### Health & Authentication

| Tool | Description |
|------|-------------|
| `scell_health_check` | Check API health status and service availability |
| `scell_validate_api_key` | Validate your API key and check permissions |

### Electronic Invoicing

| Tool | Description |
|------|-------------|
| `scell_create_invoice` | Create a new electronic invoice (Factur-X, UBL, or CII format) |
| `scell_get_invoice` | Retrieve invoice details by ID |
| `scell_list_invoices` | List all invoices with filtering and pagination |
| `scell_download_invoice` | Download invoice as PDF or XML |

### Electronic Signatures

| Tool | Description |
|------|-------------|
| `scell_create_signature` | Create a new signature request |
| `scell_get_signature` | Get signature request status and details |
| `scell_list_signatures` | List all signature requests |
| `scell_download_signed` | Download the signed document |
| `scell_cancel_signature` | Cancel a pending signature request |
| `scell_send_reminder` | Send a reminder to pending signers |

## Example Prompts

Once the MCP server is configured, you can use natural language prompts like:

### Invoice Examples

```
"Create an invoice for Acme Corp, SIRET 12345678901234, for consulting services:
- 10 hours at 150 EUR/hour
- Due in 30 days
- Factur-X format"

"List all unpaid invoices from the last month"

"Download invoice INV-2024-001 as PDF"
```

### Signature Examples

```
"Create a signature request for the attached contract.
Send to john.doe@example.com for signature."

"Check the status of signature request sig_abc123"

"Send a reminder for all pending signature requests older than 7 days"
```

## Programmatic Usage

```typescript
import {
  generateClaudeDesktopConfig,
  generateCursorConfig,
  generateVSCodeConfig,
  validateConfig,
  type ScellMcpConfig,
  type InvoiceInput,
  type SignatureInput,
} from '@scell/mcp-client';

// Generate configuration
const config: ScellMcpConfig = {
  apiKey: 'sk_live_your_api_key_here',
  baseUrl: 'https://api.scell.io/api', // optional
  environment: 'production', // optional
};

// Validate configuration
const validation = validateConfig(config);
if (!validation.valid) {
  console.error('Invalid config:', validation.errors);
}

// Generate for different clients
const claudeConfig = generateClaudeDesktopConfig(config);
const cursorConfig = generateCursorConfig(config);
const vscodeConfig = generateVSCodeConfig(config);

console.log(JSON.stringify(claudeConfig, null, 2));
```

## Type Definitions

The package exports comprehensive TypeScript types for working with the Scell.io API:

```typescript
import type {
  // Configuration
  ScellMcpConfig,
  McpServerConfig,
  McpClientConfig,

  // Invoicing
  Company,
  InvoiceLine,
  InvoiceInput,
  Invoice,

  // Signatures
  Signer,
  SignatureInput,
  SignatureRequest,

  // Results
  ToolResult,
  PaginatedResult,

  // Webhooks
  WebhookEventType,
  WebhookPayload,
} from '@scell/mcp-client';
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SCELL_API_KEY` | Default API key (used if not provided as argument) |
| `SCELL_BASE_URL` | Default base URL for the API |

## Configuration Structure

The generated MCP configuration follows this structure:

```json
{
  "mcpServers": {
    "scell": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-http", "https://api.scell.io/api"],
      "env": {
        "X-Scell-API-Key": "your_api_key",
        "SCELL_API_KEY": "your_api_key",
        "SCELL_BASE_URL": "https://api.scell.io/api"
      }
    }
  }
}
```

## Getting an API Key

1. Sign up at [scell.io](https://scell.io)
2. Navigate to Settings > API Keys
3. Create a new API key with the required permissions
4. Copy the key (it starts with `sk_live_` or `sk_test_`)

## Support

- Documentation: [docs.scell.io](https://docs.scell.io)
- Issues: [GitHub Issues](https://github.com/QrCommunication/scell-io-llm-agent/issues)
- Email: support@scell.io

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
