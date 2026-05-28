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
// Available tools (103):
//
// --- Health & Authentication ---
// - scell_health_check: Check API health status
// - scell_validate_api_key: Validate your API key
//
// --- VAT Context Resolution (since v2.19.0) ---
// - scell_resolve_vat_context: Resolve the applicable VAT rate and category for a single invoice line. POST /api/v1/tenant/buyers/vat-context. Auth: sk_*/pk_*. Provide either buyer_id (UUID of an existing registry entry) or an inline buyer object {country, vatNumber?, isIndividual?}. Provide a line object {category: VatCategory, placeOfSupply?: 'FR'|..., serviceNature?: string}. Returns {resolution: {rate, category, en16931Code, exemptionReason, justification, isAutoResolved, rule}, warnings[]}. KEY LLM RULES: (1) ALWAYS call this tool when the buyer is non-French (country !== 'FR') AND has a vat_number — the rate is very likely 0% REVERSE_CHARGE. (2) Call before scell_create_invoice when the LLM cannot determine the rate with confidence. (3) Surface justification and exemptionReason to the user before creating the invoice (e.g. 'Prestation B2B intracom → autoliquidation art. 259-1 CGI, taux 0%'). (4) When the user says 'prestation B2B intracom', 'services intracom', 'reverse charge', or the buyer is EU + has a VAT number, assume REVERSE_CHARGE and confirm via this tool.
//
// --- Buyers Registry (since v2.24.0, tenant key required) ---
// The buyers registry is a deduplicated catalog of reusable customer profiles, scoped strictly by (tenant_id, sub_tenant_id) — a tenant NEVER sees another tenant's buyers, a sub-tenant only sees its own, the parent tenant does not see its sub-tenants' buyers (enforced by BuyerPolicy + Eloquent scope). Buyers can be referenced by buyer_id on invoice / credit note / quote creation, which snapshots the current state into the immutable fiscal document (modifying a buyer afterwards never alters previously emitted invoices — ISCA compliance).
// - scell_list_buyers: List buyers for the calling scope. GET /api/v1/buyers. Auth: sk_*/pk_* (Sanctum SPA also accepted). Optional query: q (free-text search on name/siret/email), is_individual (boolean — true=B2C, false=B2B), sub_tenant_id (anti-IDOR: must belong to caller tenant), page, per_page (max 100). Returns PaginatedResult<Buyer>. Each Buyer carries id, name, is_individual, siret (B2B FR only), vat_number, email, billing_address {line1, postal_code, city, country}, optional shipping_address {name, line1, line2?, postal_code, city, region?, country} (BG-13 delivery — when null OR identical to billing_address, the Factur-X generator omits the delivery party to avoid Schematron warnings).
// - scell_create_buyer: Create a reusable buyer in the registry. POST /api/v1/buyers. Body: { name (required), is_individual (boolean, default false), siret? (14 digits, required for FR B2B), vat_number? (EU VIES format, e.g. FR12345678901), legal_id?, legal_id_scheme? (for non-EU), email?, phone?, country (ISO 2, required), billing_address (required, {line1, postal_code, city, country}), shipping_address? (BG-13), sub_tenant_id? (anti-IDOR), notes?, metadata? }. Returns Buyer. Idempotent on (tenant_id, sub_tenant_id, siret) for B2B and (tenant_id, sub_tenant_id, lower(email)) for B2C — duplicate creates upsert silently and return the existing row. 422 if billing_address is incomplete or country is missing.
// - scell_get_buyer: Retrieve a buyer by UUID. GET /api/v1/buyers/{id}. Auth: sk_*/pk_*. Returns Buyer. 404 if the UUID does not exist in the caller scope (anti-IDOR — does not leak existence to other tenants).
// - scell_update_buyer: Partial update of a buyer. PUT /api/v1/buyers/{id}. Body: any subset of CreateBuyerInput. Does NOT propagate to previously emitted invoices (snapshots are immutable on the ISCA ledger by design). Returns updated Buyer. 404 if outside caller scope.
// - scell_delete_buyer: Soft delete a buyer. DELETE /api/v1/buyers/{id}. The buyer becomes unselectable in new invoice creation but historic invoice snapshots remain intact. Returns 204. 404 if outside caller scope. Note: DELETE is reversible by an admin via the trash UI within 30 days.
//
// --- Suppliers Registry (since v2.26.0, tenant key required) ---
// The suppliers registry is a deduplicated catalog of reusable supplier / vendor profiles, scoped strictly by (tenant_id, sub_tenant_id) — a tenant NEVER sees another tenant's suppliers, a sub-tenant only sees its own, the parent tenant does not see its sub-tenants' suppliers (same scoping policy as the buyers registry). Suppliers represent the issuing party of incoming invoices (Accounts Payable). Unlike buyers, suppliers have NO shipping address and NO VAT-context resolution (they are not a delivery destination).
// - scell_list_suppliers: List suppliers for the calling scope. GET /api/v1/suppliers. Auth: sk_*/pk_* (Sanctum SPA also accepted). Optional query: q (free-text search on name/siret/email), is_individual (boolean — true=individual, false=company), sub_tenant_id (anti-IDOR: must belong to caller tenant), page, per_page (max 100). Returns PaginatedResult<Supplier>. Each Supplier carries id, name, is_individual, siret (company FR only), vat_number, email, phone, country, billing_address {line1, postal_code, city, country}, metadata, notes.
// - scell_create_supplier: Create a reusable supplier in the registry. POST /api/v1/suppliers. Body: { name (required), is_individual (boolean, default false), siret? (14 digits, required for FR company), vat_number? (EU VIES format, e.g. FR12345678901), legal_id?, legal_id_scheme? (for non-EU), email?, phone?, country (ISO 2, required), billing_address (required, {line1, postal_code, city, country}), sub_tenant_id? (anti-IDOR), notes?, metadata? }. Returns Supplier. Idempotent on (tenant_id, sub_tenant_id, siret) for companies and (tenant_id, sub_tenant_id, lower(email)) for individuals — duplicate creates upsert silently and return the existing row. 422 if billing_address is incomplete or country is missing.
// - scell_get_supplier: Retrieve a supplier by UUID. GET /api/v1/suppliers/{id}. Auth: sk_*/pk_*. Returns Supplier. 404 if the UUID does not exist in the caller scope (anti-IDOR — does not leak existence to other tenants).
// - scell_update_supplier: Partial update of a supplier. PUT /api/v1/suppliers/{id}. Body: any subset of CreateSupplierInput. Returns updated Supplier. 404 if outside caller scope.
// - scell_delete_supplier: Soft delete a supplier. DELETE /api/v1/suppliers/{id}. The supplier becomes unselectable in new flows but historic references remain intact. Returns 204. 404 if outside caller scope.
//
// --- Electronic Invoicing ---
// - scell_create_invoice: Create a new electronic invoice (invoice_number is NOT a parameter — the server generates it automatically. Supports international parties: SIRET required only for French companies (country=FR). For EU companies, provide vat_number. For non-EU, provide legal_id + legal_id_scheme. Optional sub_tenant_id (UUID) attributes the invoice to a sub-tenant of the calling tenant — anti-IDOR 403 if it does not belong to the API key's tenant. The legacy api_keys.company_id binding was removed in the 2026-05-11 refonte. Optional invoice_type ('standard'|'deposit'|'balance') and parent_quote_id (UUID) link the invoice to a source quote. **Since v2.20.0**: parent_quote_id is now also valid for invoice_type='standard' (or omitted, since 'standard' is the default) — useful to track a standalone invoice that originated from a commercial quote without going through the deposit/balance conversion flow. Anti-IDOR 403 if the quote does not belong to the tenant. For 'deposit'/'balance' invoices, prefer the dedicated conversion tools (scell_convert_quote_to_deposit / scell_convert_quote_to_balance) which set parent_quote_id automatically. **VAT AUTO-RESOLUTION (since v2.19.0)**: when lines[].category is provided WITHOUT vatRate, the MCP layer automatically calls scell_resolve_vat_context for each such line before forwarding to the backend, and fills vatRate + metadata.exemption_reason. When both vatRate AND category are provided, the explicit vatRate is respected as-is. This enables the LLM to specify ONLY the business intent (e.g. category='STANDARD' for a domestic service) and let the resolver handle the tax maths based on the actual buyer profile.)
// - scell_get_invoice: Retrieve an invoice by ID. **Status values (since v2.21.0)** — the status field can take any of these 16 values (aligned with the backend PostgreSQL CHECK constraint): 'draft', 'validating', 'validated', 'converting', 'converted', 'transmitting', 'transmitted', 'accepted', 'rejected', 'disputed', 'paid', 'received', 'completed', 'error', 'refunded' (a credit note fully credited the invoice), 'partially_refunded' (a credit note partially credited the invoice). The response also exposes refund_status ('none'|'partial'|'full') and total_refunded (number, sum of validated credit notes targeting this invoice) — both read-only, auto-maintained by the backend CreditNoteObserver. Use refund_status='full' instead of guessing from status='refunded' for robust refund detection.
// - scell_list_invoices: List all invoices. **Status filter (since v2.21.0)** — the optional status query parameter accepts any of: 'draft', 'validating', 'validated', 'converting', 'converted', 'transmitting', 'transmitted', 'accepted', 'rejected', 'disputed', 'paid', 'received', 'completed', 'error', 'refunded', 'partially_refunded' (16 values, aligned with the backend PostgreSQL CHECK constraint). Common LLM filtering patterns: status=paid (only paid invoices), status=transmitted (sent to PEPPOL but not yet accepted), status=refunded (fully credited), status=partially_refunded (partial credit note exists). Each returned invoice carries refund_status ('none'|'partial'|'full') and total_refunded (number) — these are read-only fields auto-set by the backend CreditNoteObserver when validated credit notes target the invoice. **Archive status (since v2.22.0)** — each invoice also carries archive_status ∈ {'pending' (archival queued), 'archived' (S3 Object Lock COMPLIANCE 11-year retention), 'glacier' (Glacier Deep Archive, retrieval ~12h), 'error' (archival failed, manual re-archive needed)}. The archive_status is independent of the lifecycle status and reflects the long-term Factur-X PDF/A archival state. The LLM should surface refund_status and total_refunded (vs total_including_tax) when the user asks about partial refunds or credit-note coverage.
// - scell_download_invoice: Download invoice PDF/XML (legacy, company-scoped — requires API key bound to a specific company)
// - scell_download_tenant_invoice: Download tenant-scoped invoice PDF/XML — works with tenant API keys for sub-tenant invoices and tenant-direct invoices (replaces deprecated v1 /tenant/invoices/{id}/download). Format: facturx | pdf | xml (default: facturx). Optional sub_tenant_id query for sub-tenant scoped strict-ownership.
// - scell_mark_invoice_paid: Mark an outgoing invoice as paid (manual payment). POST /api/v1/invoices/{invoiceId}/mark-paid. Auth: sk_* / Bearer Sanctum. Accepts invoices in status validated, transmitted, sent, or accepted. Sets status=paid, paid_at=now(), payment_method=manual, AND persists the Factur-X EN16931 BT-81 payment_means_code on the invoice. Body: { payment_means_code (REQUIRED, UN/ECE 4461 enum — one of '1', '10', '20', '30', '42', '48', '49', '57', '58', '59', '97' — see below), payment_means_text? (max 100 chars, Factur-X BT-82 free-text label), payment_reference? (max 100), paid_at? (date ISO 8601, before_or_equal:now), note? (max 500 chars) }. **payment_means_code labels (UN/ECE 4461) — Factur-X EN16931 BT-81 conformity:** '1'=Non spécifié / Unspecified (fallback générique, BR-CO-27 toléré), '10'=Espèces / Cash, '20'=Chèque / Cheque, '30'=Virement / Credit transfer (international), '42'=Versement bancaire / Bank account transfer (sans IBAN), '48'=Carte bancaire / Bank card, '49'=Prélèvement / Direct debit, '57'=Accord permanent / Standing agreement (mandat), '58'=Virement SEPA / SEPA credit transfer (privilégié pour B2B France), '59'=Prélèvement SEPA / SEPA direct debit, '97'=Compensation inter-comptes / Clearing between partners. Default UX-friendly: pré-remplir avec '30' (virement) ou '58' (SEPA si tenant FR). Returns the updated Invoice with paymentMeansCode + paymentMeansText fields populated. Errors: 422 INVOICE_NOT_PAYABLE if the invoice status does not allow this transition, 422 ALREADY_PAID if already paid, 422 if payment_means_code is missing or not in the enum (the backend MarkPaidRequest enforces this). Since v2.25.0 (backend BT-81 livraison 2026-05-27 commit a48c241).
// - scell_mark_incoming_invoice_paid: **(since v2.25.0)** Mark an INCOMING invoice (received from a supplier) as paid. POST /api/v1/tenant/invoices/incoming/{invoiceId}/mark-paid. Auth: sk_* / Bearer Sanctum. Same body shape and Factur-X BT-81 conformity requirements as scell_mark_invoice_paid: { payment_means_code (REQUIRED, UN/ECE 4461 enum — '1', '10', '20', '30', '42', '48', '49', '57', '58', '59', '97'), payment_means_text? (max 100, BT-82 free-text), payment_reference? (max 100), paid_at? (date ISO 8601, before_or_equal:now), note? (max 500) }. **Key behavioral difference with scell_mark_invoice_paid:** only invoices in status='accepted' can be marked paid (incoming invoices follow a tighter lifecycle: received → accepted → paid; statuses validated/transmitted/sent do NOT exist for incoming). The backend checks invoice.status === 'accepted' strictly. Sets status=paid, paid_at, payment_reference, payment_means_code, payment_means_text, and appends an entry to superpdp_response.payment_history (audit trail). **payment_means_code labels** (UN/ECE 4461 — Factur-X EN16931 BT-81): '1'=Non spécifié, '10'=Espèces, '20'=Chèque, '30'=Virement, '42'=Versement bancaire, '48'=Carte bancaire, '49'=Prélèvement, '57'=Accord permanent, '58'=Virement SEPA, '59'=Prélèvement SEPA, '97'=Compensation. Default UX-friendly: '58' (SEPA) ou '30' (virement international) selon le pays du fournisseur. Returns the updated IncomingInvoice. Errors: 404 if the incoming invoice does not belong to the calling tenant, 422 if status !== 'accepted' (message includes the current status to guide the LLM), 422 if payment_means_code missing or invalid. Use this tool to track AP (Accounts Payable) settlement on supplier invoices received via PEPPOL / SuperPDP.
//
// --- Invoice Templates / Personnalisation (since v2.24.0, tenant key required) ---
// Invoice templates customize the visual rendering of Factur-X PDF invoices, credit notes, and quote PDFs (logo, primary color, footer text, mentions). Templates have 3 scopes (system | tenant | sub_tenant) and resolve in cascade: explicit invoice_template_id → sub_tenant default → tenant default → system default (Scell.io baseline). Set kind=both to use the same template for invoices AND quotes, or kind=invoice/quote to scope by document type.
// - scell_list_invoice_templates: List invoice/quote templates accessible to the caller. GET /api/v1/invoice-templates. Auth: sk_*. Returns Template[] including system defaults (read-only, scope=system) and tenant/sub-tenant overrides. Optional query: kind (filter by 'invoice' | 'quote' | 'both'), sub_tenant_id (anti-IDOR).
// - scell_create_invoice_template: Create a new template. POST /api/v1/invoice-templates. Body: { name (required), kind ('invoice' | 'quote' | 'both', required), scope ('tenant' | 'sub_tenant', required), sub_tenant_id? (required when scope='sub_tenant', anti-IDOR), primary_color? (#RRGGBB hex), logo_url? (https URL, see scell_upload_branding_logo helper), footer_html?, notes_html?, mentions_html?, is_default? (boolean — set this template as the default for its (scope, sub_tenant_id, kind) tuple, atomic — only one default per tuple). Returns Template.
// - scell_get_invoice_template: Retrieve a template by UUID. GET /api/v1/invoice-templates/{id}. 404 if outside caller scope. System templates are always readable.
// - scell_update_invoice_template: Partial update of a tenant/sub_tenant template. PUT /api/v1/invoice-templates/{id}. Body: any subset of CreateInvoiceTemplateInput. System templates cannot be updated (403). Returns updated Template.
// - scell_delete_invoice_template: Soft delete a template. DELETE /api/v1/invoice-templates/{id}. System templates cannot be deleted (403). If the template is referenced by historical invoices (invoice_template_id FK), the FK is preserved (soft delete keeps the row readable for archival rendering). 204 on success.
// - scell_set_default_invoice_template: Atomically mark a template as the default for its (scope, sub_tenant_id, kind) tuple. PUT /api/v1/invoice-templates/{id}/default. Unsets the previous default (transaction-safe). Returns Template. Use this when a tenant wants to switch its default invoice/quote template without manually clearing the previous one.
//
// --- Electronic Signatures ---
// - scell_create_signature: Create a signature request. Optional sub_tenant_id (UUID) in the payload attributes the request to a sub-tenant of the calling tenant — anti-IDOR 403 if it does not belong to the API key's tenant. The legacy api_keys.company_id binding was removed in the 2026-05-11 refonte. Optional initialsBlock (paraphe automatique sur pages intermediaires), mentions (array de champs texte/mention libres a apposer sur le document), and dateBlock (date automatique au moment de la signature) are supported since v2.12.0. initialsBlock has two formats: (1) RECOMMENDED since v2.16.0 — initialsBlock.positions[] (InitialsPosition array) defines one position per page (page:1-500, x, y, unit:'percent'|'pixel', optional pageWidthPx/pageHeightPx, fontSize/color/bold per-page overrides); pages not listed receive no paraph — example: positions:[{page:1,x:5,y:90,unit:'percent'},{page:2,x:85,y:90}]; (2) LEGACY — initialsBlock.position (single position) + initialsBlock.pages ('all'|'except_last'|number[]). If positions[] is provided it overrides position+pages. New global fields: bold (boolean, default false). **Multi-document bundles (since v2.17.0):** the optional attachments[] array (max 10, 20 Mo cumulated with the main document) lets you submit additional PDFs alongside the principal document — the backend merges them into a single signable PDF before submission to the signature authority. Each SignatureAttachment carries {document: base64, documentName: 'file.pdf'}. Signature positions, mentions, and initials positions can target a specific document via their optional documentIndex field (0 = main document, 1..N = attachments[N-1]; default 0). Example: signaturePositions:[{documentIndex:0,page:1,x:10,y:80},{documentIndex:2,page:1,x:10,y:80}] places one signature on the main contract and one on attachments[1] (the second annex). **Per-signer signature positions (since v2.27.0):** each SignaturePosition accepts an optional signerIndex field (0-based, aligned with the signers[] array order — 0 = first signer). When omitted, the position applies to the global signature flow (legacy behaviour). The EU-SES API allows MULTIPLE signature positions per signer: provide N entries sharing the same signerIndex to place a signer's signature on several pages or documents. Example: signaturePositions:[{signerIndex:0,page:1,x:10,y:80},{signerIndex:0,page:3,x:10,y:80},{signerIndex:1,page:1,x:60,y:80}] gives signers[0] two signature zones (pages 1 and 3) and signers[1] one zone (page 1). NOTE: types use camelCase (LLM-friendly, aligned with InvoiceInput.invoiceNumber convention). The REST API expects snake_case (initials_block, date_block, signer_index, fallback_text, font_size, custom_text, page_width_px, page_height_px, document_index, document_name on attachments) — the MCP server consuming this client config is responsible for the camelCase → snake_case mapping before POST to /api/v1/signatures.
// - scell_get_signature: Get signature request status
// - scell_list_signatures: List all signature requests (GET /api/v1/signatures, tenant-scoped via the API key). Optional filters: status, environment, sub_tenant_id (anti-IDOR — must belong to the current tenant), page, per_page (max 100). **Status filter (since v2.22.0)** — the optional status query parameter accepts any of: 'pending' (request created, signers not yet emailed), 'waiting_signers' (signers were notified, no signature yet), 'partially_signed' (≥ 1 signer signed but not all), 'completed' (all signers signed — terminal happy path), 'refused' (≥ 1 signer refused — terminal), 'expired' (TTL passed without completion — terminal), 'error' (terminal failure). Each returned signature also carries archive_status ∈ {'pending', 'archived', 'glacier', 'error'} reflecting the long-term archival lifecycle of the signed PDF (S3 Object Lock + Glacier Deep). Available under sk_live_*/sk_test_* keys since API v2.3.0. NOTE: the legacy company_id filter was removed in the 2026-05-11 backend refonte (api_keys.company_id column dropped). For URL-nested sub-tenant scoping, prefer scell_subtenant_list_signatures.
// - scell_tenant_list_signatures: List signature requests for the entire tenant via URL-nested route GET /api/v1/tenant/signatures. Auth: sk_live_*/sk_test_*. Optional filters: status, environment, page, per_page (max 100). Use this when the API key is master tenant-level (the legacy api_keys.company_id binding was removed in the 2026-05-11 backend refonte — a master tenant key now scopes signatures to the whole tenant via this route). If you provide a sub_tenant_id that does not belong to the calling tenant, the API returns 404 SUB_TENANT_NOT_FOUND (anti-IDOR). If the API key cannot be resolved to a tenant (deactivated, malformed), the API returns 401 TENANT_NOT_RESOLVED. Available since API v2.7.0.
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
// - scell_list_credit_notes: List credit notes for the current tenant. **Filters (since v2.22.0)** — optional status ∈ {'draft' (editing, not yet validated), 'sent' (issued, immutable on the ISCA ledger)} and type ∈ {'partial' (credit only a subset of invoice lines / reduced amount), 'total' (credit the full invoice)}. Both filters mirror the backend credit_notes.status and credit_notes.type PostgreSQL CHECK constraints. When type='total' the credit note triggers the parent Invoice to transition to status='refunded' (and refund_status='full'). When type='partial' it triggers status='partially_refunded' (refund_status='partial'). The transitions are auto-applied by CreditNoteObserver once the credit note is sent. Optional pagination: page, per_page (max 100). Auth: sk_live_*/sk_test_*.
// - scell_get_credit_note: Get credit note details
// - scell_download_credit_note: Download credit note PDF
// - scell_create_credit_note: Create a credit note
// - scell_send_credit_note: Validate and send credit note
// - scell_delete_credit_note: Delete draft credit note
// - scell_get_remaining_creditable: Get remaining creditable amounts
//
// --- Email Branding (since v2.24.0, tenant key required) ---
// Email branding allows tenants and sub-tenants to customize the logo, primary color, footer, and signature on all outbound emails (invoice, credit note, quote). When all required fields (brand_logo_url, brand_primary_color, brand_email_footer) are set, the tenant's / sub-tenant's branding replaces the Scell.io default. Otherwise the default branding is used as fallback. NOTE: brand_logo_url is distinct from logo_url (the Factur-X PDF logo — managed via invoice templates or Company.logo_url). brand_primary_color MUST be #RRGGBB (6-digit hex, validated server-side). For sub-tenant scoping, prepend the sub_tenant_id query param.
// - scell_get_branding: Get the current email branding for the master tenant OR a specific sub-tenant. GET /api/v1/branding/tenant (no sub_tenant_id) OR GET /api/v1/branding/sub-tenants/{subTenantId} (anti-IDOR — must belong to caller). Auth: sk_*. Returns Branding {brand_logo_url, brand_primary_color, brand_email_footer, brand_email_signature, is_complete (boolean), missing_fields[] (string array listing which fields are still null when is_complete=false)}. The LLM should check is_complete before suggesting that branding is fully customized.
// - scell_update_branding: Update email branding for the master tenant OR a specific sub-tenant. PUT /api/v1/branding/tenant (no sub_tenant_id) OR PUT /api/v1/branding/sub-tenants/{subTenantId}. Body: any subset of { brand_logo_url (https URL), brand_primary_color (#RRGGBB), brand_email_footer (text/HTML), brand_email_signature (text/HTML) }. All fields are nullable — pass null to clear a field and fall back to Scell.io default. Returns updated Branding (with refreshed is_complete + missing_fields).
// - scell_upload_branding_logo: Get a pre-signed S3 PUT URL for uploading the branding logo (PNG/JPEG, max 2 MB, recommended 256x64). POST /api/v1/branding/tenant (no sub_tenant_id) OR POST /api/v1/branding/sub-tenants/{subTenantId} with body { content_type: 'image/png' | 'image/jpeg', filename }. Returns { upload_url (pre-signed S3 PUT, 15 min TTL), public_url (final URL once uploaded — pass this to scell_update_branding.brand_logo_url) }. The LLM should instruct the user to PUT the file to upload_url with Content-Type matching content_type, then call scell_update_branding with brand_logo_url=public_url.
//
// --- Billing Payments (tenant key required) ---
// - scell_pay_billing_invoice: Initiate Stripe payment for a Scell.io billing invoice. Returns client_secret for Stripe.js confirmCardPayment(). Requires invoice to be in a payable status (not draft/paid/cancelled).
// - scell_get_billing_invoices: List Scell.io billing invoices (invoices that the tenant owes Scell.io — subscription, top-ups, pack purchases). GET /api/v1/tenant/billing/scell-invoices. Auth: sk_*. Returns PaginatedResult<TenantInvoice>. Each invoice carries id, invoice_number, status ('draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'), amount (centimes), currency, due_date, paid_at, payment_method, line_items[]. Optional filters: status, page, per_page (max 100). Use scell_pay_billing_invoice to pay an unpaid one.
// - scell_get_billing_usage: Get the current month consumption breakdown for the tenant. GET /api/v1/tenant/billing/usage. Auth: sk_*. Returns BillingUsage { period_start, period_end, current_balance_cents, breakdown: { invoices_emitted, signatures_emitted, validations_done, peppol_submissions }, estimated_overage_cents, last_topup_at, auto_reload_enabled }. The LLM should surface estimated_overage_cents > 0 as a warning ('You will be billed ~X EUR at the next monthly close — top up to avoid surprise charges').
// - scell_topup_balance: Initiate a Stripe top-up to recharge the tenant balance. POST /api/v1/tenant/billing/top-up. Auth: sk_*. Body: { amount_cents (required, min 1000 = 10 EUR, max 1000000 = 10000 EUR), save_payment_method? (boolean, default false — when true, the card is stored for future auto-reload), currency? (defaults to 'eur') }. Returns { payment_intent_id, client_secret (for Stripe.js confirmCardPayment), amount_cents, currency, status (Stripe PI status) }. Idempotent: if an active PI exists with matching amount, returns its client_secret without creating a new one. Webhook payment_intent.succeeded credits the balance asynchronously.
// - scell_pay_invoice: Pay a specific Scell.io billing invoice via Stripe (alias of scell_pay_billing_invoice — clearer name). POST /api/v1/tenant/billing/invoices/{invoice}/pay. Auth: sk_*. No body required. Returns { client_secret, payment_intent_id, amount (centimes), currency, status }. Only callable for invoice.status='sent' or 'overdue'. Returns 422 if the invoice is already paid / cancelled / draft. Idempotent: re-calling with an active PI returns the same client_secret.
//
// --- Credit Packs (since v2.24.0) ---
// Credit packs are one-shot bundles of platform credits (e.g. '100 signatures', '500 invoices') purchased at a discounted rate vs. pay-as-you-go. In sandbox (sk_test_*), purchase credits the balance directly without going through Stripe. In live (sk_live_*), purchase creates a Stripe PaymentIntent + Scell.io billing invoice (Factur-X master tenant emission); the balance is credited asynchronously when the webhook payment_intent.succeeded fires.
// - scell_list_credit_packs: List the publicly available credit packs (no auth required for the listing — pack catalog is public). GET /api/v1/packs/public. Returns CreditPack[] { slug (e.g. 'pack-100-signatures'), name (display label), price_cents (TTC EUR), credits_amount (credits granted on purchase), credit_type ('signature' | 'invoice' | 'mixed'), description, badge ('popular' | 'best_value' | null), is_active }. Use this to render a pricing grid in the UI before calling scell_purchase_credit_pack.
// - scell_purchase_credit_pack: Initiate a credit pack purchase. POST /api/v1/tenant/billing/packs/{packSlug}/checkout. Auth: sk_*. Body: { save_payment_method? (boolean), billing_address? ({ line1, postal_code, city, country } — required if the tenant has no default billing address on file for VAT cross-border calculation) }. Returns { payment_intent_id, client_secret, amount_cents, currency, status, pack: CreditPack snapshot }. In sandbox the balance is credited immediately and the response carries credited=true (no Stripe flow needed). In live, the LLM must instruct the user to confirm the card via Stripe.js — the balance is credited only after the webhook fires.
//
// --- Partner Onboarding (publishable key required) ---
// - scell_onboarding_create_session: Create a new onboarding session
// - scell_onboarding_get_session: Get onboarding session status
// - scell_onboarding_superpdp_authorize: Start SuperPDP OAuth2 flow — returns authorize_url and state
// - scell_onboarding_superpdp_callback: Complete SuperPDP OAuth2 flow — returns authorization_code and tenant
//
// --- Sub-Tenant CRUD (since v2.24.0, master tenant sk_* / Bearer required) ---
// CRUD operations on sub-tenants of the calling master tenant. Strictly scoped (anti-IDOR — 404 if the sub-tenant id does not belong to the caller). Sub-tenants are independent legal entities that the master tenant manages (typically a B2B SaaS that resells Scell.io to its own customers). Each sub-tenant has its own SuperPDP OAuth tunnel, its own KYB compliance lifecycle, its own Buyers / Invoices / Signatures scope, and its own isolated ISCA fiscal ledger (separate hash chain per sub-tenant — corruption of one chain never affects parent or siblings).
// - scell_list_sub_tenants: List sub-tenants of the calling master tenant. GET /api/v1/tenant/sub-tenants. Auth: sk_* (or Sanctum SPA Bearer). Returns PaginatedResult<SubTenant>. Each SubTenant carries id, name, external_id (caller-defined opaque key, useful for cross-system reconciliation), email, onboarding_status (one of the 6 SubTenantOnboardingStatus values), is_active (boolean — false=soft-disabled, cannot emit new invoices), superpdp_company_id (numeric, set once OAuth completes), created_at, updated_at. Optional filters: onboarding_status, is_active, q (search on name/email/external_id), page, per_page (max 100).
// - scell_get_sub_tenant: Retrieve a sub-tenant by UUID. GET /api/v1/tenant/sub-tenants/{id}. Auth: sk_*. Returns SubTenant. 404 if outside caller scope. Tip: prefer scell_get_subtenant_status if you need the full SuperPDP onboarding context (recommended_action, KYB step). This tool returns the raw row only.
// - scell_create_sub_tenant: Create a new sub-tenant. POST /api/v1/tenant/sub-tenants. Auth: sk_*. Body: { name (required), email (required, contact email for KYB notifications + signed resume URL), external_id? (your opaque key for reconciliation — must be unique per master tenant), is_active? (default true), metadata? (free-form JSON), country? (ISO 2, defaults to 'FR') }. Returns SubTenant with onboarding_status='pending_superpdp' (no SuperPDP OAuth started yet — the LLM should immediately call scell_start_subtenant_superpdp_authorize and present the authorize_url to the user OR call scell_resume_url to send the user a signed 7-day resume link by email). The fiscal chain for this sub-tenant starts empty (sequence_number=0) — the first invoice emission will initialize it.
// - scell_update_sub_tenant: Partial update of a sub-tenant. PUT /api/v1/tenant/sub-tenants/{id}. Auth: sk_*. Body: any subset of CreateSubTenantInput minus is_active (use a dedicated mark-inactive flow if needed). Returns updated SubTenant. 404 if outside caller scope. NOTE: name and email updates are propagated to the SuperPDP profile asynchronously via a queued job — the change may take 1-2 min to reflect in the SuperPDP dashboard.
//
// --- Sub-Tenant Lifecycle (master tenant Bearer / sk_* required) ---
// - scell_get_subtenant_status: Get the cached SuperPDP onboarding status for a sub-tenant. Returns { data: SubTenant, recommended_action }. **Onboarding lifecycle (since v2.22.0)** — the returned SubTenant.onboarding_status is one of the 6 backend values (App\\Enums\\SubTenantOnboardingStatus): 'pending_superpdp' (sub-tenant created locally, SuperPDP OAuth not yet initiated), 'superpdp_redirected' (user redirected to SuperPDP authorize URL, awaiting consent), 'superpdp_authorized' (SuperPDP returned an access token but KYB not yet verified), 'superpdp_pending_review' (KYB documents submitted, awaiting SuperPDP compliance review), 'active' (KYB verified — sub-tenant can issue B2B PEPPOL invoices), 'superpdp_failed' (KYB rejected or OAuth flow failed — recommended_action will include a remediation step). The LLM should surface recommended_action (i18n FR/EN) to the user and decide whether to call scell_start_subtenant_superpdp_authorize (when status='pending_superpdp' or 'superpdp_failed' with missing token) or scell_refresh_subtenant_status (to force a fresh poll if status='superpdp_authorized' or 'superpdp_pending_review').
// - scell_refresh_subtenant_status: Force a fresh poll of SuperPDP for one sub-tenant (rate-limited 1/min). Returns { data: SubTenant, recommended_action } on success. **Surfaces 422 MISSING_ACCESS_TOKEN explicitly when the sub-tenant never granted SuperPDP access (or the token was revoked) — the response then includes an authorize_url. The LLM should present that URL to the user, or call scell_start_subtenant_superpdp_authorize to obtain a fresh one, before retrying the refresh.**
// - scell_start_subtenant_superpdp_authorize: **(since v2.9.0)** Start a SuperPDP OAuth2 flow for an existing sub-tenant whose access token is missing or expired. Calls POST /api/v1/tenant/sub-tenants/{id}/superpdp-authorize and returns { authorize_url, state }. The LLM should present authorize_url to the human user — once the user authorizes, Scell.io captures the token via its OAuth callback and subsequent scell_refresh_subtenant_status calls will succeed.
// - scell_resume_url: Regenerate a 7-day signed resume URL for a sub-tenant whose onboarding is not yet active. Returns { resume_url, expires_at }.
// - scell_delete_sub_tenant: **(since v2.9.0)** Delete a sub-tenant via DELETE /api/v1/tenant/sub-tenants/{id}. Accepts an optional cascade boolean query flag. Returns { message, companies_deleted } on success. **Possible 422 codes that the LLM MUST surface to the user with a clear remediation path:** (a) SUB_TENANT_HAS_COMPANIES with companies_count — the sub-tenant still owns Companies; the LLM should ask the user to confirm cascade deletion, then retry with cascade=true; (b) SUB_TENANT_HAS_FISCAL_ENTRIES — the sub-tenant has emitted invoices / credit notes / signatures on the immutable ISCA ledger, deletion is **refused with NO force flag** (compliance); the LLM should propose to mark the sub-tenant inactive via metadata (metadata.archived = true) instead of pushing for deletion.
//
// --- Quotes / Devis (since v2.11.0) ---
// - scell_create_quote: Create a new quote (devis). Accepts same buyer/seller/lines structure as invoices, plus quote-specific fields: validity_date, signature_required (boolean), deposit_schedule (array of percent|amount + due_date + label), callback_url (absolute HTTPS URL where the buyer is redirected after accept/refuse via the public viewer — query string includes status=signed|refused, quote_id, quote_number, reason). Optional sub_tenant_id (anti-IDOR 403). Server auto-generates quote_number. Returns Quote.
// - scell_get_quote: Retrieve a quote by ID with all lines, deposit schedule, and signature evidence. Returns 404 if the quote does not belong to the caller tenant.
// - scell_list_quotes: List quotes with optional filters. **Status filter (since v2.22.0)** — the optional status query parameter accepts any of the 8 backend values: 'draft' (editing, not yet sent), 'sent' (public link emitted, awaiting buyer action), 'viewed' (buyer opened the public viewer at least once), 'accepted' (buyer signed, quote binding), 'refused' (buyer refused with a reason), 'expired' (validity_date passed without buyer decision), 'converted' (at least one invoice was generated from the quote — deposit/balance), 'cancelled' (tenant cancelled with mandatory reason). The 'viewed' and 'expired' values were missing from the SDK prior to v2.22.0 — the LLM can now filter on them. Common LLM patterns: status=sent (quotes awaiting decision), status=viewed (quotes opened but not yet decided — good follow-up candidates), status=expired (need renewal), status=accepted (eligible for scell_convert_quote_to_deposit / scell_convert_quote_to_balance). Other optional filters: sub_tenant_id (anti-IDOR), buyer_id, date range (issued_from / issued_to), page, per_page (max 100).
// - scell_update_quote: Partial update of a draft or sent quote (lines, validity_date, notes, deposit_schedule, buyer, signature_required). Blocked with 422 if status is accepted, converted, or cancelled.
// - scell_delete_quote: Soft delete a quote. Blocked with 422 if status is accepted, converted, or sent (use scell_cancel_quote instead for sent quotes).
// - scell_send_quote: Send quote to buyer by email and generate a signed public URL (90-day TTL by default). Transitions quote status to 'sent'. Returns { public_url, sent_at }. Optional custom email message.
// - scell_cancel_quote: Cancel a draft or sent quote with a mandatory reason string. Transitions status to 'cancelled'. Blocked if status is accepted or converted.
// - scell_duplicate_quote: Clone an existing quote into a new DRAFT with a fresh server-generated quote_number. All lines, buyer snapshot, deposit schedule, and validity_date are copied. Returns the new Quote.
// - scell_convert_quote_to_deposit: Convert an accepted quote to a deposit invoice (acompte). Requires exactly one of percent (0–100 exclusive) or amount. Optional label and due_date. Multiple calls allowed on the same quote (one invoice per call). Returns Invoice with invoice_type='deposit' and parent_quote_id set.
// - scell_convert_quote_to_balance: Convert an accepted quote to the final balance invoice (solde). Balance amount is auto-computed as quote.totalIncludingTax − sum(existing deposit invoices). Optional due_date and label. Returns Invoice with invoice_type='balance' and parent_invoice_ids listing all deposits.
// - scell_get_quote_audit_log: Get the full tamper-evident audit log for a quote. Each entry carries a SHA-256 chainHash linking to the previous entry (legal proof of all state transitions: created, sent, accepted, updated, cancelled, converted). Returns QuoteAuditEntry[].
// - scell_regenerate_quote_public_link: Generate a fresh public_token (UUID v4) for the buyer signature viewer. Revokes any previous active token. Optional ttl_days (default 90, max 365). Returns { public_url, public_token_expires_at }. Use when the previous link was leaked, expired, or needs a longer TTL.
// - scell_revoke_quote_public_link: Mark the current public_token as revoked (public_token_revoked_at = now()). The viewer URL returns 404 immediately. Use when the buyer should no longer be able to sign (e.g. quote replaced, contract renegotiated). Idempotent: no-op if already revoked.
// - scell_get_quote_pdf: Return the binary PDF of a quote (Snappy/wkhtmltopdf, branded with tenant logo + primary color, includes échéancier and signature block). Generated on-the-fly (no cache). Use for archival or attachment in custom emails. Returns Buffer/Blob.
// - scell_preview_quote_pdf: Render a PDF preview from raw payload data WITHOUT persisting a quote. Useful for the tenant UI to show a live preview during draft editing. Same body as scell_create_quote. Returns Buffer/Blob.
//
// --- Payment Schedule (since v2.14.0) ---
// - scell_get_quote_payment_schedule: List all payment schedule lines of a quote, ordered by 'order' then 'due_date'. Each line carries order, amount_type (percent or fixed), amount_value, amount_ttc_snapshot (computed TTC EUR for percent lines, null for unsaved), due_date (or null = on acceptance), milestone_label, status (pending or invoiced or cancelled), is_locked, is_overdue, invoice_id (when generated). Returns PaymentScheduleLine[].
// - scell_set_quote_payment_schedule: Replace the entire payment schedule of a quote (idempotent). Body: { lines: [{ order, amount_type, amount_value, due_date?, milestone_label?, description?, auto_generate? }] }. Validates sum (percent ≤ 100%, fixed ≤ total_ttc). Blocked once the quote is signed. Returns PaymentScheduleLine[].
// - scell_patch_quote_payment_schedule: Apply targeted changes to the schedule without replacing everything. Body: { add: [], update: [{ id, ... }], remove: [lineId, ...] }. Use for incremental edits via UI. Blocked once signed.
// - scell_delete_quote_payment_schedule: Remove all payment schedule lines from a quote. Blocked if any line has status='invoiced' (would orphan a deposit invoice — use scell_cancel_invoice + scell_patch_quote_payment_schedule with remove instead).
// - scell_get_quote_payment_summary: Aggregated payment status of a quote — { quote: { id, quote_number, total_ttc }, schedule: { lines_count, pending_count, invoiced_count, planned_total_ttc, planned_remainder }, invoiced: { gross_ttc, credits_ttc, net_ttc, remaining_ttc, remaining_pct }, next_due: { line_id, due_date, amount_ttc, label, days_until }|null, overdue: [{ line_id, due_date, amount_ttc, label, days_overdue }], superpdp_status: [{ invoice_id, invoice_number, status, accepted_at, paid_at }], lines: PaymentScheduleLine[] }. Use for the dashboard tracker view.
// - scell_convert_schedule_line_to_invoice: Generate a deposit invoice from a single payment schedule line. Body: { due_date?, label?, auto_send? }. Marks the line as status='invoiced' + sets invoice_id. The line is then locked (cannot be modified or removed). Returns Invoice with invoice_type='deposit', parent_quote_id, and schedule_line_id.
// - scell_list_payment_schedule_presets: List preset payment plans (e.g. '30/70', '50/50', 'milestones-3-steps') usable as templates for new schedules. Each preset has lines [{ percentage, label, due_offset_days }]. Apply via scell_set_quote_payment_schedule after mapping due_offset_days to actual dates.
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
