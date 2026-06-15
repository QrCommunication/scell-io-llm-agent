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
// Available tools (148):
//
// The MCP server (Laravel, https://api.scell.io/api) implements 148 tools, all
// prefixed scell_. The canonical names below are the single source of truth
// (backend config/mcp.php). Names without the scell_ prefix still work as
// backward-compatible aliases (sunset 2026-11-01) but are NOT listed here.
//
// --- Invoices (12) ---
// - scell_create_invoice
// - scell_get_invoice
// - scell_list_invoices
// - scell_download_invoice
// - scell_mark_invoice_paid
// - scell_submit_invoice
// - scell_convert_invoice
// - scell_send_invoice_by_email
// - scell_list_deposit_groups
// - scell_get_deposit_group
// - scell_suggest_invoice_mentions
// - scell_preview_invoice_mentions
//
// --- Credit Notes (7) ---
// - scell_list_credit_notes
// - scell_get_credit_note
// - scell_download_credit_note
// - scell_create_credit_note
// - scell_send_credit_note
// - scell_delete_credit_note
// - scell_get_remaining_creditable
//
// --- Quotes (15) ---
// - scell_create_quote
// - scell_get_quote
// - scell_list_quotes
// - scell_update_quote
// - scell_delete_quote
// - scell_send_quote
// - scell_cancel_quote
// - scell_duplicate_quote
// - scell_convert_quote_to_deposit
// - scell_convert_quote_to_balance
// - scell_get_quote_pdf
// - scell_get_quote_audit_log
// - scell_regenerate_quote_public_link
// - scell_revoke_quote_public_link
// - scell_preview_quote
//
// --- Payment Schedule (7) ---
// - scell_get_quote_payment_schedule
// - scell_set_quote_payment_schedule
// - scell_patch_quote_payment_schedule
// - scell_delete_quote_payment_schedule
// - scell_get_quote_payment_summary
// - scell_convert_schedule_line_to_invoice
// - scell_list_payment_schedule_presets
//
// --- Recurring Invoices (10) ---
// - scell_create_recurring_invoice
// - scell_get_recurring_invoice
// - scell_list_recurring_invoices
// - scell_update_recurring_invoice
// - scell_delete_recurring_invoice
// - scell_list_recurring_invoice_occurrences
// - scell_pause_recurring_invoice
// - scell_activate_recurring_invoice
// - scell_cancel_recurring_invoice
// - scell_run_recurring_invoice_now
//
// --- Buyers (6) ---
// - scell_create_buyer
// - scell_get_buyer
// - scell_list_buyers
// - scell_update_buyer
// - scell_delete_buyer
// - scell_resolve_vat_context
//
// --- Products (5) ---
// - scell_create_product
// - scell_get_product
// - scell_list_products
// - scell_update_product
// - scell_delete_product
//
// --- Product Categories (5) ---
// - scell_create_product_category
// - scell_get_product_category
// - scell_list_product_categories
// - scell_update_product_category
// - scell_delete_product_category
//
// --- Suppliers (3) ---
// - scell_list_suppliers
// - scell_get_supplier
// - scell_update_supplier
//
// --- Invoice Templates (9) ---
// - scell_list_invoice_templates
// - scell_get_invoice_template
// - scell_create_invoice_template
// - scell_update_invoice_template
// - scell_delete_invoice_template
// - scell_set_default_invoice_template
// - scell_preview_invoice_template
// - scell_derive_template_colors_from_email_logo
// - scell_derive_template_colors_from_invoice_logo
//
// --- Branding (7) ---
// - scell_get_tenant_branding
// - scell_update_tenant_branding
// - scell_preview_tenant_branding
// - scell_get_tenant_branding_logo_upload_url
// - scell_get_sub_tenant_branding
// - scell_update_sub_tenant_branding
// - scell_preview_sub_tenant_branding
//
// --- Documents (1) ---
// - scell_preview_document
//
// --- Sub-Tenants & Onboarding (20) ---
// - scell_list_sub_tenants
// - scell_create_sub_tenant
// - scell_get_sub_tenant
// - scell_update_sub_tenant
// - scell_delete_sub_tenant
// - scell_find_sub_tenant_by_external_id
// - scell_get_subtenant_superpdp_status
// - scell_refresh_subtenant_superpdp_status
// - scell_authorize_subtenant_superpdp
// - scell_get_subtenant_resume_url
// - scell_disconnect_subtenant_superpdp
// - scell_reconnect_subtenant_superpdp
// - scell_mint_subtenant_widget_token
// - scell_get_subtenant_thresholds
// - scell_simulate_subtenant_thresholds
// - scell_update_subtenant_fiscal_status
// - scell_lookup_sirene
// - scell_create_onboarding_session
// - scell_get_onboarding_session
// - scell_authorize_onboarding_superpdp
//
// --- Fiscal (12) ---
// - scell_get_fiscal_compliance
// - scell_check_fiscal_integrity
// - scell_list_fiscal_closings
// - scell_get_fiscal_attestation
// - scell_list_fiscal_entries
// - scell_get_kill_switch_status
// - scell_list_fiscal_rules
// - scell_export_fec
// - scell_perform_daily_closing
// - scell_activate_kill_switch
// - scell_deactivate_kill_switch
// - scell_export_forensic
//
// --- Billing (7) ---
// - scell_list_billing_invoices
// - scell_get_billing_usage
// - scell_list_billing_transactions
// - scell_list_credit_packs
// - scell_checkout_credit_pack
// - scell_topup_balance
// - scell_confirm_topup
//
// --- Stats (2) ---
// - scell_get_stats_overview
// - scell_get_stats_monthly
//
// --- Tenant (3) ---
// - scell_get_tenant_profile
// - scell_update_tenant_profile
// - scell_get_tenant_stats
//
// --- Incoming Invoices (5) ---
// - scell_list_incoming_invoices
// - scell_get_incoming_invoice
// - scell_accept_incoming_invoice
// - scell_reject_incoming_invoice
// - scell_mark_incoming_invoice_paid
//
// --- Signatures (6) ---
// - scell_create_signature
// - scell_get_signature
// - scell_list_signatures
// - scell_download_signed
// - scell_cancel_signature
// - scell_send_reminder
//
// --- Account / Validation / System / Audit (6) ---
// - scell_get_balance
// - scell_validate_siret
// - scell_validate_vat
// - scell_get_audit_trail
// - scell_health_check
// - scell_validate_api_key
//
// --- Usage notes (key tools) ---
//
// scell_create_invoice: the server generates invoice_number automatically (not a
//   parameter). Supports international parties (SIRET only for FR, vat_number for
//   EU, legal_id+legal_id_scheme for non-EU) and an optional sub_tenant_id
//   (anti-IDOR). REST payload is snake_case: invoice_type ('standard'|'deposit'|
//   'balance'), parent_quote_id (since v2.20.0 valid for invoice_type='standard'
//   too, to link a standalone invoice to its source quote). VAT auto-resolution:
//   when a line gives category without vatRate, the rate is resolved before send;
//   the backend is authoritative and returns 409 VAT_CORRECTION_REQUIRED on an
//   inconsistent rate unless vatOverrideReason is set. Catalog fields per line:
//   productId, saveToCatalog, productCategoryId (REST: product_id, save_to_catalog,
//   product_category_id).
// scell_get_invoice (since v2.21.0): status can be 'draft', 'validating',
//   'validated', 'converting', 'converted', 'transmitting', 'transmitted',
//   'accepted', 'rejected', 'disputed', 'paid', 'received', 'completed', 'error',
//   'refunded', 'partially_refunded' (16 values). Also exposes read-only
//   refund_status ('none'|'partial'|'full') and total_refunded.
// scell_list_invoices (since v2.21.0): the status filter accepts the same 16
//   values. Each invoice also carries archive_status ('pending'|'archived'|
//   'glacier'|'error') reflecting the long-term Factur-X PDF/A archival state,
//   plus refund_status and total_refunded.
// scell_download_invoice: returns the invoice PDF/XML.
// scell_list_credit_notes (since v2.22.0): optional status filter ('draft'|'sent')
//   and type filter ('partial'|'total').
// scell_get_credit_note: returns one credit note.
// scell_list_quotes (since v2.22.0): the status filter accepts the 8 backend
//   values 'draft', 'sent', 'viewed', 'accepted', 'refused', 'expired',
//   'converted', 'cancelled'. Other filters: sub_tenant_id, buyer_id, date range,
//   page, per_page.
// scell_update_quote: partial update of a draft/sent quote.
// scell_list_signatures (since v2.22.0): the status filter accepts the 7 backend
//   values 'pending', 'waiting_signers', 'partially_signed', 'completed',
//   'refused', 'expired', 'error'. Each signature also carries an archive_status
//   of 'pending', 'archived', 'glacier' or 'error'.
// scell_download_signed: downloads the signed document.
// scell_get_subtenant_superpdp_status: returns the cached SuperPDP onboarding
//   status; SubTenantOnboardingStatus is one of 'pending_superpdp',
//   'superpdp_redirected', 'superpdp_authorized', 'superpdp_pending_review',
//   'active', 'superpdp_failed'.
// scell_refresh_subtenant_superpdp_status: forces a fresh SuperPDP poll
//   (rate-limited); surfaces 422 MISSING_ACCESS_TOKEN + authorize_url when needed.
//
// VAT resolution (scell_resolve_vat_context): resolve the applicable VAT rate +
// EN16931 category for one invoice line. Call it when the buyer is non-French
// with a vat_number (rate likely 0%) or when the rate is uncertain, BEFORE
// scell_create_invoice. supplyType='goods' => INTRACOM_GOODS (K) / EXPORT (G);
// services => REVERSE_CHARGE (AE) / OUT_OF_SCOPE (O). scell_create_invoice also
// auto-resolves a line when category is given without vatRate; the backend is
// authoritative and replies 409 VAT_CORRECTION_REQUIRED on an inconsistent rate
// unless vatOverrideReason is set.
//
// Registries (scoped by tenant_id + sub_tenant_id, anti-IDOR 404 cross-scope):
//   Buyers     scell_*_buyer            — reusable customer profiles, ref by buyer_id on invoice/quote.
//   Products   scell_*_product          — catalog line items, ref by product_id / save via save_to_catalog.
//   Categories scell_*_product_category — group products.
//   Suppliers  scell_list/get/update_supplier — derived from incoming invoices; identity is read-only.
// Snapshots on emitted documents stay immutable (ISCA) regardless of later edits.
//
// Invoice templates (scell_*_invoice_template) customize Factur-X PDF rendering
// (logo, colors, mentions); cascade explicit -> sub_tenant default -> tenant
// default -> system. Email branding (scell_*_tenant_branding /
// scell_*_sub_tenant_branding) customizes outbound emails; brand_logo_url is
// distinct from the Factur-X PDF logo. scell_preview_document renders a live
// HTML preview of a draft invoice/credit_note/quote (nothing persisted).
//
// Sub-tenants & onboarding (master sk_*/Bearer): CRUD + SuperPDP lifecycle
// (status / refresh / authorize / disconnect / reconnect / widget-token / resume
// url) + micro-entrepreneur thresholds (get/simulate) + fiscal-status update
// (flip vat_status to 'liable'). scell_lookup_sirene + scell_*_onboarding_session
// drive the public widget flow (publishable key).
//
// Fiscal (ISCA, tenant key): compliance dashboard, hash-chain integrity, closings,
// attestation, ledger entries, FEC export, forensic export, kill-switch. Billing:
// invoices, usage, transactions, credit packs (list/checkout), top-up (init/confirm).
//
// Payments: scell_mark_invoice_paid / scell_mark_incoming_invoice_paid require a
// payment_means_code (UN/ECE 4461, Factur-X BT-81; '58'=SEPA, '30'=transfer...).
//
// Signatures (scell_*_signature): create (multi-document attachments[], per-signer
// signaturePositions, initials, mentions), get, list, download_signed, cancel,
// send_reminder. snake_case mapping (signer_index, initials_block, page_width_px,
// document_index...) is handled by the MCP server before POSTing to /api/v1/signatures.
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
