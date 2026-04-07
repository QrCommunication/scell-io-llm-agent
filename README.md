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
npx @scell/mcp-client claude tk_live_your_api_key_here
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
npx @scell/mcp-client cursor tk_live_your_api_key_here
```

2. Save to `.cursor/mcp.json` in your project root (or `~/.cursor/mcp.json` for global config)

3. Restart Cursor

### VS Code

1. Generate the configuration:

```bash
npx @scell/mcp-client vscode tk_live_your_api_key_here
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
  --sandbox            Use sandbox mode (appends /sandbox to base URL)
  --output <file>      Write configuration to file instead of stdout
  --help, -h           Show help message
  --version, -v        Show version number
```

### Examples

```bash
# Generate Claude Desktop config
scell-mcp claude tk_live_your_api_key_here

# Generate Cursor config with staging environment
scell-mcp cursor tk_live_your_api_key_here --env staging

# Generate config and save directly to file
scell-mcp claude tk_live_your_api_key_here --output ~/.config/Claude/claude_desktop_config.json

# Use environment variable for API key
export SCELL_API_KEY=tk_live_your_api_key_here
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

### Account & Validation

| Tool | Description |
|------|-------------|
| `scell_get_balance` | Get account balance and credit information |
| `scell_validate_siret` | Validate a French SIRET number |
| `scell_validate_vat` | Validate a European VAT number |
| `scell_get_audit_trail` | Get the audit trail for a document |

### Fiscal Compliance (tenant key required)

These tools require a tenant API key (`tk_*`) and provide access to the fiscal compliance features mandated by French law (LF 2026).

| Tool | Description |
|------|-------------|
| `scell_get_fiscal_compliance` | Get fiscal compliance dashboard (ISCA status) |
| `scell_check_fiscal_integrity` | Verify the integrity of the fiscal hash chain |
| `scell_list_fiscal_closings` | List recent fiscal daily closings |
| `scell_get_fiscal_attestation` | Generate a fiscal compliance attestation |
| `scell_list_fiscal_entries` | List fiscal ledger entries with filters |
| `scell_get_kill_switch_status` | Check the fiscal kill-switch status |
| `scell_list_fiscal_rules` | List applicable fiscal rules (VAT rates, etc.) |
| `scell_download_measures_register` | Download the ISCA measures register as PDF |
| `scell_download_technical_dossier` | Download the ISCA technical dossier as PDF |
| `scell_download_self_attestation` | Download the ISCA self-attestation as PDF |

### Credit Notes (tenant key required)

These tools require a tenant API key (`tk_*`) and manage credit notes (avoirs) linked to invoices.

| Tool | Description |
|------|-------------|
| `scell_list_credit_notes` | List credit notes with filtering |
| `scell_get_credit_note` | Get credit note details |
| `scell_download_credit_note` | Download credit note as PDF |
| `scell_create_credit_note` | Create a credit note from an invoice |
| `scell_send_credit_note` | Validate and send a draft credit note |
| `scell_delete_credit_note` | Delete a draft credit note |
| `scell_get_remaining_creditable` | Calculate remaining creditable amounts |

### Partner Onboarding (publishable key required)

These tools require a publishable key (`pk_*`) and handle partner tenant onboarding via SuperPDP's OAuth2 tunnel.

| Tool | Description |
|------|-------------|
| `scell_onboarding_create_session` | Create a new onboarding session |
| `scell_onboarding_get_session` | Get onboarding session status and result |
| `scell_onboarding_superpdp_authorize` | Start the SuperPDP OAuth2 flow — returns `authorize_url` and `state` |
| `scell_onboarding_superpdp_callback` | Complete the SuperPDP OAuth2 flow — returns `authorization_code` and tenant |

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

### International Invoicing

```
"Create an invoice for a Belgian client Entreprise Belge SPRL with VAT number BE0123456789, address 15 Avenue Louise 1050 Bruxelles Belgium, for consulting services 10h at 150€"
```

### Signature Examples

```
"Create a signature request for the attached contract.
Send to john.doe@example.com for signature."

"Check the status of signature request sig_abc123"

"Send a reminder for all pending signature requests older than 7 days"
```

### Fiscal Compliance Examples

```
"Show me the fiscal compliance status for my company"

"Check the integrity of the fiscal hash chain for January 2026"

"List the last 10 daily fiscal closings"

"Generate a fiscal attestation for year 2025"
```

### Credit Note Examples

```
"List all draft credit notes"

"Create a total credit note for invoice INV-2026-00042 because of duplicate billing"

"Send credit note AV-2026-00003"

"How much can still be credited on invoice INV-2026-00015?"
```

### Onboarding Examples

```
"Start the onboarding process for a new partner tenant"

"Get the SuperPDP authorization URL so the partner can connect their account"

"Complete the SuperPDP OAuth2 callback with state=abc123 and code=xyz456"

"Check the status of onboarding session sess_abc123"
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
  apiKey: 'tk_live_your_api_key_here',
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
4. Copy the key (it starts with `tk_live_` or `tk_test_`)
5. For fiscal and credit note tools, use a tenant API key (starts with `tk_test_` or `tk_live_`)

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
