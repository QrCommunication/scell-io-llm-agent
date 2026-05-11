/**
 * MCP Configuration Generators for various clients
 */

import type { ScellMcpConfig, McpServerConfig, McpClientConfig } from '../types/index.js';

// Default API base URL
const DEFAULT_BASE_URL = 'https://api.scell.io/api';

/**
 * Generate the MCP server configuration
 */
function generateServerConfig(config: ScellMcpConfig): McpServerConfig {
  let baseUrl = config.baseUrl || DEFAULT_BASE_URL;

  if (config.sandbox === true) {
    baseUrl += '/sandbox';
  }

  return {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-http', baseUrl],
    env: {
      'X-Scell-API-Key': config.apiKey,
      'SCELL_API_KEY': config.apiKey,
      'SCELL_BASE_URL': baseUrl,
      ...(config.environment && { 'SCELL_ENVIRONMENT': config.environment }),
      ...(config.sandbox === true && { 'SCELL_SANDBOX': 'true' }),
    },
  };
}

/**
 * Generate configuration for Claude Desktop
 *
 * Config file location:
 * - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
 * - Windows: %APPDATA%\Claude\claude_desktop_config.json
 * - Linux: ~/.config/Claude/claude_desktop_config.json
 *
 * @param config Scell MCP configuration
 * @returns Claude Desktop configuration object
 */
export function generateClaudeDesktopConfig(config: ScellMcpConfig): McpClientConfig {
  return {
    mcpServers: {
      scell: generateServerConfig(config),
    },
  };
}

/**
 * Generate configuration for Cursor IDE
 *
 * Config file location: .cursor/mcp.json in your project root
 * Or globally: ~/.cursor/mcp.json
 *
 * @param config Scell MCP configuration
 * @returns Cursor configuration object
 */
export function generateCursorConfig(config: ScellMcpConfig): McpClientConfig {
  return {
    mcpServers: {
      scell: generateServerConfig(config),
    },
  };
}

/**
 * Generate configuration for VS Code with Copilot
 *
 * Config file location: .vscode/mcp.json in your project root
 * Or in VS Code settings.json under "mcp.servers"
 *
 * @param config Scell MCP configuration
 * @returns VS Code configuration object
 */
export function generateVSCodeConfig(config: ScellMcpConfig): McpClientConfig {
  return {
    mcpServers: {
      scell: generateServerConfig(config),
    },
  };
}

/**
 * Generate a generic MCP configuration that works with any MCP-compatible client
 *
 * @param config Scell MCP configuration
 * @returns Generic MCP configuration object
 */
export function generateGenericConfig(config: ScellMcpConfig): McpClientConfig {
  return {
    mcpServers: {
      scell: generateServerConfig(config),
    },
  };
}

/**
 * Get configuration file path for a specific client
 *
 * @param client The MCP client type
 * @param platform The operating system platform
 * @returns The expected configuration file path
 */
export function getConfigPath(
  client: 'claude' | 'cursor' | 'vscode',
  platform: 'darwin' | 'win32' | 'linux' = process.platform as 'darwin' | 'win32' | 'linux'
): string {
  const home = process.env.HOME || process.env.USERPROFILE || '~';

  switch (client) {
    case 'claude':
      switch (platform) {
        case 'darwin':
          return `${home}/Library/Application Support/Claude/claude_desktop_config.json`;
        case 'win32':
          return `${process.env.APPDATA || `${home}/AppData/Roaming`}/Claude/claude_desktop_config.json`;
        case 'linux':
          return `${home}/.config/Claude/claude_desktop_config.json`;
        default:
          return `${home}/.config/Claude/claude_desktop_config.json`;
      }

    case 'cursor':
      return '.cursor/mcp.json';

    case 'vscode':
      return '.vscode/mcp.json';

    default:
      return 'mcp.json';
  }
}

/**
 * Generate a complete configuration with helpful comments
 *
 * @param config Scell MCP configuration
 * @param client Target client
 * @returns Configuration as a formatted JSON string with instructions
 */
