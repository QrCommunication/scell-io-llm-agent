# @scell/mcp-client

MCP (Model Context Protocol) client configuration generator for [Scell.io](https://scell.io) API.

Scell.io provides electronic invoicing (Factur-X/UBL/CII, **B2B and B2C**) and simple electronic signatures (eIDAS EU-SES) via API.

For B2C invoices, set `buyer.isIndividual = true` (or `buyerIsIndividual: true` at top-level) — SIRET / vatNumber / legal_id become optional and the generated Factur-X is BR-CO-26 EN16931 compliant.

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
| `scell_create_invoice` | Create a new electronic invoice (Factur-X, UBL, or CII format). Optional `sub_tenant_id` in the payload scopes the invoice to a sub-tenant of the calling tenant (anti-IDOR enforced server-side). |
| `scell_get_invoice` | Retrieve invoice details by ID |
| `scell_list_invoices` | List all invoices with filtering and pagination |
| `scell_download_invoice` | Download invoice as PDF or XML |

### Electronic Signatures

| Tool | Description |
|------|-------------|
| `scell_create_signature` | Create a new signature request. Optional `sub_tenant_id` in the payload scopes the request to a sub-tenant of the calling tenant (anti-IDOR enforced server-side). **v2.17.0:** supports multi-document bundles via the optional `attachments[]` array (max 10 PJ, 20 Mo cumulated) — signature positions, mentions and initials positions can target a specific document via `documentIndex` (0 = main document, 1..N = attachment N). **v2.27.0:** each signature position accepts an optional `signerIndex` (0-based, mapped to `signer_index`) to assign it to a specific signer; the EU-SES API allows multiple positions per signer (N entries sharing the same `signerIndex`). |
| `scell_get_signature` | Get signature request status and details |
| `scell_list_signatures` | List signature requests (`GET /api/v1/signatures`, tenant-scoped via the API key). Filters: `status`, `environment`, `sub_tenant_id`, `page`, `per_page`. The legacy `company_id` filter was removed in the 2026-05-11 backend refonte (`api_keys.company_id` dropped). |
| `scell_tenant_list_signatures` | **v2.7.0** List signatures for the whole tenant via URL-nested `GET /api/v1/tenant/signatures`. Auth: `sk_*`. Filters: `status`, `environment`, `page`, `per_page`. |
| `scell_tenant_get_signature` | **v2.7.0** Get a single tenant-scoped signature via `GET /api/v1/tenant/signatures/{id}`. Auth: `sk_*`. |
| `scell_subtenant_list_signatures` | **v2.7.0** List signatures of one sub-tenant via `GET /api/v1/tenant/sub-tenants/{subTenantId}/signatures`. Auth: `sk_*`. Anti-IDOR. |
| `scell_subtenant_get_signature` | **v2.7.0** Get a single sub-tenant signature via `GET /api/v1/tenant/sub-tenants/{subTenantId}/signatures/{id}`. Auth: `sk_*`. |
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

### Sub-Tenant Lifecycle (master tenant `sk_*` or Bearer required)

These tools manage existing sub-tenants of the calling tenant. They are scoped strictly to the caller (anti-IDOR — `403` if the `id` does not belong to the API key's tenant).

| Tool | Description |
|------|-------------|
| `scell_get_subtenant_status` | Get the cached SuperPDP onboarding status for a sub-tenant |
| `scell_refresh_subtenant_status` | Force a fresh poll of SuperPDP (rate-limited 1/min). **Returns `422 MISSING_ACCESS_TOKEN` + `authorize_url` if the sub-tenant never granted access (or the token expired). The LLM should present that URL to the user, or call `scell_start_subtenant_superpdp_authorize` to obtain a fresh one.** |
| `scell_start_subtenant_superpdp_authorize` | **v2.9.0** Start a SuperPDP OAuth2 flow for an existing sub-tenant whose access token is missing. `POST /api/v1/tenant/sub-tenants/{id}/superpdp-authorize` → `{ authorize_url, state }`. |
| `scell_resume_url` | Regenerate a 7-day signed resume URL for a sub-tenant whose onboarding is not yet `active` |
| `scell_delete_sub_tenant` | **v2.9.0** Delete a sub-tenant via `DELETE /api/v1/tenant/sub-tenants/{id}`. Optional `cascade: boolean` to drop attached Companies atomically. Returns `{ message, companies_deleted }` on success. Possible 422 codes the LLM should surface clearly: `SUB_TENANT_HAS_COMPANIES` (retry with `cascade=true` after user confirmation) and `SUB_TENANT_HAS_FISCAL_ENTRIES` (refusal — ISCA compliance, no force flag; propose to mark inactive instead). |
| `scell_disconnect_subtenant_superpdp` | **v3.1.0** Disconnect a sub-tenant from SuperPDP via `POST /api/v1/tenant/sub-tenants/{id}/superpdp-disconnect`. Revokes the SuperPDP tokens and resets `onboarding_status` to `pending_superpdp`. Already-issued invoices stay immutable (ISCA); future B2B invoices fall back to paper mode until reconnection. Returns the updated sub-tenant summary. |
| `scell_reconnect_subtenant_superpdp` | **v3.1.0** Reconnect a sub-tenant to SuperPDP via `POST /api/v1/tenant/sub-tenants/{id}/superpdp-reconnect`. Equivalent to a disconnect followed by a fresh `authorize_url` in a single call → `{ authorize_url, state }`. Present that URL to the user to re-grant access. |
| `scell_mint_subtenant_widget_token` | **v3.1.0** Mint a signed widget token via `POST /api/v1/tenant/sub-tenants/{id}/superpdp-widget-token`. Returns a signed, single-sub-tenant-scoped URL (24h TTL, anti-IDOR HMAC) for the `<scell-onboarding mode="superpdp" resume-token="...">` web component. Optional `reset: boolean` disconnects the sub-tenant before minting the token. |

### Payment Schedule Tools (since v2.13.0)

These tools manage the échéancier de paiement attached to an accepted quote. An échéancier is a contractual payment plan composed of lines (percent or fixed amount, by due date or milestone text). Lines are immutable once the quote is signed (`accepted`).

| Tool | Description |
|------|-------------|
| `scell_set_quote_payment_schedule` | **Create or replace** the full payment schedule of a quote atomically. `POST /api/v1/quotes/{id}/payment-schedule` with `{ lines: PaymentScheduleLineInput[] }`. Blocked if the quote is accepted/converted/cancelled. Returns the full list of `PaymentScheduleLine[]`. |
| `scell_patch_quote_payment_schedule` | **Partial update** — add, update, or remove schedule lines in a single atomic call. `PATCH /api/v1/quotes/{id}/payment-schedule` with `{ add?, update?, remove? }`. Only `pending` lines can be updated or removed. |
| `scell_delete_quote_payment_schedule` | **Delete all lines** from a quote's schedule. `DELETE /api/v1/quotes/{id}/payment-schedule`. Only allowed when the quote is in `draft` or `sent` status (no line is `invoiced`). |
| `scell_get_quote_payment_summary` | **Real-time tracker** of invoiced vs. remaining amounts for a quote with an échéancier. `GET /api/v1/quotes/{id}/payment-summary`. Returns `PaymentSummary` with gross/net invoiced, remaining TTC %, overdue lines, and SuperPDP enrichment per invoice. |
| `scell_convert_quote_schedule_line_to_deposit` | **Convert a specific pending line** into a deposit invoice. `POST /api/v1/quotes/{id}/payment-schedule/lines/{line_id}/convert`. Optional overrides: `due_date`, `label`, `send_email` (auto-validates and sends). Returns `Invoice` with `invoice_type='deposit'`. |
| `scell_list_payment_schedule_presets` | **List preset schedules** (e.g. 30/70, 50/50, 30/30/40, 3 monthly instalments). `GET /api/v1/payment-schedule/presets`. Returns `PaymentSchedulePreset[]` with ready-to-use `lines` arrays. Suggest these to users before they create a custom schedule. |

### Invoice Email Tool (since v2.13.0)

| Tool | Description |
|------|-------------|
| `scell_send_invoice_by_email` | **Send an invoice to the buyer by email.** `POST /api/v1/invoices/{id}/send-by-email`. Optional overrides: `recipient_email`, `cc[]`, `message`. If the invoice is `draft`, it is automatically validated before sending (equivalent to a `draft → validated` transition). The recipient is resolved in cascade: explicit override → `buyer_billing_email` snapshot → `buyer_email` snapshot → quote buyer email → **422 `BUYER_HAS_NO_EMAIL`** if none. Returns `InvoiceSendByEmailResult` with `sent_to`, `sent_at`, `message_id`, `cc`. |

### Branding Tools

Email branding lets tenants and sub-tenants customize the logo, primary color, email footer, and signature on all outbound **emails** (invoice delivery, reminders, signature requests). When all required fields (`brand_logo_url`, `brand_primary_color`, `brand_email_footer`) are set, the tenant's / sub-tenant's branding replaces the Scell.io default; otherwise the default branding is used as fallback. Each tool targets the master tenant by default, OR a sub-tenant when `sub_tenant_id` is provided (anti-IDOR — must belong to the caller).

**Important:** `brand_logo_url` is distinct from `logo_url` (the Factur-X PDF logo, managed via invoice templates or `Company.logo_url`). `brand_primary_color` must be `#RRGGBB` (6-digit hex, validated server-side).

| Tool | Description |
|------|-------------|
| `scell_get_branding` | Get the current email branding. `GET /api/v1/branding/tenant` (no `sub_tenant_id`) OR `GET /api/v1/branding/sub-tenants/{id}`. Returns `Branding` with `is_complete` flag, `missing_fields[]`, `brand_email_enabled` (boolean — `false` = emails sent with the default channel branding) and `computed_email_footer` (string\|null, **read-only** — footer computed from the company identity, used at render time when `brand_email_footer` is empty). |
| `scell_update_branding` | Update email branding fields. `PUT /api/v1/branding/tenant` OR `PUT /api/v1/branding/sub-tenants/{id}` with any subset of `{ brand_logo_url, brand_primary_color, brand_email_footer, brand_email_signature, brand_email_enabled }`. Pass `null` to clear a nullable field. Returns the updated `Branding`. |
| `scell_upload_branding_logo` | Get a pre-signed S3 PUT URL for the branding logo (PNG/JPEG). `POST /api/v1/branding/tenant/logo-upload-url` OR `.../sub-tenants/{id}/logo-upload-url` with `{ mime_type }`. Returns `{ url, public_url, expires_at, headers }` — PUT the file to `url`, then call `scell_update_branding` with `brand_logo_url = public_url`. **Direct multipart alternative:** `POST /api/v1/branding/tenant/logo` OR `POST /api/v1/branding/sub-tenants/{id}/logo` with a multipart field `logo` (jpeg/png/webp/svg/svgz, max 2 MB) — returns the flat `Branding` object directly. |
| `scell_preview_branding` | Render a live preview of the branded email **before any send**. `GET /api/v1/branding/tenant/preview` OR `.../sub-tenants/{id}/preview`. The `Accept` header negotiates the format: `text/html` (default — ideal for an `<iframe srcdoc>` UI preview) or `application/pdf`. Optional **non-persisted** query overrides: `brand_primary_color` (`#RRGGBB`), `brand_email_footer`, `brand_email_signature`, `brand_logo_url`. Use after `scell_update_branding` / `scell_upload_branding_logo` so the user can visually confirm logo, color, footer and signature. |

### Document Preview & Template Colors (since v3.2.0)

| Tool | Description |
|------|-------------|
| `scell_preview_document` | Render a live HTML preview of a draft document (invoice, credit note or quote) using the **real** template, branding and legal mentions of the issuing company — nothing is persisted. `POST /api/v1/documents/preview`. Body: `type` (`'invoice' \| 'credit_note' \| 'quote'`, required), `document_number?`, `buyer?`, `lines?` (max 200, `[{description, quantity, unit_price, tax_rate}]`), `issue_date?`, `due_date?` (`YYYY-MM-DD`), `currency?` (ISO 4217), `notes?`, `payment_terms?` (≤2000 chars each). Auth: `sk_*`. Returns raw `text/html` (`Cache-Control: no-store`). 422 on validation error. |
| `scell_derive_template_colors_from_logo` | Extract the dominant primary/accent colors from the tenant's email branding logo (`brand_logo_url`) and apply them to the tenant's default invoice template (created on the fly if missing). `POST /api/v1/invoice-templates/derive-colors-from-email-logo`. No body. Auth: `sk_*`. Returns `{ data: InvoiceTemplate }`. 404 if no email logo is configured; 422 if the logo is unreachable or only has neutral colors. |

> **Invoice templates `is_enabled` (since v3.2.0):** `InvoiceTemplate` now carries `is_enabled` (boolean, default `true`). When `false`, the template is skipped by the resolution cascade and the system template is used instead — set it via `scell_create_invoice_template` / `scell_update_invoice_template`.

### Recurring Invoices (since v2.32.0)

A recurring invoice is an *abonnement*: a template invoice + a recurrence rule. On each due date Scell.io generates one occurrence — a real invoice billed to the buyer. `emission_mode='auto_send'` submits each occurrence to the PDP (PEPPOL / SuperPDP) **and** emails the buyer; `emission_mode='draft'` (default) creates a draft for human review. The schedule runs until the recurrence end is reached (`end_mode`), or it is paused/cancelled. Tenant-scoped (anti-IDOR); already generated occurrences are immutable on the ISCA ledger.

| Tool | Description |
|------|-------------|
| `scell_list_recurring_invoices` | List recurring invoice schedules. `GET /api/v1/recurring-invoices`. Filters: `status` (`active`/`paused`/`completed`/`cancelled`), `sub_tenant_id`, `page`, `per_page`. |
| `scell_get_recurring_invoice` | Retrieve a schedule by UUID. `GET /api/v1/recurring-invoices/{id}`. |
| `scell_create_recurring_invoice` | Create a schedule. `POST /api/v1/recurring-invoices`. Body: `title`, buyer (`buyer_id` or inline), `lines[]`, `recurrence` (`interval_unit`/`interval_count`/`day_of_month`/`day_of_week`), `start_date`, `end_mode` (`never`/`on_date`/`after_occurrences`), `emission_mode` (`draft`/`auto_send`). **Clarify the recurrence end with the user; `day_of_month=31` clamps to the last day of short months; each occurrence bills the buyer.** |
| `scell_update_recurring_invoice` | Partial update. `PUT /api/v1/recurring-invoices/{id}`. Affects future occurrences only. |
| `scell_delete_recurring_invoice` | Delete a schedule. `DELETE /api/v1/recurring-invoices/{id}`. |
| `scell_pause_recurring_invoice` | Suspend an active schedule. `POST /api/v1/recurring-invoices/{id}/pause`. |
| `scell_activate_recurring_invoice` | Resume a paused schedule. `POST /api/v1/recurring-invoices/{id}/activate`. |
| `scell_cancel_recurring_invoice` | Terminal cancellation. `POST /api/v1/recurring-invoices/{id}/cancel`. |
| `scell_run_recurring_invoice_now` | Trigger an off-cycle occurrence immediately. `POST /api/v1/recurring-invoices/{id}/run-now`. **With `auto_send` this bills the buyer right away.** |

### Product Catalog (since v2.35.0)

A reusable catalog of products/services (label, unit price, default VAT rate, unit…), scoped strictly by `(tenant_id, sub_tenant_id)` — same scoping policy as the buyers registry. Reference a product via `productId` on an invoice/quote **line** to pre-fill it; mutating a product never alters previously emitted invoices (snapshot, ISCA). Products can be grouped into categories.

| Tool | Description |
|------|-------------|
| `scell_list_products` | List catalog products. `GET /api/v1/products`. Filters: `q`, `revenue_category` (`goods`/`service`/`accommodation`), `product_category_id`, `is_active`, `sub_tenant_id`, `page`, `per_page`. Returns `PaginatedResult<Product>`. |
| `scell_get_product` | Retrieve a product by UUID. `GET /api/v1/products/{id}`. 404 outside caller scope (anti-IDOR). |
| `scell_create_product` | Create a catalog product. `POST /api/v1/products`. Body: `name` (required), `unit_price_ht` (required), `product_category_id?`, `description?`, `sku?`, `revenue_category?`, `unit?` (default `C62`), `default_tax_rate?`, `default_discount_rate?`, `currency?` (default `EUR`), `is_active?`, `sub_tenant_id?`, `metadata?`, `notes?`. Returns `Product` (201). |
| `scell_update_product` | Partial update. `PATCH /api/v1/products/{id}` (full `PUT` also accepted). Does NOT propagate to issued invoices (ISCA). |
| `scell_delete_product` | Delete a product. `DELETE /api/v1/products/{id}`. Historic invoice snapshots remain intact. Returns 204. |
| `scell_list_product_categories` | List categories. `GET /api/v1/product-categories`. Filters: `q`, `sub_tenant_id`, `page`, `per_page`. Returns `PaginatedResult<ProductCategory>`. |
| `scell_get_product_category` | Retrieve a category by UUID. `GET /api/v1/product-categories/{id}`. |
| `scell_create_product_category` | Create a category. `POST /api/v1/product-categories`. Body: `name` (required), `color?` (`#RRGGBB`), `description?`, `position?`, `sub_tenant_id?`, `metadata?`. Returns `ProductCategory` (201). |
| `scell_update_product_category` | Partial update. `PATCH /api/v1/product-categories/{id}` (full `PUT` also accepted). |
| `scell_delete_product_category` | Delete a category. `DELETE /api/v1/product-categories/{id}`. Returns 204. |

**Invoice/quote line catalog fields** (since v2.35.0, optional): `productId` (pre-fills the line from a product → `product_id`), `saveToCatalog` (upsert the line as a product → `save_to_catalog`), `productCategoryId` (file the saved product under a category → `product_category_id`).

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

#### Multi-document signature (since v2.17.0)

```typescript
// Bundle a contract + 2 annexes in a single signature request.
// The backend merges them into a single signable PDF before submission.
const input: SignatureInput = {
  title: 'Contrat de prestation + annexes',
  document: mainContractBase64,
  document_name: 'contrat.pdf',
  attachments: [
    { document: annexAPdfBase64, documentName: 'annexe-A.pdf' },
    { document: annexBPdfBase64, documentName: 'annexe-B.pdf' },
  ],
  signers: [
    { first_name: 'Jean', last_name: 'Dupont',
      email: 'jean.dupont@example.com', auth_method: 'email' },
  ],
  signature_positions: [
    // Signature on the main contract (last page)
    { documentIndex: 0, page: 3, x: 10, y: 80, unit: 'percent' },
    // Signature on the second annex (Annex B)
    { documentIndex: 2, page: 1, x: 10, y: 80, unit: 'percent' },
  ],
};
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
  SignatureAttachment,
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