export function generateConfigWithInstructions(
  config: ScellMcpConfig,
  client: 'claude' | 'cursor' | 'vscode' | 'generic' = 'generic'
): string {
  const configObj = generateGenericConfig(config);
  const configPath = client !== 'generic' ? getConfigPath(client as 'claude' | 'cursor' | 'vscode') : 'mcp.json';

  const instructions = `// Scell.io MCP Configuration for ${client.charAt(0).toUpperCase() + client.slice(1)}
//
// Save this configuration to: ${configPath}
//
// Available tools (44):
//
// --- Health & Authentication ---
// - scell_health_check: Check API health status
// - scell_validate_api_key: Validate your API key
//
// --- Electronic Invoicing ---
// - scell_create_invoice: Create a new electronic invoice (invoice_number is NOT a parameter — the server generates it automatically. Supports international parties: SIRET required only for French companies (country=FR). For EU companies, provide vat_number. For non-EU, provide legal_id + legal_id_scheme. Optional sub_tenant_id (UUID) attributes the invoice to a sub-tenant of the calling tenant — anti-IDOR 403 if it does not belong to the API key's tenant. The legacy api_keys.company_id binding was removed in the 2026-05-11 refonte.)
// - scell_get_invoice: Retrieve an invoice by ID
// - scell_list_invoices: List all invoices
// - scell_download_invoice: Download invoice PDF/XML (legacy, company-scoped — requires API key bound to a specific company)
// - scell_download_tenant_invoice: Download tenant-scoped invoice PDF/XML — works with tenant API keys for sub-tenant invoices and tenant-direct invoices (replaces deprecated v1 /tenant/invoices/{id}/download). Format: facturx | pdf | xml (default: facturx). Optional sub_tenant_id query for sub-tenant scoped strict-ownership.
//
// --- Electronic Signatures ---
// - scell_create_signature: Create a signature request. Optional sub_tenant_id (UUID) in the payload attributes the request to a sub-tenant of the calling tenant — anti-IDOR 403 if it does not belong to the API key's tenant. The legacy api_keys.company_id binding was removed in the 2026-05-11 refonte.
// - scell_get_signature: Get signature request status
// - scell_list_signatures: List all signature requests (GET /api/v1/signatures, tenant-scoped via the API key). Optional filters: status, environment, sub_tenant_id (anti-IDOR — must belong to the current tenant), page, per_page (max 100). Available under sk_live_*/sk_test_* keys since API v2.3.0. NOTE: the legacy company_id filter was removed in the 2026-05-11 backend refonte (api_keys.company_id column dropped). For URL-nested sub-tenant scoping, prefer scell_subtenant_list_signatures.
// - scell_tenant_list_signatures: List signature requests for the entire tenant via URL-nested route GET /api/v1/tenant/signatures. Auth: sk_live_*/sk_test_*. Optional filters: status, environment, page, per_page (max 100). Use this when the API key is master tenant-level (no bound company) — replaces scell_list_signatures which would return 403 COMPANY_REQUIRED. Available since API v2.7.0.
// - scell_tenant_get_signature: Retrieve a single tenant-scoped signature by ID via GET /api/v1/tenant/signatures/{id}. Auth: sk_live_*/sk_test_*. Returns 404 if the signature does not belong to the caller tenant. Available since API v2.7.0.
// - scell_subtenant_list_signatures: List signature requests of a specific sub-tenant via URL-nested route GET /api/v1/tenant/sub-tenants/{subTenantId}/signatures. Auth: sk_live_*/sk_test_*. Anti-IDOR: 403 if subTenantId does not belong to the current tenant. Optional filters: status, environment, page, per_page (max 100). Available since API v2.7.0.
// - scell_subtenant_get_signature: Retrieve a single sub-tenant scoped signature by ID via GET /api/v1/tenant/sub-tenants/{subTenantId}/signatures/{id}. Auth: sk_live_*/sk_test_*. 403 if the sub-tenant is not owned by the caller, 404 if the signature is outside that sub-tenant. Available since API v2.7.0.
// - scell_download_signed: Download signed document
// - scell_cancel_signature: Cancel a pending signature
// - scell_send_reminder: Send reminder to pending signers
//
// --- Account & Validation ---
// - scell_get_balance: Get account balance
// - scell_validate_siret: Validate SIRET number
// - scell_validate_vat: Validate VAT number
// - scell_get_audit_trail: Get audit trail
//
// --- Fiscal Compliance (tenant key required) ---
// - scell_get_fiscal_compliance: Get fiscal compliance dashboard
// - scell_check_fiscal_integrity: Verify hash chain integrity
// - scell_list_fiscal_closings: List daily closings
// - scell_get_fiscal_attestation: Generate fiscal attestation
// - scell_list_fiscal_entries: List fiscal ledger entries
// - scell_get_kill_switch_status: Check kill-switch status
// - scell_list_fiscal_rules: List applicable fiscal rules
// - scell_download_measures_register: Download the ISCA measures register as PDF
// - scell_download_technical_dossier: Download the ISCA technical dossier as PDF
// - scell_download_self_attestation: Download the ISCA self-attestation as PDF
//
// --- Credit Notes (tenant key required) ---
// - scell_list_credit_notes: List credit notes
// - scell_get_credit_note: Get credit note details
// - scell_download_credit_note: Download credit note PDF
// - scell_create_credit_note: Create a credit note
// - scell_send_credit_note: Validate and send credit note
// - scell_delete_credit_note: Delete draft credit note
// - scell_get_remaining_creditable: Get remaining creditable amounts
//
// --- Billing Payments (tenant key required) ---
// - scell_pay_billing_invoice: Initiate Stripe payment for a Scell.io billing invoice. Returns client_secret for Stripe.js confirmCardPayment(). Requires invoice to be in a payable status (not draft/paid/cancelled).
//
// --- Partner Onboarding (publishable key required) ---
// - scell_onboarding_create_session: Create a new onboarding session
// - scell_onboarding_get_session: Get onboarding session status
// - scell_onboarding_superpdp_authorize: Start SuperPDP OAuth2 flow — returns authorize_url and state
// - scell_onboarding_superpdp_callback: Complete SuperPDP OAuth2 flow — returns authorization_code and tenant
//
// --- Sub-Tenant Lifecycle (master tenant Bearer / sk_* required) ---
// - scell_get_subtenant_status: Get the cached SuperPDP onboarding status for a sub-tenant. Returns { data: SubTenant, recommended_action }.
// - scell_refresh_subtenant_status: Force a fresh poll of SuperPDP for one sub-tenant (rate-limited 1/min). Returns { data: SubTenant, recommended_action } on success. **Surfaces 422 MISSING_ACCESS_TOKEN explicitly when the sub-tenant never granted SuperPDP access (or the token was revoked) — the response then includes an authorize_url. The LLM should present that URL to the user, or call scell_start_subtenant_superpdp_authorize to obtain a fresh one, before retrying the refresh.**
// - scell_start_subtenant_superpdp_authorize: **(since v2.9.0)** Start a SuperPDP OAuth2 flow for an existing sub-tenant whose access token is missing or expired. Calls POST /api/v1/tenant/sub-tenants/{id}/superpdp-authorize and returns { authorize_url, state }. The LLM should present authorize_url to the human user — once the user authorizes, Scell.io captures the token via its OAuth callback and subsequent scell_refresh_subtenant_status calls will succeed.
// - scell_resume_url: Regenerate a 7-day signed resume URL for a sub-tenant whose onboarding is not yet active. Returns { resume_url, expires_at }.
// - scell_delete_sub_tenant: **(since v2.9.0)** Delete a sub-tenant via DELETE /api/v1/tenant/sub-tenants/{id}. Accepts an optional cascade boolean query flag. Returns { message, companies_deleted } on success. **Possible 422 codes that the LLM MUST surface to the user with a clear remediation path:** (a) SUB_TENANT_HAS_COMPANIES with companies_count — the sub-tenant still owns Companies; the LLM should ask the user to confirm cascade deletion, then retry with cascade=true; (b) SUB_TENANT_HAS_FISCAL_ENTRIES — the sub-tenant has emitted invoices / credit notes / signatures on the immutable ISCA ledger, deletion is **refused with NO force flag** (compliance); the LLM should propose to mark the sub-tenant inactive via metadata (metadata.archived = true) instead of pushing for deletion.
//
// Documentation: https://docs.scell.io

`;

  return instructions + JSON.stringify(configObj, null, 2);
}

/**
 * Validate a Scell MCP configuration
 *
 * @param config Configuration to validate
 * @returns Validation result with any errors
 */
export function validateConfig(config: Partial<ScellMcpConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('API key is required');
  } else if (typeof config.apiKey !== 'string') {
    errors.push('API key must be a string');
  } else if (config.apiKey.length < 10) {
    errors.push('API key appears to be too short');
  }

  if (config.baseUrl !== undefined) {
    if (typeof config.baseUrl !== 'string') {
      errors.push('Base URL must be a string');
    } else if (!config.baseUrl.startsWith('http://') && !config.baseUrl.startsWith('https://')) {
      errors.push('Base URL must start with http:// or https://');
    }
  }

  if (config.environment !== undefined) {
    const validEnvs = ['production', 'staging', 'development'];
    if (!validEnvs.includes(config.environment)) {
      errors.push(`Environment must be one of: ${validEnvs.join(', ')}`);
    }
  }

  if (config.sandbox !== undefined && typeof config.sandbox !== 'boolean') {
    errors.push('Sandbox must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
