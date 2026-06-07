/**
 * Scell.io MCP Client Type Definitions
 */

// Re-export VAT context types (since 2.19.0)
export type {
  VatCategory,
  VatResolution,
  LineVatContext,
  VatContextRequest,
  VatContextResponse,
} from './vat.js';

// Re-export country company reference types (since 2.29.0)
export type {
  CountryReference,
  CountryVatInfo,
  CountryNationalIdInfo,
  LegalForm,
} from './reference.js';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Main configuration for Scell MCP client
 */
export interface ScellMcpConfig {
  /** Your Scell.io API key */
  apiKey: string;
  /** Base URL for the API (defaults to https://api.scell.io/api) */
  baseUrl?: string;
  /** Environment: production, staging, or development */
  environment?: 'production' | 'staging' | 'development';
  /** Use sandbox environment (defaults to false) */
  sandbox?: boolean;
}

/**
 * MCP Server configuration structure
 */
export interface McpServerConfig {
  /** Command to execute the MCP server */
  command: string;
  /** Arguments to pass to the command */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Full MCP configuration for different clients
 */
export interface McpClientConfig {
  mcpServers: {
    scell: McpServerConfig;
  };
}

// ============================================================================
// Invoice Types
// ============================================================================

/**
 * Company information for invoices.
 *
 * For B2C buyers (private individuals), set `isIndividual: true` on the
 * `buyer` of an InvoiceInput. SIRET / vatNumber / legal_id then become
 * optional and Factur-X / UBL / CII generation omits BT-46/BT-47/BT-48
 * (BR-CO-26 EN16931 compliant).
 */
export interface Company {
  /** Company name (or full name for B2C buyer) */
  name: string;
  /** SIRET number (14 digits) — required only for French B2B companies */
  siret?: string;
  /** VAT number (e.g. FR12345678901 or BE0123456789) — B2B only */
  vatNumber?: string;
  /** Legal identifier for non-EU companies (e.g. EIN, CRN) — B2B only */
  legal_id?: string;
  /** Legal identifier scheme (e.g. "US:EIN", "GB:CRN") — B2B only */
  legal_id_scheme?: string;
  /** Street address */
  address: string;
  /** Postal code */
  postalCode: string;
  /** City */
  city: string;
  /** Country code (ISO 3166-1 alpha-2) */
  country: string;
  /** Contact email */
  email?: string;
  /** Contact phone */
  phone?: string;
  /**
   * B2C flag : set to true on the `buyer` if it is a private individual.
   * Default: false (B2B). Has no effect on the `seller`.
   */
  isIndividual?: boolean;
}

/**
 * Invoice line item
 *
 * @since 2.19.0 — `vatRate` is optional when `category` is provided.
 * The MCP server (via `scell_create_invoice`) will call
 * `POST /api/v1/tenant/buyers/vat-context` automatically for each line
 * where `category` is present and `vatRate` is absent, and fill in the
 * resolved rate + `metadata.exemption_reason` before forwarding the
 * request to the backend.
 *
 * When both `vatRate` **and** `category` are provided, the explicit
 * `vatRate` is respected as-is; `category` is still sent for Factur-X
 * EN16931 tax node generation but no auto-resolution call is made.
 */
export interface InvoiceLine {
  /** Line description */
  description: string;
  /** Quantity */
  quantity: number;
  /** Unit price (excluding tax) */
  unitPrice: number;
  /**
   * VAT rate (percentage, e.g., 20 for 20%).
   *
   * **Optional since 2.19.0** — can be omitted when `category` is provided.
   * In that case, the tool auto-resolves the rate from the buyer's country
   * and VAT number via `scell_resolve_vat_context` before creating the invoice.
   * If omitted and `category` is also absent, the backend defaults to 20 %.
   */
  vatRate?: number;
  /**
   * VAT category hint for auto-resolution (since 2.19.0).
   *
   * When provided without `vatRate`, the MCP layer calls
   * `POST /api/v1/tenant/buyers/vat-context` and populates `vatRate`
   * automatically. Example: `'STANDARD'` for a domestic service, or
   * `'REVERSE_CHARGE'` when you know the buyer is a B2B EU entity.
   *
   * See `VatCategory` for all allowed values.
   */
  category?: import('./vat.js').VatCategory;
  /**
   * Supply nature (since 2.32.0). DISCRIMINATES the intra-EU/export exemption:
   * `'goods'` → `INTRACOM_GOODS` (K) / `EXPORT` (G); `'services'` →
   * `REVERSE_CHARGE` (AE) / `OUT_OF_SCOPE` (O). Defaults to `services`.
   * Forwarded as `supply_type`.
   */
  supplyType?: 'goods' | 'services';
  /**
   * ISO 3166-1 alpha-2 place of supply (art. 259-A CGI override, since 2.32.0).
   * Forwarded as `place_of_supply`.
   */
  placeOfSupply?: string;
  /**
   * Justification to keep a divergent tax rate (since 2.32.0). Avoids the
   * `409 VAT_CORRECTION_REQUIRED` and records the choice for the audit trail.
   * Forwarded as `vat_override_reason` (max 500 chars).
   */
  vatOverrideReason?: string;
  /** Unit of measure (optional) */
  unit?: string;
  /** Product/service code (optional) */
  productCode?: string;
  /**
   * Pre-fill this line from a catalog product (since 2.35.0). The server copies
   * the product's label, unit price and default VAT rate; values provided on
   * this line override them. Forwarded as `product_id`.
   */
  productId?: string;
  /**
   * Save this line as a catalog product (server-side upsert, since 2.35.0).
   * Forwarded as `save_to_catalog`.
   */
  saveToCatalog?: boolean;
  /**
   * File the product saved via `saveToCatalog` under this catalog category
   * (since 2.35.0). Forwarded as `product_category_id`.
   */
  productCategoryId?: string;
}

/**
 * Input for creating an invoice
 */
export interface InvoiceInput {
  /** Invoice number */
  invoiceNumber: string;
  /** Invoice date (ISO 8601 format) */
  invoiceDate: string;
  /** Due date (ISO 8601 format) */
  dueDate: string;
  /** Seller/supplier information */
  seller: Company;
  /** Buyer/customer information (omit when `buyerId` references the registry) */
  buyer?: Company;
  /**
   * Reference to an existing Buyer in the registry (scoped tenant + sub_tenant).
   * When provided, the API snapshots the registry's current state onto the
   * invoice; the inline `buyer` field becomes optional. Mutating the
   * registry later does NOT change this invoice (ISCA immutability).
   */
  buyerId?: string;
  /**
   * Optional shipping address (Factur-X BG-13 / BT-71..80). When omitted
   * or identical to the buyer's billing address, the API does not emit
   * BG-13 in the XML (EN16931 ship=bill presumption). The optional `name`
   * (BT-74) identifies the destination site (e.g. "Entrepot Lyon").
   */
  buyerShippingAddress?: ShippingAddress;
  /** Invoice line items */
  lines: InvoiceLine[];
  /** Currency code (ISO 4217, defaults to EUR) */
  currency?: string;
  /** Invoice format: factur-x, ubl, or cii */
  format?: 'factur-x' | 'ubl' | 'cii';
  /** Additional notes */
  notes?: string;
  /** Purchase order reference */
  purchaseOrderRef?: string;
  /** Payment terms */
  paymentTerms?: string;
  /**
   * B2C flag : true if the buyer is a private individual.
   *
   * When true, buyer.siret / vatNumber / legal_id are NOT required.
   * Equivalent to setting `buyer.isIndividual = true`.
   *
   * Factur-X / UBL / CII generation omits BT-46/BT-47/BT-48 (BR-CO-26).
   * Default: false (B2B).
   */
  buyerIsIndividual?: boolean;
  /**
   * Optional sub-tenant scoping (UUID).
   *
   * Replaces the legacy `api_keys.company_id` binding (removed in the
   * 2026-05-11 backend refonte). Pass `sub_tenant_id` in the payload to
   * attribute the invoice to a sub-tenant of the calling tenant.
   *
   * Anti-IDOR: the API returns 403 if the sub-tenant does not belong to
   * the tenant resolved from the `X-API-Key` header.
   *
   * Available since `@scell/mcp-client` v2.8.0.
   */
  sub_tenant_id?: string;
  /**
   * Invoice type: standard (default), deposit (acompte) or balance (solde).
   *
   * - `'standard'` (default): regular invoice, optionally linked to a
   *   source quote via `parentQuoteId` for traceability (since v2.20.0).
   * - `'deposit'`: partial-payment invoice — typically generated from a
   *   quote via `scell_convert_quote_to_deposit`.
   * - `'balance'`: final settlement invoice — typically generated from a
   *   quote via `scell_convert_quote_to_balance`.
   *
   * When omitted, the backend defaults to `'standard'`.
   *
   * Available since `@scell/mcp-client` v2.20.0.
   */
  invoiceType?: 'standard' | 'deposit' | 'balance';
  /**
   * Optional UUID of a source quote — links the invoice to a quote for
   * traceability. Only valid for `invoiceType === 'standard'` invoices.
   *
   * For `'deposit'` / `'balance'` invoices, use the dedicated conversion
   * tools (`scell_convert_quote_to_deposit` / `scell_convert_quote_to_balance`)
   * which set `parent_quote_id` automatically.
   *
   * Anti-IDOR: the API returns 403 if the quote does not belong to the
   * tenant resolved from the `X-API-Key` header.
   *
   * Available since `@scell/mcp-client` v2.20.0.
   */
  parentQuoteId?: string;
}

/**
 * Shipping address (Factur-X BG-13). Same fields as a billing address plus
 * an optional `name` (BT-74) identifying the destination site.
 */
export interface ShippingAddress {
  /** BT-74 ship-to name (e.g. "Entrepot Lyon"). Optional. */
  name?: string;
  /** Street address (BT-75) */
  line1: string;
  /** Address complement (BT-76) */
  line2?: string;
  /** Postal code (BT-78) */
  postalCode: string;
  /** City (BT-77) */
  city: string;
  /** Country subdivision / region (BT-79) */
  region?: string;
  /** Country code ISO 3166-1 alpha-2 (BT-80) */
  country: string;
}

/**
 * Buyer entry from the registry. Reusable across invoices via `buyerId`.
 * Shape mirrors backend Buyer model. Mutations do NOT propagate to issued
 * invoices (snapshot pattern, ISCA immutability).
 */
export interface Buyer {
  id: string;
  tenantId: string;
  subTenantId: string | null;
  name: string;
  isIndividual: boolean;
  siret: string | null;
  vatNumber: string | null;
  legalId: string | null;
  legalIdScheme: string | null;
  email: string | null;
  phone: string | null;
  country: string;
  /** Required billing address. */
  billingAddress: {
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    region?: string;
    country: string;
  };
  /** Optional shipping address (BG-13). */
  shippingAddress?: ShippingAddress | null;
  hasDistinctShippingAddress: boolean;
  metadata?: Record<string, unknown> | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating/updating a Buyer registry entry.
 */
export interface BuyerInput {
  name: string;
  country: string;
  billingAddress: Buyer['billingAddress'];
  isIndividual?: boolean;
  siret?: string;
  vatNumber?: string;
  legalId?: string;
  legalIdScheme?: string;
  email?: string;
  phone?: string;
  shippingAddress?: ShippingAddress;
  metadata?: Record<string, unknown>;
  notes?: string;
}

/**
 * Supplier entry from the registry (since v2.26.0). Reusable supplier /
 * vendor profile, scoped strictly by (tenant_id, sub_tenant_id) — a tenant
 * NEVER sees another tenant's suppliers, a sub-tenant only sees its own.
 * Shape mirrors the backend Supplier model. Unlike Buyer, a Supplier has
 * NO shipping address and NO VAT-context resolution (suppliers are the
 * issuing party of incoming invoices, not a delivery destination).
 */
export interface Supplier {
  id: string;
  tenantId: string;
  subTenantId: string | null;
  name: string;
  isIndividual: boolean;
  siret: string | null;
  vatNumber: string | null;
  legalId: string | null;
  legalIdScheme: string | null;
  email: string | null;
  phone: string | null;
  country: string;
  /** Required billing address. */
  billingAddress: {
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    region?: string;
    country: string;
  };
  metadata?: Record<string, unknown> | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for updating a Supplier's contact metadata (since v2.26.0).
 *
 * **Breaking change in v3.x**: creation and deletion of suppliers via API
 * are no longer supported (POST/DELETE return 405). Suppliers are derived
 * from received invoices — the invoice is the source of truth. Only the
 * contact enrichment fields below remain editable via PATCH.
 */
export interface SupplierInput {
  email?: string;
  phone?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Catalog product/service category (since v2.35.0). Groups reusable products,
 * scoped strictly by (tenant_id, sub_tenant_id) — same scoping policy as the
 * buyers / suppliers registries.
 */
export interface ProductCategory {
  id: string;
  tenantId: string;
  subTenantId: string | null;
  name: string;
  /** Hex color (#RRGGBB) for UI badges, or null. */
  color: string | null;
  description: string | null;
  /** Display order (ascending). */
  position: number;
  /** Number of products filed under this category (when returned by the API). */
  productsCount?: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating/updating a product category (since v2.35.0).
 */
export interface ProductCategoryInput {
  name: string;
  color?: string;
  description?: string;
  position?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Catalog product/service (since v2.35.0). Reusable article (label, unit price,
 * default VAT rate, unit…) scoped strictly by (tenant_id, sub_tenant_id) — same
 * scoping policy as the buyers registry. Reference a product via `productId` on
 * an invoice/quote line to pre-fill it. Like a Buyer, the catalog carries the
 * *current* state of the article — mutating a product does NOT alter previously
 * emitted invoices (snapshot, ISCA compliance).
 */
export interface Product {
  id: string;
  tenantId: string;
  subTenantId: string | null;
  productCategoryId: string | null;
  name: string;
  description: string | null;
  /** Stock-keeping unit / internal reference. */
  sku: string | null;
  /** Fiscal revenue category, or null if unspecified. */
  revenueCategory: 'goods' | 'service' | 'accommodation' | null;
  /** Human-readable label for `revenueCategory` (server-derived). */
  revenueCategoryLabel: string | null;
  /** UN/ECE Rec 20 unit code (default `C62`). */
  unit: string;
  /** Unit price excluding tax. */
  unitPriceHt: number;
  /** Default VAT rate (percentage, e.g. 20). */
  defaultTaxRate: number;
  /** Default per-line discount rate (percentage), or null. */
  defaultDiscountRate: number | null;
  /** ISO 4217 currency code (default `EUR`). */
  currency: string;
  isActive: boolean;
  /** Nested category (eager-loaded) when returned by the API. */
  productCategory?: ProductCategory | null;
  metadata?: Record<string, unknown> | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating/updating a catalog product (since v2.35.0).
 */
export interface ProductInput {
  name: string;
  unitPriceHt: number;
  productCategoryId?: string;
  description?: string;
  sku?: string;
  revenueCategory?: 'goods' | 'service' | 'accommodation';
  /** UN/ECE Rec 20 unit code (default `C62`). */
  unit?: string;
  defaultTaxRate?: number;
  defaultDiscountRate?: number;
  /** ISO 4217 currency code (default `EUR`). */
  currency?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  notes?: string;
}

/**
 * Invoice lifecycle status (since v2.21.0).
 *
 * Aligned with the PostgreSQL `invoices.status` CHECK constraint on the
 * Scell.io backend. The values cover the full invoice lifecycle from
 * draft through emission, transmission (SuperPDP / PEPPOL), payment,
 * disputes and refunds.
 *
 * | Status | Description |
 * |---|---|
 * | `draft` | Invoice is being edited, not yet validated. |
 * | `validating` | Backend is locking the fiscal sequence + numbering. |
 * | `validated` | Issued (immutable on the ISCA ledger). |
 * | `converting` | Factur-X / UBL / CII XML+PDF generation in progress. |
 * | `converted` | XML+PDF artefacts produced and stored on S3. |
 * | `transmitting` | Submission to SuperPDP / PEPPOL in progress. |
 * | `transmitted` | Successfully accepted by the recipient platform. |
 * | `accepted` | Buyer (or their PDP) has acknowledged the invoice. |
 * | `rejected` | Recipient platform rejected the invoice. |
 * | `disputed` | Buyer flagged a litigation (manual workflow). |
 * | `paid` | Marked as paid (manual `scell_mark_invoice_paid` or auto). |
 * | `received` | Incoming invoice received from a counterparty. |
 * | `completed` | Final state — no further transitions expected. |
 * | `error` | Terminal failure (transmission / generation error). |
 * | `refunded` | A credit note has fully credited this invoice. Set by `CreditNoteObserver` when `total_refunded ≥ total_including_tax`. |
 * | `partially_refunded` | A credit note has partially credited this invoice. Set by `CreditNoteObserver` when `0 < total_refunded < total_including_tax`. |
 */
export type InvoiceStatus =
  | 'draft'
  | 'validating'
  | 'validated'
  | 'converting'
  | 'converted'
  | 'transmitting'
  | 'transmitted'
  | 'accepted'
  | 'rejected'
  | 'disputed'
  | 'paid'
  | 'received'
  | 'completed'
  | 'error'
  | 'refunded'
  | 'partially_refunded';

/**
 * Refund coverage of an invoice (since v2.21.0).
 *
 * Computed by the backend from the sum of validated credit notes
 * targeting the invoice, compared to `totalIncludingTax`.
 *
 * - `'none'` — no validated credit note (`total_refunded === 0`).
 * - `'partial'` — `0 < total_refunded < totalIncludingTax`. Pairs with
 *   `status='partially_refunded'`.
 * - `'full'` — `total_refunded >= totalIncludingTax`. Pairs with
 *   `status='refunded'`.
 */
export type RefundStatus = 'none' | 'partial' | 'full';

/**
 * Created invoice response
 */
export interface Invoice {
  /** Unique invoice ID */
  id: string;
  /** Invoice number */
  invoiceNumber: string;
  /**
   * Invoice lifecycle status. The union was extended in v2.21.0 to match
   * the backend PostgreSQL CHECK constraint: 16 values covering the full
   * lifecycle (draft → validated → transmitted → paid) plus
   * refund-driven states (`refunded`, `partially_refunded`) auto-set by
   * the backend `CreditNoteObserver` when validated credit notes target
   * this invoice. See {@link InvoiceStatus} for the exhaustive list.
   */
  status: InvoiceStatus;
  /** Total amount excluding tax */
  totalExcludingTax: number;
  /** Total VAT amount */
  totalVat: number;
  /** Total amount including tax */
  totalIncludingTax: number;
  /** Currency code */
  currency: string;
  /** Format used */
  format: string;
  /** Download URL for the invoice */
  downloadUrl?: string;
  /** Payment timestamp */
  paidAt?: string;
  /** Payment reference */
  paymentReference?: string;
  /** Payment notes */
  paymentNote?: string;
  /**
   * Payment means code (UN/ECE 4461) — Factur-X EN16931 BT-81. Set by
   * `scell_mark_invoice_paid` (required on the mark-paid endpoint since
   * v2.25.0 / backend 2026-05-27). Surfaces the actual collection method
   * on the paid invoice. Defaults to `null` while the invoice has not yet
   * been marked paid.
   *
   * @since 2.25.0
   */
  paymentMeansCode?: PaymentMeansCode | null;
  /**
   * Optional free-text label associated with `paymentMeansCode` (Factur-X
   * BT-82). Useful when the standard code label is ambiguous (e.g. account
   * holder name, bank reference, custom mention). Max 100 chars enforced
   * server-side. Defaults to `null` if not provided when marking paid.
   *
   * @since 2.25.0
   */
  paymentMeansText?: string | null;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /**
   * Number of credit notes issued against this invoice (partial or total).
   * Available since v1.12.0 (API 2026-05-04).
   */
  creditNotesCount?: number;
  /**
   * Total amount credited (sum of validated credit notes).
   * Compare to totalIncludingTax to detect full credit.
   * Available since v1.12.0.
   */
  creditedAmount?: number;
  /**
   * Aggregated refund coverage of the invoice (since v2.21.0). Computed by
   * the backend from `total_refunded` vs `total_including_tax`:
   * - `'none'` — no validated credit note targets this invoice.
   * - `'partial'` — at least one credit note exists, but `total_refunded`
   *   is strictly less than `totalIncludingTax`. Pairs with
   *   `status='partially_refunded'`.
   * - `'full'` — `total_refunded >= totalIncludingTax`. Pairs with
   *   `status='refunded'`.
   *
   * Read-only — set by `CreditNoteObserver` on credit note validation.
   * Available since v2.21.0.
   */
  refundStatus?: RefundStatus;
  /**
   * Total amount refunded via validated credit notes (since v2.21.0). Sum
   * of `totalIncludingTax` of every credit note in a creditable status
   * targeting this invoice. Always `0` when `refundStatus === 'none'`.
   *
   * Read-only — set by `CreditNoteObserver` on credit note validation.
   * Available since v2.21.0.
   */
  totalRefunded?: number;
  /**
   * Invoice type: standard (default), deposit (acompte) or balance (solde).
   * Deposit and balance invoices are created from an accepted quote via
   * `scell_convert_quote_to_deposit` / `scell_convert_quote_to_balance`,
   * or directly with `scell_create_invoice` by setting this field.
   * Available since v2.11.0.
   */
  invoiceType?: 'standard' | 'deposit' | 'balance';
  /**
   * UUID of the parent quote when this invoice was generated from a quote
   * (deposit or balance). Null for standalone invoices.
   * Available since v2.11.0.
   */
  parentQuoteId?: string | null;
  /**
   * List of deposit invoice IDs that this balance invoice consolidates.
   * Populated on `invoice_type === 'balance'` invoices only.
   * Available since v2.11.0.
   */
  parentInvoiceIds?: string[] | null;
}

// ============================================================================
// Quote Types (since 2.11.0)
// ============================================================================

/**
 * Quote (devis) status lifecycle.
 *
 * Aligned with the backend `App\Enums\Quote\QuoteStatus` (8 values) since
 * v2.22.0.
 *
 * ```
 * DRAFT → SENT → VIEWED → ACCEPTED → CONVERTED  (after deposit/balance invoices)
 *                       ↘ REFUSED
 *                       ↘ EXPIRED  (passed validity_date without decision)
 * DRAFT | SENT | VIEWED → CANCELLED
 * ```
 *
 * - `draft` — Editing, not yet sent to the buyer.
 * - `sent` — Public link emitted, awaiting buyer action.
 * - `viewed` — Buyer opened the public viewer at least once.
 * - `accepted` — Buyer signed; quote is now binding.
 * - `refused` — Buyer refused with a reason string.
 * - `expired` — `validity_date` passed without buyer decision.
 * - `converted` — At least one invoice (deposit or balance) was generated.
 * - `cancelled` — Tenant cancelled (with mandatory reason) before acceptance.
 */
export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'refused'
  | 'expired'
  | 'converted'
  | 'cancelled';

/**
 * A single line item of a quote. Mirrors InvoiceLine but belongs to
 * a Quote document. Unit price and VAT rate are stored at creation
 * time; mutations update these fields (blocked once quote is accepted).
 */
export interface QuoteLine {
  /** Unique line ID */
  id: string;
  /** Line description */
  description: string;
  /** Quantity */
  quantity: number;
  /** Unit price (excluding tax) */
  unitPrice: number;
  /** VAT rate (percentage, e.g. 20 for 20%) */
  vatRate: number;
  /** Optional unit of measure */
  unit?: string | null;
  /** Optional product / service code */
  productCode?: string | null;
  /** Line total excluding tax */
  totalExcludingTax: number;
  /** Line VAT amount */
  vatAmount: number;
  /** Line total including tax */
  totalIncludingTax: number;
}

/**
 * Deposit schedule item attached to a quote.
 * Defines the breakdown of expected partial payments before the balance.
 */
export interface QuoteDepositScheduleItem {
  /**
   * Deposit amount as a percentage of the quote total (0–100, exclusive).
   * Exactly one of `percent` or `amount` must be set.
   */
  percent?: number;
  /**
   * Fixed deposit amount in the quote currency.
   * Exactly one of `percent` or `amount` must be set.
   */
  amount?: number;
  /** Due date for this deposit (ISO 8601) */
  dueDate?: string | null;
  /** Label shown on the deposit invoice */
  label?: string | null;
}

/**
 * Signature evidence attached to a quote after the buyer signs it.
 * Provides legal traceability for accepted quotes.
 */
export interface QuoteSignature {
  /** Signature timestamp (ISO 8601 UTC) */
  signedAt: string;
  /** IP address of the signing party */
  ipAddress: string | null;
  /** User-agent of the signing browser */
  userAgent: string | null;
  /** Full name provided by the signer */
  signerName: string | null;
  /** Email address of the signer */
  signerEmail: string | null;
  /** SVG or base64-encoded canvas representation of the drawn signature */
  signatureData?: string | null;
}

/**
 * A single audit log entry for a quote.
 * Records every state transition, update, and access event.
 * The SHA-256 `chainHash` chains entries to the previous one,
 * providing tamper-evident history (legal proof for accepted quotes).
 */
export interface QuoteAuditEntry {
  id: string;
  /** Event code (e.g. "created", "sent", "accepted", "updated") */
  event: string;
  /** Actor type: system (server automation) or user */
  actorType: 'system' | 'user';
  /** Actor user ID (null for system events) */
  actorId: string | null;
  /** Actor display name or email */
  actorLabel: string | null;
  /** Changed fields snapshot (null for events with no field changes) */
  changes: Record<string, unknown> | null;
  /** SHA-256 hash of this entry chained to the previous entry */
  chainHash: string;
  /** Chain hash of the previous entry (null for first entry) */
  previousChainHash: string | null;
  /** IP address of the actor (null for system events) */
  ipAddress: string | null;
  /** Timestamp of the event (ISO 8601 UTC) */
  createdAt: string;
}

/**
 * Cryptographic sealing evidence attached to a signed quote (since v2.33.0).
 *
 * Once a quote is accepted/signed, Scell.io seals the resulting PDF with a
 * PAdES (PDF Advanced Electronic Signatures) signature and anchors its
 * SHA-256 hash on the Bitcoin blockchain via OpenTimestamps. This provides
 * independently verifiable, tamper-evident proof of existence and integrity
 * for the signed document.
 */
export interface QuoteSealing {
  /** Whether the quote's signed PDF has been sealed (PAdES + Bitcoin anchoring) */
  is_sealed: boolean;
  /** Timestamp the PAdES signature was applied (ISO 8601), null if not sealed */
  pades_signed_at: string | null;
  /** SHA-256 hex digest of the signed PDF — the value anchored on Bitcoin, null if not sealed */
  signed_pdf_sha256: string | null;
  /** OpenTimestamps anchoring status: pending (submitted), confirmed (Bitcoin block), or failed */
  ots_status: 'pending' | 'confirmed' | 'failed' | null;
  /** Timestamp the hash was submitted to OpenTimestamps calendars (ISO 8601) */
  ots_submitted_at: string | null;
  /** Timestamp the Bitcoin anchoring was confirmed (ISO 8601), null while pending */
  ots_bitcoin_confirmed_at: string | null;
  /** Bitcoin block height containing the anchor, null while pending */
  bitcoin_block_height: number | null;
  /** OpenTimestamps receipt (.ots proof) encoded in base64, null if not sealed */
  ots_proof_base64: string | null;
}

/**
 * Quote (devis) response object.
 *
 * A quote is a pre-invoice commercial offer. Once accepted, it can be
 * converted to deposit invoices (`invoice_type=deposit`) and a final
 * balance invoice (`invoice_type=balance`). The conversion preserves
 * buyer / seller snapshots and line items for legal traceability.
 *
 * Once signed, the quote's PDF is sealed with PAdES and anchored on the
 * Bitcoin blockchain via OpenTimestamps; see the `sealing` field.
 *
 * Anti-IDOR: the API scopes all quote operations to the tenant (and
 * optional sub-tenant) resolved from the `X-API-Key` header.
 */
export interface Quote {
  /** Unique quote UUID */
  id: string;
  /** Human-readable quote number (server-generated, e.g. "DEV-2026-0042") */
  quoteNumber: string;
  /** Quote status */
  status: QuoteStatus;
  /** Quote issue date (ISO 8601) */
  issueDate: string;
  /** Validity date after which the quote expires if not accepted (ISO 8601) */
  validityDate: string | null;
  /** Whether the buyer must provide an eIDAS EU-SES signature to accept */
  signatureRequired: boolean;
  /** Seller company snapshot */
  seller: Company;
  /** Buyer company snapshot (null if buyerId was used at creation) */
  buyer: Company | null;
  /** UUID of the buyer registry entry (if set at creation) */
  buyerId: string | null;
  /** Line items */
  lines: QuoteLine[];
  /** Optional shipping address (same schema as InvoiceInput) */
  buyerShippingAddress?: ShippingAddress | null;
  /** Currency (ISO 4217, e.g. "EUR") */
  currency: string;
  /** Notes / free-text comment */
  notes: string | null;
  /** Purchase order reference */
  purchaseOrderRef: string | null;
  /** Payment terms */
  paymentTerms: string | null;
  /** Deposit schedule (one entry per expected partial payment) */
  depositSchedule: QuoteDepositScheduleItem[];
  /** Sub-tenant UUID (null for master-tenant quotes) */
  subTenantId: string | null;
  /** Signature evidence when the buyer has accepted via EU-SES */
  signature: QuoteSignature | null;
  /**
   * Cryptographic sealing evidence (PAdES + Bitcoin/OpenTimestamps anchoring).
   * Present once the quote is signed; absent/undefined on unsigned quotes.
   */
  sealing?: QuoteSealing;
  /** Public signed URL for the buyer to view / accept the quote (90-day TTL) */
  publicUrl: string | null;
  /**
   * Callback URL set at creation. After the buyer accepts or refuses
   * via the public viewer, they are redirected here with query string
   * `?status=signed|refused&quote_id=...&quote_number=...&reason=...`.
   * `null` means the buyer lands on the default Scell.io confirmation page.
   */
  callbackUrl: string | null;
  /** Total amount excluding tax */
  totalExcludingTax: number;
  /** Total VAT amount */
  totalVat: number;
  /** Total amount including tax */
  totalIncludingTax: number;
  /** List of invoice IDs generated from this quote (deposits + balance) */
  invoiceIds: string[];
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Input for creating a new quote.
 *
 * Same buyer / seller / lines shape as `InvoiceInput`. The server
 * auto-generates `quoteNumber`. Buyer can be provided inline or via
 * `buyerId` referencing the registry (snapshot semantics identical to
 * invoices — mutations to the registry entry do NOT affect the quote).
 */
export interface CreateQuoteInput {
  /** Quote issue date (ISO 8601). Defaults to today if omitted. */
  issueDate?: string;
  /** Validity date (ISO 8601). After this date the quote is considered expired. */
  validityDate?: string;
  /** Seller company info (resolved from tenant profile if omitted) */
  seller?: Company;
  /** Buyer company info (required unless buyerId is provided) */
  buyer?: Company;
  /**
   * UUID of an existing Buyer registry entry (scoped tenant + sub_tenant).
   * When provided, the API snapshots the current buyer data onto the quote.
   */
  buyerId?: string;
  /** Optional shipping address (Factur-X BG-13 shape) */
  buyerShippingAddress?: ShippingAddress;
  /**
   * B2C flag. When true, buyer.siret / vatNumber / legal_id are optional.
   */
  buyerIsIndividual?: boolean;
  /** Line items (minimum 1) */
  lines: InvoiceLine[];
  /** Currency (ISO 4217, defaults to EUR) */
  currency?: string;
  /** Optional free-text notes */
  notes?: string;
  /** Purchase order reference */
  purchaseOrderRef?: string;
  /** Payment terms text */
  paymentTerms?: string;
  /**
   * Whether the buyer must provide an eIDAS EU-SES signature to accept
   * the quote. Defaults to false.
   */
  signatureRequired?: boolean;
  /**
   * Deposit schedule: breakdown of expected partial payments before balance.
   * Each entry specifies a percent XOR amount + optional dueDate + label.
   */
  depositSchedule?: QuoteDepositScheduleItem[];
  /**
   * Optional sub-tenant scoping (UUID).
   * Anti-IDOR: 403 if the sub-tenant does not belong to the API key's tenant.
   */
  sub_tenant_id?: string;
  /**
   * Callback URL invoked by the signature viewer after the buyer
   * accepts or refuses the quote. The buyer is redirected to this URL
   * via full page navigation with query string:
   *   `?status=signed|refused&quote_id=<UUID>&quote_number=<num>&reason=<text>`
   *
   * Use case: capture the buyer in your own post-signature flow
   * (thank-you page, client dashboard, automation trigger). When
   * omitted, the buyer lands on the default Scell.io confirmation page.
   *
   * Format: absolute HTTPS URL, max 500 chars.
   */
  callbackUrl?: string;
}

/**
 * Input for updating an existing quote (partial update supported).
 * Blocked if the quote is in `accepted`, `converted`, or `cancelled` status.
 */
export interface UpdateQuoteInput {
  /** New validity date */
  validityDate?: string;
  /** Replace all line items */
  lines?: InvoiceLine[];
  /** Update notes */
  notes?: string;
  /** Update purchase order reference */
  purchaseOrderRef?: string;
  /** Update payment terms */
  paymentTerms?: string;
  /** Update deposit schedule */
  depositSchedule?: QuoteDepositScheduleItem[];
  /** Update signature_required flag (only in draft) */
  signatureRequired?: boolean;
  /** Update buyer info (only in draft) */
  buyer?: Company;
  /** Update buyerId (only in draft) */
  buyerId?: string;
  /**
   * Update the callback URL (only while the quote is not yet signed).
   * Pass `null` to clear the callback and revert to the default
   * Scell.io confirmation page. See `CreateQuoteInput.callbackUrl`.
   */
  callbackUrl?: string | null;
}

/**
 * Input for converting an accepted quote into a deposit invoice.
 *
 * At least one of `percent` or `amount` is required. Multiple calls
 * are allowed on the same quote — each call creates a new deposit
 * invoice. The balance invoice can only be created once all deposits
 * are set.
 */
export interface ConvertToDepositInput {
  /**
   * Deposit amount as a percentage of the quote total (0–100, exclusive).
   * Exactly one of `percent` or `amount` must be set.
   */
  percent?: number;
  /**
   * Fixed deposit amount in the quote currency.
   * Exactly one of `percent` or `amount` must be set.
   */
  amount?: number;
  /** Label shown on the deposit invoice (e.g. "Acompte 1 – 30%") */
  label?: string;
  /** Due date for the deposit invoice (ISO 8601) */
  dueDate?: string;
}

/**
 * Input for converting an accepted quote into the final balance invoice.
 *
 * The balance amount is computed automatically as:
 *   quote.totalIncludingTax − sum(deposit invoices amounts)
 *
 * Returns a single Invoice with `invoice_type === 'balance'` and
 * `parent_invoice_ids` referencing all previously created deposits.
 */
export interface ConvertToBalanceInput {
  /** Due date for the balance invoice (ISO 8601) */
  dueDate?: string;
  /** Label override (defaults to "Solde – [quoteNumber]") */
  label?: string;
}

// ============================================================================
// Credit Note Types
// ============================================================================

/**
 * Credit note status.
 *
 * Backend canonical values (`credit_notes.status` CHECK constraint, since v2.22.0):
 * - `'draft'` — Editing, not yet validated.
 * - `'sent'` — Issued (immutable on the ISCA ledger). Triggers
 *   `CreditNoteObserver` to compute `Invoice.refund_status` / `total_refunded`.
 *
 * The `'cancelled'` value is preserved in the union for backwards compatibility
 * with SDK consumers ≤ v2.21.0 but is **not** a valid backend state.
 *
 * @see CreditNoteType
 */
export type CreditNoteStatus = 'draft' | 'sent' | 'cancelled';

/**
 * Credit note type — partial vs total credit against the parent invoice.
 *
 * Aligned with the backend `credit_notes.type` CHECK constraint since v2.22.0.
 *
 * - `'partial'` — credit only a subset of the invoice lines or a reduced amount.
 *   Pairs with `Invoice.refund_status='partial'` on the parent invoice once
 *   the credit note transitions to `status='sent'`.
 * - `'total'` — credit the full invoice. Pairs with `Invoice.refund_status='full'`
 *   and `Invoice.status='refunded'`.
 */
export type CreditNoteType = 'partial' | 'total';

/**
 * Credit note line item
 */
export interface CreditNoteLine {
  /** Line description */
  description: string;
  /** Quantity */
  quantity: number;
  /** Unit price (excluding tax) */
  unitPrice: number;
  /** Tax rate (percentage) */
  taxRate: number;
  /** Total amount */
  total: number;
}

/**
 * Input for creating a credit note
 */
export interface CreditNoteInput {
  /** Invoice ID to credit */
  invoiceId: string;
  /** Reason for the credit note */
  reason: string;
  /** Credit note type */
  type: 'partial' | 'total';
  /** Items to credit (for partial credit notes) */
  items?: Array<{
    invoiceLineId: string;
    quantity?: number;
  }>;
}

/**
 * Credit note response
 */
export interface CreditNote {
  /** Unique credit note ID */
  id: string;
  /** Credit note number */
  creditNoteNumber: string;
  /** Associated invoice ID */
  invoiceId: string;
  /** Credit note status */
  status: CreditNoteStatus;
  /** Credit note type */
  type: 'partial' | 'total';
  /** Reason for the credit note */
  reason: string;
  /** Subtotal amount */
  subtotal: number;
  /** Tax amount */
  taxAmount: number;
  /** Total amount */
  total: number;
  /** Currency code */
  currency: string;
  /** Issue date */
  issueDate: string;
  /**
   * Payment means code (UN/ECE 4461) — Factur-X EN16931 BT-81. Same
   * semantics as `Invoice.paymentMeansCode`: reflects the actual
   * collection / reimbursement method when the credit note is marked
   * paid (refund issued to the buyer). `null` while not yet marked paid.
   *
   * @since 2.25.0
   */
  paymentMeansCode?: PaymentMeansCode | null;
  /**
   * Optional free-text label associated with `paymentMeansCode` (Factur-X
   * BT-82). Max 100 chars enforced server-side. `null` when omitted.
   *
   * @since 2.25.0
   */
  paymentMeansText?: string | null;
  /** Line items */
  items?: CreditNoteLine[];
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Environnement applicatif (couleur de la cle API).
 * Utilise dans les reponses normalisees pour distinguer prod / sandbox.
 */
export type Environment = 'production' | 'sandbox';

// ============================================================================
// Signature Types — eIDAS EU-SES (Simple Electronic Signature)
// Aligne sur le contrat backend StoreSignatureRequest (Scell.io API v1).
// Scell.io ne propose QUE EU-SES (pas AES/QES). Pour ces niveaux superieurs,
// contactez l'equipe Scell.io.
// ============================================================================

/**
 * Methode d'authentification du signataire (envoi du code OTP).
 */
export type SignerAuthMethod = 'email' | 'sms' | 'both';

/**
 * Statut applicatif d'un signataire.
 */
export type SignerStatus = 'pending' | 'signed' | 'refused';

/**
 * Statut applicatif d'une demande de signature.
 */
export type SignatureStatus =
  | 'pending'
  | 'waiting_signers'
  | 'partially_signed'
  | 'completed'
  | 'refused'
  | 'expired'
  | 'error';

/**
 * Mode de saisie de la signature.
 */
export type SignatureMode = 'typed' | 'drawn' | 'both';

/**
 * Unite des coordonnees d'une zone de signature.
 *  - `'percent'` (defaut) : valeurs 0-100, relatives a la page.
 *  - `'pixel'`            : valeurs absolues en pixels @72dpi.
 */
export type SignaturePositionUnit = 'percent' | 'pixel';

/**
 * Champs modifiables par le signataire sur ses propres donnees.
 */
export interface SignerEditableData {
  /** Autoriser le signataire a modifier son nom complet. */
  name?: boolean;
  /** Autoriser le signataire a modifier son numero de mobile. */
  mobile?: boolean;
  /** Autoriser le signataire a modifier son email. */
  email?: boolean;
}

/**
 * Comportement non-UI de la page de signature.
 */
export interface SignatureOptions {
  /** Mode de saisie. `'both'` laisse le signataire choisir. */
  signature_mode?: SignatureMode;
  /** Force le signataire a parcourir tout le document avant de signer. */
  signer_must_read?: boolean;
  /** Champs que le signataire peut modifier sur ses propres donnees. */
  user_editable_data?: SignerEditableData;
  /** Identifiant IANA (ex: `'Europe/Paris'`). */
  timezone?: string;
}

/**
 * Personnalisation visuelle de la page de signature (white-label).
 * 21 champs alignés sur la spec EU-SES certifiée. Les couleurs
 * sont en hexadecimal `#RRGGBB`. Si non fourni, le backend applique le
 * branding par defaut Scell.io.
 */
export interface SignatureUIConfig {
  // Sidebar
  sidebar_logo?: string;
  sidebar_background_color?: string;
  sidebar_title_color?: string;
  sidebar_text_color?: string;

  // Header
  header_background_color?: string;
  header_title_color?: string;
  header_subtitle_color?: string;

  // Footer
  footer_background_color?: string;

  // Boutons standards
  button_text_color?: string;
  button_text_color_hover?: string;
  button_background_color?: string;
  button_background_color_hover?: string;

  // Bouton "Signer" (override des boutons standards)
  sign_button_text_color?: string;
  sign_button_text_color_hover?: string;
  sign_button_background_color?: string;
  sign_button_background_color_hover?: string;

  // Toggles d'affichage
  hide_sidebar?: boolean;
  hide_header?: boolean;
  hide_download_validated?: boolean;
  hide_download_signed?: boolean;

  /**
   * Domaines autorises a embarquer la page de signature en iframe (max 20).
   * Le backend injecte automatiquement `https://sign.scell.io` en plus.
   */
  iframe_ancestors?: string[];
}

/**
 * Position d'une zone de signature visuelle sur le document.
 *
 * ## Affectation a un signataire precis (`signerIndex`, depuis v2.27.0)
 *
 * Par defaut, une position non rattachee s'applique au flux de signature
 * global. Le champ optionnel `signerIndex` (0-base) permet de l'affecter a
 * un signataire precis du tableau `SignatureInput.signers` :
 *
 * - `signerIndex: 0` → premier signataire (`signers[0]`)
 * - `signerIndex: 1` → deuxieme signataire (`signers[1]`)
 * - absent           → position commune / flux global (comportement legacy)
 *
 * L'API EU-SES autorise **plusieurs positions de signature pour un meme
 * signataire** : il suffit de fournir N entrees `SignaturePosition` portant
 * le meme `signerIndex` (eventuellement sur des pages ou documents
 * differents via `documentIndex`).
 *
 * @example
 * ```typescript
 * // Deux signataires, le premier signe page 1 ET page 3
 * signature_positions: [
 *   { signerIndex: 0, page: 1, x: 10, y: 80 },
 *   { signerIndex: 0, page: 3, x: 10, y: 80 }, // 2e position pour signers[0]
 *   { signerIndex: 1, page: 1, x: 60, y: 80 },
 * ]
 * ```
 */
export interface SignaturePosition {
  /**
   * Index du document cible (0 = principal, 1..N = attachments dans
   * l'ordre du tableau `SignatureInput.attachments`).
   *
   * Defaut : `0` (document principal). Utilise uniquement quand le
   * payload contient des `attachments`. Valeurs acceptees : `0..10`.
   *
   * Le MCP server consuming this client config mappe ce champ vers
   * `document_index` (snake_case) avant POST `/api/v1/signatures`.
   *
   * @since v2.17.0
   */
  documentIndex?: number;
  /**
   * Index (0-base) du signataire auquel cette position est affectee, dans
   * l'ordre du tableau `SignatureInput.signers` (0 = premier signataire).
   *
   * Si absent, la position s'applique au flux de signature global
   * (comportement legacy). Plusieurs positions peuvent partager le meme
   * `signerIndex` : l'API EU-SES accepte **N positions par signataire**
   * (par ex. sur plusieurs pages ou documents).
   *
   * Le MCP server consuming this client config mappe ce champ vers
   * `signer_index` (snake_case) avant POST `/api/v1/signatures`.
   *
   * @since v2.27.0
   */
  signerIndex?: number;
  /** Numero de page (1-indexe). */
  page: number;
  /** Coordonnee X. Unite definie par `unit`. */
  x: number;
  /** Coordonnee Y. Unite definie par `unit`. */
  y: number;
  /** Largeur de la zone (optionnel). */
  width?: number;
  /** Hauteur de la zone (optionnel). */
  height?: number;
  /** Unite des coordonnees. Defaut : `'percent'`. */
  unit?: SignaturePositionUnit;
  /**
   * Largeur de la page en px @72dpi. Si absent : detection auto via
   * parser PDF cote backend, fallback A4 (595).
   */
  page_width_px?: number;
  /**
   * Hauteur de la page en px @72dpi. Si absent : detection auto via
   * parser PDF cote backend, fallback A4 (842).
   */
  page_height_px?: number;
}

/**
 * Position d'un bloc paraphe sur une page specifique.
 *
 * Utilise dans le champ `positions[]` d'`InitialsBlock` pour definir une
 * position differente par page. Format recommande : il prend le dessus sur
 * les champs legacy `position` + `pages` si fourni.
 *
 * - `page`   : numero de page 1-indexe (1–500). Obligatoire.
 * - `x`, `y` : coordonnees dans l'unite definie par `unit`.
 * - `unit`   : `'percent'` (defaut, 0–100 relatif a la page) ou `'pixel'`.
 * - `pageWidthPx` / `pageHeightPx` : dimensions de la page @72dpi ;
 *   si absentes, le backend detecte via le parser PDF (fallback A4 595×842).
 * - `fontSize`, `color`, `bold` : overrides visuels par page.
 *
 * Exemple — paraphe en bas a gauche de la page 1, en bas a droite page 2 :
 * ```json
 * [
 *   { "page": 1, "x": 5,  "y": 90, "unit": "percent" },
 *   { "page": 2, "x": 85, "y": 90, "unit": "percent" }
 * ]
 * ```
 *
 * Correspond a `initials_block.positions[]` (snake_case) dans l'API REST.
 * Le MCP client expose les champs en camelCase (LLM-friendly).
 *
 * @since v2.16.0
 */
export interface InitialsPosition {
  /**
   * Index du document cible (0 = principal, 1..N = attachments dans
   * l'ordre du tableau `SignatureInput.attachments`).
   *
   * Defaut : `0` (document principal). Utilise uniquement quand le
   * payload contient des `attachments`. Valeurs acceptees : `0..10`.
   *
   * Le MCP server consuming this client config mappe ce champ vers
   * `document_index` (snake_case) avant POST `/api/v1/signatures`.
   *
   * @since v2.17.0
   */
  documentIndex?: number;
  /**
   * Numero de page (1-indexe, 1–500). Obligatoire.
   */
  page: number;
  /**
   * Coordonnee X dans l'unite definie par `unit`.
   * Pour `'percent'` : 0–100 (relatif a la largeur de la page).
   * Pour `'pixel'`   : valeur absolue @72dpi (0–5000).
   */
  x: number;
  /**
   * Coordonnee Y dans l'unite definie par `unit`.
   * Pour `'percent'` : 0–100 (relatif a la hauteur de la page).
   * Pour `'pixel'`   : valeur absolue @72dpi (0–5000).
   */
  y: number;
  /**
   * Unite des coordonnees. Defaut : `'percent'`.
   * - `'percent'` : coordonnees relatives, indépendantes de la resolution.
   * - `'pixel'`   : coordonnees absolues @72dpi (necessite pageWidthPx/pageHeightPx).
   */
  unit?: 'percent' | 'pixel';
  /**
   * Largeur de la page en px @72dpi. Recommande pour `unit='pixel'`.
   * Si absent : detection auto via parser PDF cote backend, fallback A4 (595px).
   */
  pageWidthPx?: number;
  /**
   * Hauteur de la page en px @72dpi. Recommande pour `unit='pixel'`.
   * Si absent : detection auto via parser PDF cote backend, fallback A4 (842px).
   */
  pageHeightPx?: number;
  /**
   * Override de la taille de police pour cette page specifique (6–20 px).
   * Si absent, utilise la valeur du champ `fontSize` de l'`InitialsBlock` parent.
   */
  fontSize?: number;
  /**
   * Override de la couleur du texte pour cette page specifique (`#RRGGBB`).
   * Si absent, utilise la valeur du champ `color` de l'`InitialsBlock` parent.
   */
  color?: string;
  /**
   * Override du style gras pour cette page specifique.
   * Si absent, utilise la valeur du champ `bold` de l'`InitialsBlock` parent.
   */
  bold?: boolean;
}

/**
 * Bloc paraphe (initiales) automatique appose sur les pages intermediaires.
 *
 * Quand `enabled` est `true`, Scell.io insère automatiquement les initiales
 * du signataire sur chaque page couverte via son infrastructure de signature
 * certifiée.
 *
 * ## Deux formats possibles (rétrocompatibles)
 *
 * ### Format recommande : `positions[]` (depuis v2.16.0)
 * Permet de definir une position differente par page. Prend le dessus sur
 * les champs legacy `position` + `pages` si fourni.
 *
 * ```json
 * {
 *   "enabled": true,
 *   "positions": [
 *     { "page": 1, "x": 5,  "y": 90, "unit": "percent" },
 *     { "page": 2, "x": 85, "y": 90, "unit": "percent" },
 *     { "page": 3, "x": 5,  "y": 90, "unit": "percent", "fontSize": 10, "color": "#CC0000" }
 *   ]
 * }
 * ```
 *
 * ### Format legacy : `position` + `pages`
 * Une seule position appliquee a toutes les pages listees.
 *
 * ```json
 * {
 *   "enabled": true,
 *   "pages": "except_last",
 *   "position": { "x": 5, "y": 90, "unit": "percent" }
 * }
 * ```
 *
 * Correspond au champ `initials_block` (snake_case) de l'API REST.
 * Le MCP client expose les champs en camelCase (LLM-friendly).
 */
export interface InitialsBlock {
  /** Active le bloc paraphe. Defaut : `false`. */
  enabled?: boolean;
  /**
   * Mode de generation des initiales.
   * - `'auto'` (defaut) : initiales derivees du nom du signataire.
   * - `'custom'`        : texte libre fourni via `customText`.
   */
  mode?: 'auto' | 'custom';
  /**
   * Source du texte des initiales (utilise si `mode === 'auto'`).
   * - `'signer_name'` (defaut) : ex. "J.D." pour "John Doe".
   * - `'custom'`               : texte fourni via `customText`.
   */
  source?: 'signer_name' | 'custom';
  /** Texte custom des initiales (max 8 caracteres). Utilise si `source === 'custom'`. */
  customText?: string;
  /**
   * Pages sur lesquelles apposer les initiales (format legacy).
   * Ignore si `positions[]` est fourni.
   * - `'all'`         (defaut) : toutes les pages.
   * - `'except_last'`          : toutes sauf la derniere (souvent deja couverte par la signature).
   * - `number[]`               : liste de numeros de pages (1-indexes).
   */
  pages?: 'all' | 'except_last' | number[];
  /**
   * Position commune du bloc paraphe (format legacy).
   * Ignoree si `positions[]` est fourni. Coordonnees relatives a la page.
   */
  position?: {
    /** Coordonnee X. Unite definie par `unit`. */
    x: number;
    /** Coordonnee Y. Unite definie par `unit`. */
    y: number;
    /** Unite des coordonnees. Defaut : `'percent'`. */
    unit?: 'percent' | 'pixel';
  };
  /**
   * Positions differentes par page (format recommande depuis v2.16.0).
   * Si fourni, prend le dessus sur les champs `position` + `pages`.
   * Chaque entree definit la position de l'initiale sur une page specifique.
   * Les pages non listees ne recevront PAS de paraphe.
   *
   * @since v2.16.0
   */
  positions?: InitialsPosition[];
  /** Taille de la police globale (px, 6–20). Defaut backend applique si absent. */
  fontSize?: number;
  /** Couleur du texte en hexadecimal `#RRGGBB`. Defaut : noir. */
  color?: string;
  /**
   * Style gras pour les initiales. Defaut : `false`.
   * Peut etre override individuellement dans chaque entree de `positions[]`.
   *
   * @since v2.16.0
   */
  bold?: boolean;
}

/**
 * Mention libre apposee sur le document, a remplir par le signataire
 * (ex: "Lu et approuve", case a cocher, champ de texte libre).
 *
 * Correspond au champ `mentions` (array snake_case) de l'API REST.
 * Le MCP client expose les champs en camelCase (LLM-friendly).
 */
export interface Mention {
  /** Libelle de la mention (ex: "Lu et approuve"). */
  label: string;
  /** La mention doit-elle etre saisie obligatoirement ? Defaut : `false`. */
  required?: boolean;
  /**
   * Index (0-base) du signataire auquel cette mention est adressee.
   * Si absent, la mention est commune a tous les signataires.
   */
  signerIndex?: number;
  /** Position de la mention sur la page. */
  position: {
    /**
     * Index du document cible (0 = principal, 1..N = attachments dans
     * l'ordre du tableau `SignatureInput.attachments`).
     *
     * Defaut : `0` (document principal). Utilise uniquement quand le
     * payload contient des `attachments`. Valeurs acceptees : `0..10`.
     *
     * Le MCP server consuming this client config mappe ce champ vers
     * `document_index` (snake_case) avant POST `/api/v1/signatures`.
     *
     * @since v2.17.0
     */
    documentIndex?: number;
    /** Numero de page (1-indexe). */
    page: number;
    /** Coordonnee X. */
    x: number;
    /** Coordonnee Y. */
    y: number;
    /** Largeur de la zone (optionnel). */
    w?: number;
    /** Hauteur de la zone (optionnel). */
    h?: number;
    /** Unite des coordonnees. Defaut : `'percent'`. */
    unit?: 'percent' | 'pixel';
  };
  /** Texte pre-rempli si le signataire ne saisit rien (optionnel). */
  fallbackText?: string;
  /** Taille de la police (px). */
  fontSize?: number;
  /** Couleur du texte en hexadecimal `#RRGGBB`. */
  color?: string;
}

/**
 * Bloc de date automatique appose sur le document au moment de la signature.
 *
 * Correspond au champ `date_block` (snake_case) de l'API REST.
 * Le MCP client expose les champs en camelCase (LLM-friendly).
 */
export interface DateBlock {
  /** Active le bloc de date. Defaut : `false`. */
  enabled?: boolean;
  /**
   * Format de date (compatible moment.js / dayjs).
   * Ex: `'DD/MM/YYYY'`, `'YYYY-MM-DD'`, `'Do MMMM YYYY'`.
   * Defaut backend si absent.
   */
  format?: string;
  /** Fuseau horaire IANA (ex: `'Europe/Paris'`). Defaut : `'UTC'`. */
  timezone?: string;
  /** Position du bloc de date sur le document. */
  position?: {
    /**
     * Numero de page (1-indexe) ou `'last'` pour la derniere page.
     */
    page: number | 'last';
    /** Coordonnee X. */
    x: number;
    /** Coordonnee Y. */
    y: number;
    /** Unite des coordonnees. Defaut : `'percent'`. */
    unit?: 'percent' | 'pixel';
  };
  /** Taille de la police (px). */
  fontSize?: number;
  /** Couleur du texte en hexadecimal `#RRGGBB`. */
  color?: string;
}

/**
 * Definition d'un signataire pour la creation.
 */
export interface SignerInput {
  first_name: string;
  last_name: string;
  /** Requis si `phone` n'est pas fourni. */
  email?: string;
  /** Requis si `email` n'est pas fourni. Format E.164 (+33...). */
  phone?: string;
  /** Methode d'envoi de l'OTP. */
  auth_method: SignerAuthMethod;
  /** Ordre de signature pour le mode sequentiel (1, 2, 3...). */
  order?: number;
  /**
   * Message custom envoye au signataire (max 500 chars).
   * Supporte le placeholder `{OTP}` qui sera remplace par le code OTP.
   */
  message?: string;
}

/**
 * Forme normalisee d'un signataire dans une reponse API.
 */
export interface Signer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  auth_method: SignerAuthMethod;
  status: SignerStatus;
  signing_url: string | null;
  signed_at: string | null;
  refused_at: string | null;
}

/**
 * Document attache (PJ) en plus du document principal d'une demande
 * de signature EU-SES.
 *
 * Le backend Scell.io merge automatiquement le document principal
 * (`SignatureInput.document`) et tous les `attachments` en un seul PDF
 * avant submission a l'autorite de signature partenaire. Les positions
 * de signature, paraphes et mentions peuvent cibler un document via
 * le champ `documentIndex` :
 *
 * - `documentIndex: 0` → document principal (defaut)
 * - `documentIndex: N` → `attachments[N - 1]` (1-indexed sur les PJ)
 *
 * ## Limites backend
 *
 * - Maximum **10 attachments** par demande.
 * - Maximum **20 Mo cumules** (principal + PJ).
 * - Chaque attachment doit etre un PDF valide encode en base64.
 *
 * Correspond au champ `attachments` (array snake_case) de l'API REST.
 *
 * @example
 * ```typescript
 * const input: SignatureInput = {
 *   title: 'Contrat + annexes',
 *   document: mainContractBase64,
 *   document_name: 'contrat.pdf',
 *   attachments: [
 *     { document: annexAPdfBase64, documentName: 'annexe-A.pdf' },
 *     { document: annexBPdfBase64, documentName: 'annexe-B.pdf' },
 *   ],
 *   signers: [ ... ],
 *   signature_positions: [
 *     { documentIndex: 0, page: 1, x: 10, y: 80 }, // sur le contrat
 *     { documentIndex: 2, page: 1, x: 10, y: 80 }, // sur annexe-B
 *   ],
 * };
 * ```
 *
 * @since v2.17.0
 */
export interface SignatureAttachment {
  /** Contenu du document attache encode en base64. */
  document: string;
  /**
   * Nom de fichier (avec extension `.pdf`).
   *
   * Le MCP server consuming this client config mappe ce champ vers
   * `document_name` (snake_case) avant POST `/api/v1/signatures`.
   */
  documentName: string;
}

/**
 * Input pour la creation d'une demande de signature EU-SES.
 *
 * Tous les champs `ui_config` et `signature_options` sont optionnels.
 * Si non fournis, le backend Scell.io applique son branding et ses defauts.
 */
export interface SignatureInput {
  /** Reference externe (votre ID metier). Optionnel. */
  external_id?: string;
  /** Titre du document (apparait dans l'email + UI). */
  title: string;
  /** Description optionnelle. */
  description?: string;
  /** Document a signer, encode en base64. */
  document: string;
  /** Nom du fichier (ex: `'contrat.pdf'`). */
  document_name: string;
  /**
   * Documents attaches (PJ) — facultatif.
   *
   * Le backend merge automatiquement le document principal (`document`)
   * et tous les `attachments` en un seul PDF avant submission a
   * l'autorite de signature partenaire. Les `signature_positions`,
   * `initialsBlock.positions` et `mentions[].position` peuvent cibler
   * un document specifique via leur champ `documentIndex` :
   *
   * - `documentIndex: 0` → document principal (defaut)
   * - `documentIndex: N` → `attachments[N - 1]`
   *
   * Limites : **10 attachments max**, **20 Mo cumules** (principal + PJ).
   *
   * @example
   * ```typescript
   * attachments: [
   *   { document: annexAPdfBase64, documentName: 'annexe-A.pdf' },
   *   { document: annexBPdfBase64, documentName: 'annexe-B.pdf' },
   * ]
   * ```
   *
   * @since v2.17.0
   */
  attachments?: SignatureAttachment[];
  /** Liste de 1 a 10 signataires. */
  signers: SignerInput[];
  /**
   * Positions visuelles des zones de signature.
   *
   * Chaque entree peut etre affectee a un signataire precis via son champ
   * optionnel `signerIndex` (0-base, aligne sur l'ordre de `signers`). Un
   * meme signataire peut recevoir **plusieurs positions** (N entrees avec
   * le meme `signerIndex`). Si `signerIndex` est absent, la position
   * s'applique au flux global (comportement legacy).
   */
  signature_positions?: SignaturePosition[];
  /** White-label UI (21 champs). Defaut: branding Scell.io. */
  ui_config?: SignatureUIConfig;
  /** Comportement non-UI (mode, lecture forcee, timezone, editabilite). */
  signature_options?: SignatureOptions;
  /** URL de redirection apres completion (apres signature reussie). */
  redirect_complete_url?: string;
  /** URL de redirection apres annulation par le signataire. */
  redirect_cancel_url?: string;
  /** Date d'expiration ISO 8601. Defaut: J+30. */
  expires_at?: string;
  /** Active l'archivage 10 ans (eIDAS). */
  archive_enabled?: boolean;
  /**
   * Optional sub-tenant scoping (UUID).
   *
   * Replaces the legacy `api_keys.company_id` binding (removed in the
   * 2026-05-11 backend refonte). Pass `sub_tenant_id` in the payload to
   * attribute the signature request to a sub-tenant of the calling tenant.
   *
   * Anti-IDOR: the API returns 403 if the sub-tenant does not belong to
   * the tenant resolved from the `X-API-Key` header.
   *
   * Available since `@scell/mcp-client` v2.8.0.
   */
  sub_tenant_id?: string;
  /**
   * Bloc paraphe (initiales) automatique sur les pages intermediaires.
   *
   * Mapped to `initials_block` (snake_case) before the REST API call.
   * Available since `@scell/mcp-client` v2.11.0.
   */
  initialsBlock?: InitialsBlock;
  /**
   * Mentions libres a apposer sur le document (champs texte, cases a cocher).
   *
   * Mapped to `mentions` (snake_case keys inside each object) before the REST API call.
   * Available since `@scell/mcp-client` v2.11.0.
   */
  mentions?: Mention[];
  /**
   * Bloc de date automatique appose au moment de la signature.
   *
   * Mapped to `date_block` (snake_case) before the REST API call.
   * Available since `@scell/mcp-client` v2.11.0.
   */
  dateBlock?: DateBlock;
}

/**
 * Query parameters for `scell_list_signatures` (`GET /api/v1/signatures`).
 *
 * Scope: results are restricted to the tenant of the authenticated API key.
 * Sub-tenant scoping is optional and enforced server-side as an anti-IDOR
 * check — passing a `sub_tenant_id` that does not belong to the current
 * tenant returns 403.
 *
 * NOTE: the legacy `company_id` filter was removed in the 2026-05-11
 * backend refonte (the underlying `api_keys.company_id` column was dropped
 * — the API key now resolves to a tenant, not to a single company).
 *
 * Available since Scell.io API v2.3.0 (signatures listing exposed to
 * `sk_live_*` / `sk_test_*` keys, previously dashboard-only via Sanctum).
 */
export interface SignatureListQuery {
  /** Filter by application status. */
  status?: SignatureStatus;
  /** Filter by environment (production / sandbox). */
  environment?: Environment;
  /**
   * Restrict to a sub-tenant of the current tenant (UUID). Server enforces
   * ownership: returns 403 if the sub-tenant does not belong to the caller.
   */
  sub_tenant_id?: string;
  /** Page number (default: 1). */
  page?: number;
  /** Items per page (default: 20, max: 100). */
  per_page?: number;
}

/**
 * Query parameters for the URL-nested tenant signature endpoints introduced
 * in Scell.io API v2.7.0:
 *
 * - `GET /api/v1/tenant/signatures`
 * - `GET /api/v1/tenant/signatures/{id}`
 * - `GET /api/v1/tenant/sub-tenants/{subTenantId}/signatures`
 * - `GET /api/v1/tenant/sub-tenants/{subTenantId}/signatures/{id}`
 *
 * These endpoints are scoped to the tenant resolved from the
 * `X-API-Key: sk_live_*` / `sk_test_*` header (no `sub_tenant_id` filter
 * — the sub-tenant scope, when applicable, comes from the URL path).
 *
 * Use this in place of `SignatureListQuery` for tools targeting the
 * tenant-level routes (`scell_tenant_list_signatures`,
 * `scell_subtenant_list_signatures`). The legacy `SignatureListQuery` remains
 * for the company-scoped `GET /api/v1/signatures` endpoint.
 *
 * Available since `@scell/mcp-client` v2.7.0.
 */
export interface TenantSignatureListQuery {
  /** Filter by application status. */
  status?: SignatureStatus;
  /** Filter by environment (production / sandbox). */
  environment?: Environment;
  /** Page number (default: 1). */
  page?: number;
  /** Items per page (default: 20, max: 100). */
  per_page?: number;
}

/**
 * Reponse normalisee d'une demande de signature.
 */
export interface SignatureRequest {
  id: string;
  external_id: string | null;
  title: string;
  description: string | null;
  document_name: string;
  document_size: number;
  signers: Signer[] | null;
  status: SignatureStatus;
  status_message: string | null;
  environment: Environment;
  archive_enabled: boolean;
  amount_charged: number | null;
  expires_at: string | null;
  created_at: string;
  completed_at: string | null;
}

// ============================================================================
// Fiscal Compliance Types (LF 2026)
// ============================================================================

/** Fiscal compliance status */
export type FiscalComplianceStatus = 'CONFORME' | 'ALERTE' | 'NON_CONFORME';

/**
 * Fiscal compliance dashboard data
 */
export interface FiscalComplianceData {
  closingCoveragePercent: number;
  chainIntegrityPercent: number;
  openIncidentsCount: number;
  overallStatus: FiscalComplianceStatus;
  lastIntegrityCheckAt: string | null;
  lastClosingAt: string | null;
  lastClosingDate: string | null;
  totalFiscalEntries: number;
  daysWithActivity: number;
  daysClosed: number;
}

/**
 * Fiscal integrity check report
 */
export interface FiscalIntegrityReport {
  isValid: boolean;
  entriesChecked: number;
  brokenLinks: number;
  details?: Record<string, unknown>;
}

/**
 * Detail by-calendar for OpenTimestamps blockchain anchoring.
 * Tracks each calendar server's submit success/failure independently.
 *
 * @since 2.10.0
 */
export interface FiscalClosingOtsCalendar {
  /** Calendar URL (e.g. `https://alice.btc.calendar.opentimestamps.org`) */
  calendar: string;
  /** Whether the calendar accepted the submit */
  ok: boolean;
  /** Error message if `ok` is false */
  error?: string | null;
}

/**
 * Raw totals snapshot for a fiscal closing. Keys reflect the backend
 * service `FiscalClosingService::calculateTotals()`.
 *
 * @since 2.10.0
 */
export interface FiscalClosingTotals {
  invoices_count?: number;
  invoices_total_ht?: number;
  invoices_total_ttc?: number;
  invoices_total_tax?: number;
  credit_notes_count?: number;
  credit_notes_total?: number;
  total_entries?: number;
}

/**
 * Fiscal closing record sealed by a SHA-256 `closingHash`. Returned by
 * `scell_list_fiscal_closings`. Each closing chains to the previous one
 * of the same `(tenant, sub_tenant)` pair (ISCA self-certification).
 *
 * @since 2.10.0 OTS fields added (`otsProofBase64`, `otsStatus`,
 *               `otsSubmittedAt`, `otsBitcoinConfirmedAt`,
 *               `otsCalendars`). The raw binary `ots_proof` BYTEA column
 *               is intentionally not exposed (non-UTF8 string crashed
 *               `json_encode()`); the API now ships a base64 version.
 */
export interface FiscalClosing {
  id: string;
  tenantId?: string;
  /** Null for master tenant's own flows; UUID for a sub-tenant closing. */
  subTenantId?: string | null;
  closingDate: string;
  closingType: 'daily' | 'monthly' | 'annual' | string;
  status: 'closed' | 'anchored' | string;
  entriesCount: number;

  // Legacy / derived
  totalDebit: number;
  totalCredit: number;
  /** Alias of `closingHash` in older responses. */
  chainHash?: string;

  // Sequence + chain hash
  firstSequenceNumber?: number;
  lastSequenceNumber?: number;
  closingHash?: string;
  previousClosingHash?: string | null;

  totals?: FiscalClosingTotals;
  cumulativeTotals?: Record<string, number>;

  environment?: 'sandbox' | 'production' | string;

  // CSV export (daily closing format)
  csvPath?: string | null;
  csvHash?: string | null;

  /**
   * Base64-encoded OpenTimestamps receipt anchoring `closingHash` into
   * Bitcoin. The raw BYTEA blob is not exposed (non-UTF8 magic bytes).
   * `null` until the closing has been submitted to OTS calendar servers.
   *
   * To verify externally, decode and pass to `ots verify`:
   * ```ts
   * import { writeFileSync } from 'node:fs';
   * writeFileSync('proof.ots', Buffer.from(closing.otsProofBase64!, 'base64'));
   * ```
   */
  otsProofBase64?: string | null;
  otsStatus?: 'pending' | 'bitcoin_confirmed' | 'failed' | null;
  otsSubmittedAt?: string | null;
  otsBitcoinConfirmedAt?: string | null;
  otsCalendars?: FiscalClosingOtsCalendar[] | null;

  metadata?: Record<string, unknown> | null;
  createdAt?: string;
}

/**
 * Fiscal ledger entry
 */
export interface FiscalEntry {
  id: string;
  sequenceNumber: number;
  entryType: string;
  fiscalDate: string;
  entityType?: string | null;
  entityId?: string | null;
  dataHash?: string;
  previousHash?: string;
  chainHash?: string;
  environment?: string;
  legalStatus?: string;
  createdAt?: string;
}

/**
 * Fiscal kill switch status
 */
export interface FiscalKillSwitchStatus {
  isActive: boolean;
  killSwitch: {
    id: string;
    isActive: boolean;
    activatedAt: string;
    reason: string;
    activatedBy: string;
    deactivatedAt?: string | null;
    deactivatedBy?: string | null;
  } | null;
}

/**
 * Fiscal rule
 */
export interface FiscalRule {
  id: string;
  ruleKey: string;
  name: string;
  category: 'vat' | 'invoicing' | 'credit_note' | 'closing' | 'export';
  ruleDefinition: Record<string, unknown>;
  version: number;
  effectiveFrom: string;
  effectiveUntil?: string | null;
  legalReference?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
}

/**
 * Fiscal anchor
 */
export interface FiscalAnchor {
  id: string;
  anchorType: string;
  sourceHash: string;
  anchorReference?: string | null;
  anchorProvider?: string | null;
  anchoredAt?: string | null;
  createdAt?: string;
}

/**
 * Fiscal attestation
 */
export interface FiscalAttestation {
  year: number;
  tenantName: string;
  softwareVersion: string;
  compliance: Record<string, unknown>;
  generatedAt?: string;
  certificateHash?: string;
}

/**
 * ISCA compliance document download result
 */
export interface ISCADocument {
  filename: string;
  content: ArrayBuffer;
  generated_at: string;
}

// ============================================================================
// Billing Types
// ============================================================================

/**
 * PaymentIntent — returned by the `scell_pay_billing_invoice` tool.
 *
 * Pass `clientSecret` to `stripe.confirmCardPayment(clientSecret)` on the
 * client side to finalize the payment.
 *
 * @since 2.2.0
 */
export interface PaymentIntent {
  /** Stripe PaymentIntent client_secret — pass to Stripe.js confirmCardPayment() */
  clientSecret: string;
  /** Stripe PaymentIntent ID (pi_...) */
  paymentIntentId: string;
  /** Amount in smallest currency unit (e.g. cents for EUR) */
  amount: number;
  /** ISO 4217 currency code in lowercase (e.g. "eur") */
  currency: string;
  /** Stripe PaymentIntent status (e.g. "requires_payment_method", "succeeded") */
  status: string;
}

/**
 * Billing invoice
 */
export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  period: string;
  totalHt: number;
  totalTax: number;
  totalTtc: number;
  status: string;
  currency: string;
  issuedAt?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
}

/**
 * Billing usage for a period
 */
export interface BillingUsage {
  period: string;
  invoicesCount: number;
  creditNotesCount: number;
  signaturesCount: number;
  totalCost: number;
  currency: string;
}

/**
 * Billing transaction
 */
export interface BillingTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description?: string | null;
  reference?: string | null;
  status?: string | null;
  createdAt?: string | null;
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Stats overview
 */
export interface StatsOverview {
  totalInvoices: number;
  totalCreditNotes: number;
  totalRevenue: number;
  totalExpenses: number;
  activeSubTenants: number;
  currency: string;
}

/**
 * Monthly statistics
 */
export interface StatsMonthly {
  month: string;
  invoicesCount: number;
  creditNotesCount: number;
  revenue: number;
  expenses: number;
}

// ============================================================================
// Tenant / Sub-Tenant Types
// ============================================================================

/**
 * SubTenant onboarding lifecycle status (since v2.0.0).
 *
 * Replaces the legacy 3-state `kycStatus` field. Maps the SuperPDP
 * onboarding pipeline:
 *
 * | Legacy `kycStatus` | New `OnboardingStatus`                                                                |
 * |--------------------|---------------------------------------------------------------------------------------|
 * | pending            | pending_superpdp / superpdp_redirected / superpdp_authorized / superpdp_pending_review |
 * | verified           | active                                                                                |
 * | rejected           | superpdp_failed                                                                       |
 */
export type OnboardingStatus =
  | 'pending_superpdp'
  | 'superpdp_redirected'
  | 'superpdp_authorized'
  | 'superpdp_pending_review'
  | 'active'
  | 'superpdp_failed';

export type SuperPDPCompanyVerificationStatus =
  | 'verified'
  | 'needs_review'
  | 'failed'
  | null;

export type SuperPDPUserIdentityVerificationStatus =
  | 'verified'
  | 'needs_review'
  | 'not_verified'
  | null;

/**
 * Recommended action returned alongside a SubTenant. Structured i18n
 * (FR/EN) so the agent can present a localized banner without the
 * caller having to translate machine codes.
 */
export interface RecommendedAction {
  code: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  titleFr: string;
  titleEn: string;
  messageFr: string;
  messageEn: string;
  ctaLabelFr: string;
  ctaLabelEn: string;
  ctaUrl: string | null;
  dismissible: boolean;
}

/**
 * Sub-tenant (v2 shape).
 *
 * Breaking change vs v1.x: `kycStatus`, `kycVerifiedAt`, `kycDelegated`
 * are gone. Replaced by `onboardingStatus` plus the explicit SuperPDP
 * verification fields.
 */
export interface SubTenant {
  id: string;
  externalId?: string | null;
  name: string;
  siret?: string | null;
  siren?: string | null;
  email?: string | null;
  phone?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  address?: {
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    country?: string;
  } | null;
  metadata?: Record<string, unknown> | null;
  /** Onboarding lifecycle status (since v2.0.0). */
  onboardingStatus: OnboardingStatus;
  superpdpCompanyVerificationStatus?: SuperPDPCompanyVerificationStatus;
  superpdpUserIdentityVerificationStatus?: SuperPDPUserIdentityVerificationStatus;
  /** Last poll of SuperPDP for status (ISO 8601 UTC). */
  lastPolledAt?: string | null;
  /** Signed resume URL valid 7 days while onboarding != active. */
  resumeUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Type alias for code paths that explicitly handle the v2 enriched
 * payload returned by `getSubtenantStatus` / `refreshSubtenantStatus`.
 */
export type SubTenantSummary = SubTenant;

/**
 * Input for creating a sub-tenant (server-to-server).
 */
export interface SubTenantInput {
  externalId?: string;
  name: string;
  siret?: string;
  siren?: string;
  email?: string;
  phone?: string;
  contactFirstName?: string;
  contactLastName?: string;
  address?: {
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    country?: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Sirene lookup payload (publishable-key, since v2.0.0).
 */
export interface CompanyData {
  siret: string;
  siren: string;
  name: string;
  legalForm?: string | null;
  legalFormCode?: string | null;
  nafCode?: string | null;
  nafLabel?: string | null;
  vatNumber?: string | null;
  address: {
    line1: string;
    line2?: string | null;
    postalCode: string;
    city: string;
    country: string;
  };
  isActive: boolean;
  createdAt?: string | null;
}

/** Identity form payload collected by the widget for the human driving the onboarding. */
export interface IdentityFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  jobTitle?: string;
}

/** Response from `lookupSirene` (publishable-key). */
export interface SireneLookupResult {
  data: CompanyData | null;
  sireneLookupSucceeded: boolean;
}

/** Input for `createSubTenant` (publishable-key widget endpoint). */
export interface CreateSubTenantWidgetInput {
  externalId?: string;
  company: CompanyData;
  identity: IdentityFormData;
  locale?: 'fr' | 'en';
  metadata?: Record<string, unknown>;
}

/** Response from `createSubTenant` (publishable-key widget endpoint). */
export interface CreateSubTenantWidgetResult {
  data: SubTenant;
  recommendedAction: RecommendedAction | null;
  resumeUrl: string | null;
}

/** Response from `getSubtenantStatus` / `refreshSubtenantStatus`. */
export interface SubTenantStatusResult {
  data: SubTenant;
  recommendedAction: RecommendedAction | null;
}

/** Response from `getResumeUrl`. */
export interface SubTenantResumeUrlResult {
  resumeUrl: string;
  expiresAt: string;
}

/**
 * Response from `POST /v1/tenant/sub-tenants/{id}/superpdp-authorize`
 * (since API v2.9.0).
 *
 * Returns the SuperPDP OAuth2 authorize URL that the master tenant
 * should open (in a popup or new tab) so the sub-tenant can grant
 * Scell.io the access token needed to drive its KYB / signature
 * workflows. The `state` is opaque CSRF protection — Scell.io
 * validates it on the OAuth callback automatically.
 */
export interface SubTenantSuperPDPAuthorizeResponse {
  /** URL to open in the browser to start the SuperPDP OAuth2 flow. */
  authorizeUrl: string;
  /** Opaque CSRF token validated server-side on callback. */
  state: string;
}

/**
 * Options accepted by `deleteSubTenant` (since API v2.9.0).
 */
export interface SubTenantDeleteOptions {
  /**
   * When `true`, also deletes every Company owned by the sub-tenant.
   * Required when the sub-tenant still has Companies attached
   * (otherwise the API returns `422 SUB_TENANT_HAS_COMPANIES`).
   *
   * Has no effect if the sub-tenant has fiscal entries — those
   * block deletion unconditionally (ISCA compliance).
   */
  cascade?: boolean;
}

/**
 * Response from `DELETE /v1/tenant/sub-tenants/{id}` (success).
 */
export interface SubTenantDeleteResult {
  /** Human-readable confirmation message. */
  message: string;
  /** Number of Companies deleted alongside the sub-tenant (0 if no cascade). */
  companiesDeleted: number;
}

/**
 * Machine-readable error codes returned by the sub-tenant lifecycle
 * endpoints. The agent should branch on these to surface a clear
 * remediation path to the human user.
 */
export type SubTenantErrorCode =
  /**
   * `DELETE /sub-tenants/{id}` returned 422: the sub-tenant still has
   * Companies attached. Retry with `{ cascade: true }` to drop them
   * atomically.
   */
  | 'SUB_TENANT_HAS_COMPANIES'
  /**
   * `DELETE /sub-tenants/{id}` returned 422: the sub-tenant has fiscal
   * entries on the immutable ledger (invoices, credit notes,
   * signatures emitted). ISCA forbids deletion — there is **no force
   * flag**. The agent should propose to mark the sub-tenant inactive
   * (`metadata.archived = true`) instead.
   */
  | 'SUB_TENANT_HAS_FISCAL_ENTRIES'
  /**
   * `POST /sub-tenants/{id}/superpdp-status/refresh` returned 422:
   * there is no SuperPDP access token on file for this sub-tenant
   * (the user never completed the OAuth2 flow, or the token was
   * revoked / expired). The response payload includes
   * `authorize_url` — the agent should surface it to the user so they
   * can re-authorize via `scell_start_subtenant_superpdp_authorize`.
   */
  | 'MISSING_ACCESS_TOKEN';

/**
 * 422 error payload for `DELETE /sub-tenants/{id}` with
 * `SUB_TENANT_HAS_COMPANIES`.
 */
export interface SubTenantHasCompaniesError {
  code: 'SUB_TENANT_HAS_COMPANIES';
  message: string;
  /** Number of Companies still attached to the sub-tenant. */
  companiesCount: number;
}

/**
 * 422 error payload for `DELETE /sub-tenants/{id}` with
 * `SUB_TENANT_HAS_FISCAL_ENTRIES`. No remediation flag exists; the
 * sub-tenant must remain in the ledger (ISCA compliance).
 */
export interface SubTenantHasFiscalEntriesError {
  code: 'SUB_TENANT_HAS_FISCAL_ENTRIES';
  message: string;
}

/**
 * 422 error payload for `POST /sub-tenants/{id}/superpdp-status/refresh`
 * with `MISSING_ACCESS_TOKEN`.
 */
export interface SubTenantMissingAccessTokenError {
  code: 'MISSING_ACCESS_TOKEN';
  message: string;
  /** OAuth2 authorize URL the user must open to re-grant access. */
  authorizeUrl: string;
}

/**
 * Tenant profile
 */
export interface TenantProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  siret?: string;
  siren?: string;
  kybStatus?: string;
  environment?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Tenant balance
 */
export interface TenantBalance {
  credits: number;
  currency: string;
}

// ============================================================================
// Tool Result Types
// ============================================================================

/**
 * Generic tool result wrapper
 */
export interface ToolResult<T> {
  /** Whether the operation was successful */
  success: boolean;
  /** Result data (on success) */
  data?: T;
  /** Error message (on failure) */
  error?: string;
  /** Error code (on failure) */
  errorCode?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Paginated list result
 */
export interface PaginatedResult<T> {
  /** List of items */
  items: T[];
  /** Total number of items */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  perPage: number;
  /** Total number of pages */
  totalPages: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * API health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  services: {
    database: boolean;
    cache: boolean;
    queue: boolean;
    signature: boolean;
    invoicing: boolean;
  };
}

/**
 * API key validation response
 */
export interface ApiKeyValidationResponse {
  valid: boolean;
  tenant?: {
    id: string;
    name: string;
    plan: string;
  };
  permissions?: string[];
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: string;
  };
}

// ============================================================================
// Onboarding Types
// ============================================================================

/**
 * Response from initiating a SuperPDP OAuth2 authorization
 */
export interface OnboardingAuthorizeResponse {
  /** The SuperPDP OAuth2 authorization URL to redirect the user to */
  authorize_url: string;
  /** State parameter for CSRF protection */
  state: string;
}

/**
 * Response from the SuperPDP OAuth2 callback
 */
export interface OnboardingCallbackResponse {
  /** Whether the authorization was successful */
  success: boolean;
  /** The authorization code returned by SuperPDP */
  authorization_code?: string;
  /** The tenant object created or updated after authorization */
  tenant?: TenantProfile;
}

/**
 * Onboarding session
 */
export interface OnboardingSession {
  /** Unique session ID */
  id: string;
  /** Session status */
  status: 'pending' | 'authorized' | 'completed' | 'failed';
  /** Associated tenant (if onboarding completed) */
  tenant?: TenantProfile;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Input for creating an onboarding session
 */
export interface OnboardingSessionInput {
  /** External reference ID for the session */
  externalId?: string;
  /** Metadata to attach to the session */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Invoice Template Types (since 1.11.0)
// ============================================================================

export type InvoiceTemplateScope = 'system' | 'tenant' | 'sub_tenant';
export type InvoiceTemplateLogoPosition = 'top-left' | 'top-center' | 'top-right';

/**
 * Invoice / Credit Note template — visual customization.
 *
 * Resolution cascade (server-side) :
 *   1. invoice.invoice_template_id explicit
 *   2. Default sub-tenant template
 *   3. Default tenant template (if available_to_subtenants)
 *   4. System default
 */
export interface InvoiceTemplate {
  id: string;
  scope: InvoiceTemplateScope;
  tenant_id: string | null;
  sub_tenant_id: string | null;
  name: string;
  description: string | null;
  is_default: boolean;
  is_available_to_subtenants: boolean;
  logo_url: string | null;
  logo_position: InvoiceTemplateLogoPosition;
  primary_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  background_color: string | null;
  header_text: string | null;
  footer_text: string | null;
  custom_mentions: string | null;
  advanced_options: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface InvoiceTemplateInput {
  scope: 'tenant' | 'sub_tenant';
  sub_tenant_id?: string;
  name: string;
  description?: string;
  is_default?: boolean;
  is_available_to_subtenants?: boolean;
  logo_url?: string;
  logo_position?: InvoiceTemplateLogoPosition;
  primary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  header_text?: string;
  footer_text?: string;
  custom_mentions?: string;
  advanced_options?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Daily Closure Types (since 1.11.0)
// ============================================================================

/**
 * Daily fiscal closure summary — emitted automatically every day at 00:05 UTC.
 *
 * Sent by email to all active tenants with attached CSV.
 */
export interface DailyClosure {
  id: string;
  tenant_id: string;
  closing_date: string;
  closing_type: 'daily' | 'monthly' | 'annual';
  entries_count: number;
  total_ht: number;
  total_tax: number;
  total_ttc: number;
  currency: string;
  closing_hash: string;
  csv_hash: string | null;
  csv_path: string | null;
  csv_url?: string; // signed URL valid 5 days, returned by API
  emailed_at: string | null;
  created_at: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * Webhook event types
 */
export type WebhookEventType =
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.cancelled'
  | 'invoice.incoming.received'
  | 'invoice.incoming.validated'
  | 'invoice.incoming.accepted'
  | 'invoice.incoming.rejected'
  | 'invoice.incoming.disputed'
  | 'invoice.incoming.paid'
  | 'credit_note.created'
  | 'credit_note.sent'
  | 'credit_note.cancelled'
  | 'signature.created'
  | 'signature.signed'
  | 'signature.completed'
  | 'signature.expired'
  | 'signature.declined';

/**
 * Webhook payload
 */
export interface WebhookPayload<T = unknown> {
  /** Event type */
  event: WebhookEventType;
  /** Event timestamp */
  timestamp: string;
  /** Event data */
  data: T;
  /** Signature for verification */
  signature: string;
}

// ============================================================================
// Payment Schedule Types (since 2.13.0)
// ============================================================================

/**
 * Status lifecycle of a payment schedule line.
 *
 * - `pending`   — not yet invoiced; the tenant must manually convert it, or
 *                 `auto_generate=true` causes the CRON to create a draft invoice
 *                 on the `due_date`.
 * - `invoiced`  — a deposit invoice has been created from this line; the line
 *                 is locked and `invoice_id` is set.
 * - `cancelled` — the line was cancelled; it no longer contributes to the
 *                 planned total.
 */
export type PaymentScheduleLineStatus = 'pending' | 'invoiced' | 'cancelled';

/**
 * Amount type for a payment schedule line.
 *
 * - `'percent'` — `amount_value` is a percentage of the quote total TTC
 *                 (0.01 – 100, inclusive). Must be ≤ 100. The server
 *                 snapshots the TTC equivalent at quote acceptance.
 * - `'amount'`  — `amount_value` is a fixed amount in the quote's currency
 *                 (> 0). Must not exceed the quote total TTC.
 */
export type PaymentScheduleAmountType = 'percent' | 'amount';

/**
 * Input for a single payment schedule line when creating or replacing an
 * échéancier (POST /api/v1/quotes/{quote}/payment-schedule).
 *
 * Constraints:
 * - At least one of `due_date` OR `milestone_label` MUST be provided.
 * - `auto_generate` can only be `true` when `due_date` is present.
 * - For `amount_type = 'percent'`, `amount_value` must be in (0, 100].
 * - For `amount_type = 'amount'`, `amount_value` must be > 0.
 *
 * @since 2.13.0
 */
export interface PaymentScheduleLineInput {
  /**
   * Display order of the line (1-indexed). The server recomputes the natural
   * order automatically when `order` is omitted; provide it explicitly only
   * when you need a specific arrangement.
   */
  order?: number;
  /** Whether the value is a percentage of the quote total or a fixed amount. */
  amount_type: PaymentScheduleAmountType;
  /**
   * The value: percentage (0.01–100) or fixed currency amount (> 0).
   * For percent lines, the server snapshots the TTC equivalent at quote acceptance.
   */
  amount_value: number;
  /**
   * ISO 8601 date on which this payment is due (YYYY-MM-DD).
   * Required if `milestone_label` is absent. Used by the CRON job when
   * `auto_generate` is `true`.
   */
  due_date?: string | null;
  /**
   * Free-text milestone label (e.g. "Livraison MVP", "Acceptation client").
   * Required if `due_date` is absent. Lines without a `due_date` can only
   * be converted to deposit invoices manually.
   */
  milestone_label?: string | null;
  /**
   * Optional free-text description shown on the deposit invoice.
   */
  description?: string | null;
  /**
   * If `true`, the CRON job (daily at 06:00 UTC) creates a draft deposit
   * invoice automatically on the `due_date`. The tenant still validates and
   * sends it manually. Requires `due_date` to be present.
   * Default: `false`.
   */
  auto_generate?: boolean;
}

/**
 * Input for a partial PATCH on the payment schedule.
 * Sent to PATCH /api/v1/quotes/{quote}/payment-schedule.
 *
 * Any combination of `add`, `update`, and `remove` is accepted in a single
 * call. The server applies them atomically inside a database transaction.
 * Blocked if the quote is in `accepted`, `converted`, or `cancelled` status.
 *
 * @since 2.13.0
 */
export interface PaymentSchedulePatchInput {
  /** New lines to append to the schedule (server assigns order). */
  add?: PaymentScheduleLineInput[];
  /** Partial updates to existing lines. Each entry requires an `id`. */
  update?: Array<Partial<PaymentScheduleLineInput> & { id: string }>;
  /** UUIDs of lines to remove. Only `pending` lines can be removed. */
  remove?: string[];
}

/**
 * A single payment schedule line as returned by the API.
 *
 * @since 2.13.0
 */
export interface PaymentScheduleLine {
  /** Unique UUID of this line. */
  id: string;
  /** UUID of the parent quote. */
  quote_id: string;
  /** Display order (1-indexed, unique within the quote). */
  order: number;
  /** Whether the value is percent or fixed amount. */
  amount_type: PaymentScheduleAmountType;
  /** The raw value: percentage (0.01–100) or fixed amount (> 0). */
  amount_value: number;
  /**
   * TTC amount snapshotted at quote acceptance (null before acceptance).
   * For `amount_type = 'percent'`, this is `(amount_value / 100) * quote.total_ttc`.
   * For `amount_type = 'amount'`, this equals `amount_value` (same currency).
   */
  amount_ttc_snapshot: number | null;
  /** ISO 8601 due date (null for milestone-only lines). */
  due_date: string | null;
  /** Free-text milestone label (null if `due_date` was used as sole trigger). */
  milestone_label: string | null;
  /** Optional free-text description for the deposit invoice. */
  description: string | null;
  /** Whether the CRON auto-creates a draft deposit invoice on `due_date`. */
  auto_generate: boolean;
  /** Line lifecycle status. */
  status: PaymentScheduleLineStatus;
  /**
   * UUID of the deposit invoice created from this line.
   * Set when `status === 'invoiced'`; `null` otherwise.
   */
  invoice_id: string | null;
  /** ISO 8601 timestamp when the invoice was generated. `null` if not yet invoiced. */
  invoiced_at: string | null;
  /**
   * ISO 8601 timestamp when the line was locked (equals `quote.accepted_at`
   * after the buyer signs). Structural changes are forbidden after locking.
   * Only `status`, `invoice_id`, `invoiced_at`, and reminder fields can change.
   */
  locked_at: string | null;
  /** ISO 8601 creation timestamp. */
  created_at: string;
  /** ISO 8601 last-update timestamp. */
  updated_at: string;
}

/**
 * Summary of the next upcoming due payment schedule line.
 *
 * @since 2.13.0
 */
export interface NextDueLine {
  /** UUID of the payment schedule line. */
  line_id: string;
  /** ISO 8601 due date. */
  due_date: string;
  /** TTC amount (absolute, in quote currency). */
  amount_ttc: number;
  /** Display label (milestone_label or auto-generated from due_date). */
  label: string;
  /** Number of calendar days until `due_date` (negative if overdue). */
  days_until: number;
}

/**
 * An overdue payment schedule line entry in the payment summary.
 *
 * @since 2.13.0
 */
export interface OverdueLine {
  /** UUID of the payment schedule line. */
  line_id: string;
  /** ISO 8601 due date (already passed). */
  due_date: string;
  /** TTC amount (absolute, in quote currency). */
  amount_ttc: number;
  /** Display label. */
  label: string;
  /** Number of calendar days since `due_date` passed. Always > 0. */
  days_overdue: number;
}

/**
 * SuperPDP enrichment for an invoice attached to a payment schedule.
 * Displays the PEPPOL transmission / buyer acceptance status.
 *
 * @since 2.13.0
 */
export interface PaymentSummaryInvoiceStatus {
  /** UUID of the deposit / balance invoice. */
  invoice_id: string;
  /** Human-readable invoice number (e.g. "FA-2026-0042"). */
  invoice_number: string;
  /** SuperPDP / PEPPOL transmission status of this invoice. */
  status: string;
  /** ISO 8601 timestamp when the buyer accepted the invoice. `null` if not yet. */
  accepted_at: string | null;
  /** ISO 8601 timestamp when the buyer confirmed payment. `null` if not yet. */
  paid_at: string | null;
}

/**
 * Payment summary for a quote — the tracker of invoiced vs. remaining amounts.
 *
 * Returned by GET /api/v1/quotes/{quote}/payment-summary.
 * All monetary amounts are in the quote's currency (ISO 4217).
 *
 * @since 2.13.0
 */
export interface PaymentSummary {
  /** Minimal quote context. */
  quote: {
    id: string;
    quote_number: string;
    /** Quote total TTC (including tax). */
    total_ttc: number;
  };
  /** Échéancier (schedule) aggregates across all lines. */
  schedule: {
    /**
     * Sum of all non-cancelled line TTC amounts (snapshot for percent lines).
     * May be < `quote.total_ttc` when the balance invoice is not yet planned.
     */
    planned_total_ttc: number;
    /** `quote.total_ttc − planned_total_ttc` — amount not covered by any line. */
    planned_remainder: number;
    /** Total number of non-cancelled schedule lines. */
    lines_count: number;
    /** Lines in `pending` status (not yet invoiced). */
    pending_count: number;
    /** Lines in `invoiced` status. */
    invoiced_count: number;
  };
  /** Actual invoicing tracker (computed from linked deposit + balance invoices). */
  invoiced: {
    /** Sum of all deposit + balance invoice totals TTC (gross, before credits). */
    gross_ttc: number;
    /** Sum of credit note totals TTC issued against those invoices. */
    credits_ttc: number;
    /** `gross_ttc − credits_ttc` (net invoiced). */
    net_ttc: number;
    /** `quote.total_ttc − net_ttc` (amount still to invoice). */
    remaining_ttc: number;
    /** `(remaining_ttc / quote.total_ttc) × 100` — percentage still to invoice. */
    remaining_pct: number;
  };
  /** The earliest pending line with a `due_date`. `null` if none. */
  next_due: NextDueLine | null;
  /** All pending lines whose `due_date` is strictly in the past. */
  overdue: OverdueLine[];
  /** SuperPDP / PEPPOL enrichment for all linked invoices. */
  superpdp_status: PaymentSummaryInvoiceStatus[];
  /**
   * Full schedule lines list (since v2.14.0).
   *
   * Allows the dashboard/agent to render the complete tracker (all
   * milestones with status, amounts, due_date) without an additional
   * GET /payment-schedule call. Ordered by due_date then order.
   */
  lines: PaymentScheduleLine[];
}

/**
 * A pre-configured payment schedule preset (e.g. "30 % / 70 %").
 * Returned by GET /api/v1/payment-schedule/presets.
 *
 * Presets are server-defined templates the LLM agent can suggest to users
 * before they create a custom schedule. Each preset expands to ready-to-use
 * `PaymentScheduleLineInput[]` that can be sent directly to
 * POST /api/v1/quotes/{quote}/payment-schedule.
 *
 * @since 2.13.0
 */
export interface PaymentSchedulePreset {
  /** Machine key (e.g. `"30-70"`, `"50-50"`, `"30-30-40"`, `"3x-monthly"`). */
  key: string;
  /** Human-readable label shown in UI / LLM responses. */
  label: string;
  /**
   * Expanded lines ready to be used as the `lines` array in
   * POST /api/v1/quotes/{quote}/payment-schedule.
   * Dates are relative offsets — no `due_date` is set; the user fills them in.
   */
  lines: PaymentScheduleLineInput[];
}

/**
 * Response from POST /api/v1/invoices/{invoice}/send-by-email.
 * Confirms the email was dispatched and records the effective recipient.
 *
 * @since 2.13.0
 */
export interface InvoiceSendByEmailResult {
  /** Effective recipient email (after cascade resolution). */
  sent_to: string;
  /** ISO 8601 UTC timestamp when the email was dispatched. */
  sent_at: string;
  /** Unique message ID for tracking (format: `<uuid@scell.io>`). */
  message_id: string;
  /** CC addresses that received a copy. Empty array if none. */
  cc: string[];
}

// ============================================================================
// Branding Types (since 2.13.0)
// ============================================================================

/**
 * Email branding configuration for a tenant or sub-tenant.
 *
 * Stored on the `companies` table (columns added in migration 2026-05-21).
 * Applied to all outbound emails (invoice, credit note, quote) when ALL
 * required fields are populated; otherwise the default Scell.io branding
 * is used as fallback.
 *
 * Field notes:
 * - `brand_logo_url` is DISTINCT from `logo_url` (the Factur-X PDF logo).
 *   Fallback chain: `brand_logo_url` → `logo_url` → Scell.io default logo.
 * - `brand_primary_color` must be a 6-digit hex color (`#RRGGBB`).
 * - `is_complete` is server-computed: `true` when logo + color + footer are
 *   all non-null; the LLM should surface missing fields to guide the user.
 *
 * @since 2.13.0
 */
export interface Branding {
  /**
   * Scope of this branding object.
   * - `'tenant'`     — master-tenant default branding.
   * - `'sub_tenant'` — sub-tenant-specific override.
   */
  scope: 'tenant' | 'sub_tenant';
  /** UUID of the Company that holds these branding fields. */
  company_id: string;
  /**
   * URL of the brand logo for emails. Distinct from the Factur-X PDF logo.
   * `null` until set. Fallback: `logo_url` → Scell.io default.
   */
  brand_logo_url: string | null;
  /**
   * Primary brand color in `#RRGGBB` format (e.g. `"#1A73E8"`).
   * `null` until set. Used for email button color and section highlights.
   */
  brand_primary_color: string | null;
  /**
   * Footer text shown at the bottom of all outgoing emails.
   * Typical content: company name, address, SIRET, legal mentions.
   * `null` until set.
   */
  brand_email_footer: string | null;
  /**
   * Email closing signature (e.g. `"L'équipe Société XYZ"`).
   * `null` until set.
   */
  brand_email_signature: string | null;
  /**
   * Server-computed flag: `true` when `brand_logo_url`, `brand_primary_color`,
   * and `brand_email_footer` are all non-null (minimum viable branding).
   * When `false`, Scell.io default branding is used as fallback.
   */
  is_complete: boolean;
  /**
   * Fields still missing to reach `is_complete = true`.
   * Empty array when `is_complete` is `true`.
   */
  missing_fields: Array<'brand_logo_url' | 'brand_primary_color' | 'brand_email_footer'>;
}

/**
 * Input for updating branding (PATCH /api/v1/tenant/branding or
 * PATCH /api/v1/sub-tenants/{id}/branding). All fields optional.
 *
 * Send only the fields you want to change. Omitted fields are left unchanged.
 * Set a field to `null` explicitly to clear it (reverts to Scell.io default).
 *
 * @since 2.13.0
 */
export interface BrandingInput {
  /**
   * URL of the brand logo for emails. Must be a publicly accessible HTTPS URL.
   * Recommended dimensions: 200×60px, PNG or SVG with transparent background.
   * Set to `null` to clear (reverts to Scell.io default logo).
   */
  brand_logo_url?: string | null;
  /**
   * Primary brand color in `#RRGGBB` format (e.g. `"#1A73E8"`).
   * Validated server-side with regex `^#[0-9A-Fa-f]{6}$`.
   * Set to `null` to clear.
   */
  brand_primary_color?: string | null;
  /**
   * Footer text for all outgoing emails. Supports plain text only (no HTML).
   * Typical: "Société XYZ — 12 rue de la République, 75001 Paris — SIRET 123".
   * Set to `null` to clear.
   */
  brand_email_footer?: string | null;
  /**
   * Email closing signature. Plain text only.
   * Example: `"L'équipe Société XYZ"` or `"Service comptabilité XYZ"`.
   * Set to `null` to clear.
   */
  brand_email_signature?: string | null;
}

// ============================================================================
// Backend Enum Mirrors (since v2.22.0)
// ============================================================================
//
// String unions aligned exactly with the backend `App\Enums\*` PHP enums
// and PostgreSQL CHECK constraints. Surface them in tool descriptions so the
// LLM can enumerate the legal filter values for `status` / `type` /
// `archive_status` query parameters.
//
// Every enum here mirrors a backend source of truth — keep the values
// alphabetically aligned with the backend `case` order. Adding a value here
// is a non-breaking change for consumers, removing one is a major bump.

/**
 * Invoice template kind — what document family this template can decorate.
 *
 * Aligned with `App\Enums\Invoice\InvoiceTemplateKind`.
 *
 * - `'invoice'` — usable on standard invoices (and deposit/balance invoices).
 * - `'quote'` — usable on quotes (devis) only.
 * - `'both'` — universal template that can be applied to invoices AND quotes.
 *
 * @since 2.22.0
 */
export type InvoiceTemplateKind = 'invoice' | 'quote' | 'both';

/**
 * Invoice type — distinguishes standard, deposit (acompte) and balance (solde)
 * invoices.
 *
 * Aligned with `App\Enums\Invoice\InvoiceType`. Already present on
 * `InvoiceInput.invoiceType` since v2.20.0; this is the canonical union name.
 *
 * - `'standard'` — Regular invoice (Factur-X type code 380).
 * - `'deposit'` — Acompte (type code 386). VAT immediately exigible
 *   (CGI art. 289). Factur-X partial invoice.
 * - `'balance'` — Solde final (type code 380). Factur-X final invoice.
 *   Auto-deducts already-emitted deposit invoices via BG-22 code `80`.
 *
 * @since 2.22.0
 */
export type InvoiceType = 'standard' | 'deposit' | 'balance';

/**
 * Payment schedule line amount type — backend canonical name.
 *
 * Re-exported as an alias of {@link PaymentScheduleAmountType} (already
 * defined since v2.13.0) to match `App\Enums\Quote\PaymentScheduleLineAmountType`.
 *
 * @since 2.22.0
 */
export type PaymentScheduleLineAmountType = PaymentScheduleAmountType;

/**
 * Sub-tenant onboarding status — backend canonical name alias.
 *
 * Re-exported as an alias of {@link OnboardingStatus} (already defined since
 * v2.8.0) to match `App\Enums\SubTenantOnboardingStatus`.
 *
 * 6 values: `pending_superpdp`, `superpdp_redirected`, `superpdp_authorized`,
 * `superpdp_pending_review`, `active`, `superpdp_failed`.
 *
 * @since 2.22.0
 */
export type SubTenantOnboardingStatus = OnboardingStatus;

/**
 * Quote audit log action — every tamper-evident entry of a quote's lifecycle
 * is tagged with one of these 21 actions.
 *
 * Aligned with `App\Enums\Quote\QuoteAuditAction`. Returned by
 * `scell_get_quote_audit_log` inside `QuoteAuditEntry.action`.
 *
 * Each entry carries a `chainHash` (SHA-256) linking to the previous entry,
 * providing legal proof of every state transition.
 *
 * @since 2.22.0
 */
export type QuoteAuditAction =
  | 'created'
  | 'updated'
  | 'line_added'
  | 'line_removed'
  | 'line_updated'
  | 'buyer_changed'
  | 'sent'
  | 'resent'
  | 'viewed'
  | 'signed'
  | 'accepted'
  | 'refused'
  | 'cancelled'
  | 'expired'
  | 'converted'
  | 'public_link_regenerated'
  | 'public_link_revoked'
  | 'duplicated'
  | 'deposit_generated_from_schedule'
  | 'schedule_updated'
  | 'schedule_deleted';

/**
 * Signature archive status — long-term archival lifecycle of the signed PDF.
 *
 * Aligned with the backend `signatures.archive_status` PostgreSQL CHECK
 * constraint (4 values).
 *
 * - `'pending'` — Archival queued, signed PDF not yet pushed to S3 Glacier.
 * - `'archived'` — Successfully archived (S3 Object Lock + Glacier deep tier).
 * - `'glacier'` — Transitioned to Glacier Deep Archive (retrieval ~12h).
 * - `'error'` — Archival failed; manual re-archive required.
 *
 * @since 2.22.0
 */
export type SignatureArchiveStatus = 'pending' | 'archived' | 'glacier' | 'error';

/**
 * Invoice archive status — long-term archival lifecycle of the Factur-X PDF/A.
 *
 * Aligned with the backend `invoices.archive_status` PostgreSQL CHECK
 * constraint (4 values). Same lifecycle as {@link SignatureArchiveStatus}.
 *
 * - `'pending'` — Archival queued, Factur-X PDF/A not yet pushed to long-term
 *   storage.
 * - `'archived'` — Successfully archived (S3 Object Lock COMPLIANCE, 11 years).
 * - `'glacier'` — Transitioned to Glacier Deep Archive.
 * - `'error'` — Archival failed; manual re-archive required.
 *
 * @since 2.22.0
 */
export type InvoiceArchiveStatus = 'pending' | 'archived' | 'glacier' | 'error';

/**
 * Payment means code (UN/ECE 4461) — Factur-X EN16931 BT-81 conformity.
 *
 * Aligned with `App\Enums\Invoice\PaymentMeansCode` (backend, 2026-05-27).
 * Required field on `scell_mark_invoice_paid` and
 * `scell_mark_incoming_invoice_paid` (the backend `MarkPaidRequest` enforces
 * it as `required|enum`).
 *
 * Source officielle : UN/ECE Recommendation 16 — Code List 4461.
 * Référence FNFE-MPE : https://fnfe-mpe.org/factur-x/specifications/
 *
 * Subset retenu (11 codes effectivement rencontrés en B2B France) :
 *
 * | Code | Label FR | Label EN |
 * |------|----------|----------|
 * | `'1'` | Non spécifié (fallback) | Unspecified |
 * | `'10'` | Espèces | Cash |
 * | `'20'` | Chèque | Cheque |
 * | `'30'` | Virement (international) | Credit transfer |
 * | `'42'` | Versement bancaire (sans IBAN) | Bank account transfer |
 * | `'48'` | Carte bancaire | Bank card |
 * | `'49'` | Prélèvement | Direct debit |
 * | `'57'` | Accord permanent (mandat) | Standing agreement |
 * | `'58'` | Virement SEPA (B2B France privilégié) | SEPA credit transfer |
 * | `'59'` | Prélèvement SEPA | SEPA direct debit |
 * | `'97'` | Compensation inter-comptes | Clearing between partners |
 *
 * Default recommandé pour UX (pré-remplir le formulaire) : `'30'` (virement
 * international) ou `'58'` (virement SEPA pour clients B2B France).
 *
 * @since 2.25.0
 */
export type PaymentMeansCode =
  | '1'
  | '10'
  | '20'
  | '30'
  | '42'
  | '48'
  | '49'
  | '57'
  | '58'
  | '59'
  | '97';

/**
 * Tenant KYB (Know Your Business) lifecycle — 5-step verification of the
 * master tenant (legal entity behind a Scell.io account).
 *
 * Aligned with the backend `Tenant::KYB_STATUS_*` constants.
 *
 * Required transition for `'kyb_status === verified'` before issuing
 * production B2B invoices through PEPPOL (CGI art. 289 conformity).
 *
 * - `'pending'` — Account created, no KYB documents yet.
 * - `'documents_submitted'` — Documents uploaded by the tenant.
 * - `'under_review'` — Internal compliance review in progress.
 * - `'verified'` — KYB green-lit; tenant can issue PEPPOL invoices.
 * - `'rejected'` — KYB refused with a `kyb_rejection_reason`.
 *
 * @since 2.22.0
 */
export type TenantKybStatus =
  | 'pending'
  | 'documents_submitted'
  | 'under_review'
  | 'verified'
  | 'rejected';

/**
 * Company status — KYC lifecycle of a company entity (issuer or sub-tenant
 * company).
 *
 * Aligned with the backend `companies.status` PostgreSQL CHECK constraint.
 *
 * - `'pending_kyc'` — Company created, KYC documents not yet submitted /
 *   validated. Cannot issue production invoices.
 * - `'active'` — KYC validated; company can issue invoices.
 * - `'suspended'` — Manually suspended (e.g. compliance flag, billing issue).
 *
 * @since 2.22.0
 */
export type CompanyStatus = 'pending_kyc' | 'active' | 'suspended';

/**
 * API key status — lifecycle of an `sk_*` / `pk_*` API key.
 *
 * Aligned with the backend `api_keys.status` PostgreSQL CHECK constraint.
 *
 * - `'active'` — Key is operational and accepted by the API gateway.
 * - `'revoked'` — Key was explicitly revoked. All API calls return
 *   401 INVALID_API_KEY.
 *
 * @since 2.22.0
 */
export type ApiKeyStatus = 'active' | 'revoked';

/**
 * Tenant billing invoice status — lifecycle of a Scell.io platform invoice
 * (i.e. invoices that Scell.io issues to its tenants for top-ups, pack
 * purchases, monthly usage). Distinct from end-user invoices issued by the
 * tenant.
 *
 * Aligned with the backend `tenant_invoices.status` PostgreSQL CHECK constraint.
 *
 * - `'draft'` — Internal placeholder; not yet visible to the tenant.
 * - `'sent'` — Visible in the tenant billing dashboard, payable via Stripe.
 * - `'paid'` — Stripe PaymentIntent succeeded; balance credited.
 * - `'overdue'` — Past `due_date` without payment.
 * - `'cancelled'` — Voided (e.g. duplicate invoice, billing error).
 *
 * @since 2.22.0
 */
export type TenantInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

/**
 * Tenant ledger transaction type — direction of a balance ledger entry.
 *
 * Aligned with the backend `tenant_transactions.type` PostgreSQL CHECK
 * constraint.
 *
 * - `'credit'` — Increases the tenant balance (top-up, pack purchase,
 *   refund of a failed invoice transmission).
 * - `'debit'` — Decreases the tenant balance (invoice transmission fee,
 *   signature request fee, monthly subscription debit).
 *
 * @since 2.22.0
 */
export type TenantTransactionType = 'debit' | 'credit';

/**
 * Onboarding session status — lifecycle of a partner-led onboarding flow
 * (publishable key initiated, e.g. via the `<scell-onboarding>` widget).
 *
 * Aligned with the backend `OnboardingSession::STATUS_*` constants (9 values).
 *
 * - `'initiated'` — Session created, no buyer interaction yet.
 * - `'siret_verified'` — INSEE / Etalab lookup succeeded; legal identity known.
 * - `'vat_verified'` — VIES VAT number cross-check passed (EU intra-community).
 * - `'documents_pending'` — Buyer was prompted to upload KYB documents.
 * - `'documents_submitted'` — Buyer uploaded the requested documents.
 * - `'under_review'` — Internal compliance review in progress.
 * - `'completed'` — Sub-tenant successfully provisioned and active.
 * - `'failed'` — Onboarding failed (KYB rejected, lookup error, timeout).
 * - `'expired'` — Session passed its TTL without buyer completion.
 *
 * @since 2.22.0
 */
export type OnboardingSessionStatus =
  | 'initiated'
  | 'siret_verified'
  | 'vat_verified'
  | 'documents_pending'
  | 'documents_submitted'
  | 'under_review'
  | 'completed'
  | 'failed'
  | 'expired';

// ============================================================================
// Micro-Entrepreneur Thresholds + Fiscal Status (since v2.29.0)
// ============================================================================

/** Revenue category for French micro-entrepreneur thresholds. */
export type RevenueCategory = 'goods' | 'service' | 'accommodation';

/** Which threshold a gauge measures. */
export type ThresholdKind =
  | 'vat_franchise_base'
  | 'vat_franchise_majored'
  | 'micro_ceiling';

/** Highest alert level reached on a gauge (null = below first warning). */
export type ThresholdAlertLevel =
  | 'warning_80'
  | 'warning_90'
  | 'base_exceeded'
  | 'majored_exceeded'
  | 'micro_ceiling_exceeded';

/**
 * A single threshold gauge: cumulative HT revenue for a category against an
 * applicable threshold, with the reached alert level and a projected crossing
 * date (extrapolated at the current pace, null if not trending to cross).
 *
 * Field names mirror the raw API response (snake_case) returned by
 * `GET /api/v1/tenant/sub-tenants/{id}/thresholds`.
 *
 * @since 2.29.0
 */
export interface ThresholdGauge {
  category: RevenueCategory;
  kind: ThresholdKind;
  /** Cumulative HT revenue for the category (EUR). */
  revenue: number;
  /** Applicable threshold amount (pro-rated on a first partial year). */
  threshold: number;
  /** revenue / threshold * 100, rounded to 1 decimal. */
  percent: number;
  level: ThresholdAlertLevel | null;
  /** True once the threshold is crossed (requires action). */
  actionable: boolean;
  /** ISO date (YYYY-MM-DD) of projected crossing, or null. */
  projected_crossing_date: string | null;
}

/** Full threshold report for a sub-tenant for a fiscal year. @since 2.29.0 */
export interface ThresholdReport {
  sub_tenant_id: string;
  tenant_id: string;
  fiscal_year: number;
  /** ISO 8601 timestamp. */
  generated_at: string;
  gauges: ThresholdGauge[];
  /** Gauges that newly crossed an alert level on this evaluation. */
  new_alerts: ThresholdGauge[];
}

/** Response from `scell_get_subtenant_thresholds`. @since 2.29.0 */
export interface ThresholdsResult {
  data: ThresholdReport;
  /** Non-contractual fiscal disclaimer (not tax advice). */
  disclaimer: string;
}

export type FiscalRegime = 'micro' | 'reel';
export type VatStatus = 'franchise' | 'liable';
export type ActivityType = 'goods' | 'service' | 'accommodation' | 'mixed';

/**
 * Body for `scell_update_subtenant_fiscal_status`
 * (PATCH /api/v1/tenant/sub-tenants/{id}/fiscal-status).
 *
 * Setting `vat_status: 'liable'` flips Scell.io billing to charge VAT
 * (subsequent invoices carry VAT and drop the art. 293 B franchise mention);
 * a `vat_number` becomes required (here or already on the sub-tenant).
 *
 * @since 2.29.0
 */
export interface UpdateFiscalStatusInput {
  fiscal_regime?: FiscalRegime;
  vat_status?: VatStatus;
  activity_type?: ActivityType;
  /** ISO date (YYYY-MM-DD) of activity start, or null. */
  activity_start_date?: string | null;
  vat_number?: string | null;
}

/**
 * Body for `scell_simulate_subtenant_thresholds`
 * (POST /api/v1/tenant/sub-tenants/{id}/thresholds/simulate).
 *
 * Projects the threshold gauges AS IF a hypothetical invoice of `amount`
 * (net/HT) were issued in `category`. Read-only. @since 2.30.0
 */
export interface SimulateThresholdInput {
  amount: number;
  category: RevenueCategory;
}

// ============================================================================
// Recurring Invoices (since v2.32.0)
// ============================================================================

/**
 * Lifecycle status of a recurring invoice schedule.
 *
 * - `active` — The schedule is running; occurrences are generated on each due
 *   date until the recurrence end is reached.
 * - `paused` — Temporarily suspended; no occurrence is generated while paused.
 *   Resume with `scell_activate_recurring_invoice`.
 * - `completed` — The recurrence end was reached (`end_mode='on_date'` past the
 *   end date, or `end_mode='after_occurrences'` once `max_occurrences` were
 *   emitted). Terminal.
 * - `cancelled` — Manually cancelled with `scell_cancel_recurring_invoice`.
 *   Terminal — no further occurrence is ever generated.
 */
export type RecurringInvoiceStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

/** Unit of the recurrence interval. */
export type RecurrenceIntervalUnit = 'day' | 'week' | 'month' | 'year';

/**
 * How the recurrence ends.
 *
 * - `never` — Runs indefinitely until manually paused/cancelled (default).
 * - `on_date` — Stops after `end_date` (inclusive).
 * - `after_occurrences` — Stops once `max_occurrences` invoices have been
 *   generated.
 */
export type RecurringInvoiceEndMode = 'never' | 'on_date' | 'after_occurrences';

/**
 * Whether each generated occurrence is emitted automatically or left as a draft.
 *
 * - `draft` — Each occurrence creates a DRAFT invoice for human review (it is
 *   NOT transmitted to the PDP nor emailed). The tenant validates it manually.
 * - `auto_send` — Each occurrence is submitted to the PDP (PEPPOL / SuperPDP)
 *   AND emailed to the buyer automatically. Use with care — every occurrence
 *   bills the buyer.
 */
export type RecurringInvoiceEmissionMode = 'draft' | 'auto_send';

/**
 * Recurrence rule for a recurring invoice schedule.
 *
 * The combination of `intervalUnit` + `intervalCount` defines the cadence
 * (e.g. `intervalUnit='month'`, `intervalCount=1` = monthly; `intervalUnit='week'`,
 * `intervalCount=2` = every two weeks).
 *
 * `dayOfMonth` (for monthly/yearly cadences) and `dayOfWeek` (for weekly
 * cadences) pin the occurrence to a specific calendar day.
 *
 * **Short-month clamping:** `dayOfMonth=31` is clamped to the last day of
 * shorter months (e.g. Feb 28/29, Apr 30). Same for `29`/`30` in February.
 *
 * @since 2.32.0
 */
export interface RecurrenceRule {
  /** Interval unit: day | week | month | year. */
  intervalUnit: RecurrenceIntervalUnit;
  /** Number of interval units between occurrences (default 1). */
  intervalCount?: number;
  /**
   * Day of the month (1–31) for monthly/yearly cadences.
   * `31` is clamped to the last day of shorter months.
   */
  dayOfMonth?: number;
  /** Day of the week (1=Monday … 7=Sunday) for weekly cadences. */
  dayOfWeek?: number;
}

/**
 * A recurring invoice schedule (abonnement / facturation récurrente).
 *
 * Defines a template invoice plus a recurrence rule. On each due date Scell.io
 * generates one occurrence — a real invoice billed to the buyer — either as a
 * draft (`emissionMode='draft'`) or auto-sent to the PDP + emailed
 * (`emissionMode='auto_send'`). The schedule keeps running until the recurrence
 * end is reached (`endMode`) or it is paused/cancelled.
 *
 * Anti-IDOR: scoped to the tenant (and optional sub-tenant) resolved from the
 * `X-API-Key` header.
 *
 * @since 2.32.0
 */
export interface RecurringInvoice {
  /** Unique schedule UUID. */
  id: string;
  /** Human-readable title of the schedule (e.g. "Abonnement mensuel ACME"). */
  title: string;
  /** Current lifecycle status. */
  status: RecurringInvoiceStatus;
  /** Sub-tenant UUID (null for master-tenant schedules). */
  subTenantId: string | null;
  /** UUID of the buyer registry entry (if set at creation). */
  buyerId: string | null;
  /** Buyer company snapshot (null if buyerId was used at creation). */
  buyer: Company | null;
  /** Optional shipping address (Factur-X BG-13 shape). */
  buyerShippingAddress?: ShippingAddress | null;
  /** Line items rendered on every generated occurrence. */
  lines: InvoiceLine[];
  /** Currency (ISO 4217, e.g. "EUR"). */
  currency: string;
  /** Output format of the generated invoices: facturx | ubl | cii. */
  outputFormat: 'facturx' | 'ubl' | 'cii';
  /** Payment terms text applied to each occurrence. */
  paymentTerms: string | null;
  /** Recurrence rule (cadence + calendar pinning). */
  recurrence: RecurrenceRule;
  /** First occurrence date (ISO 8601 YYYY-MM-DD). */
  startDate: string;
  /** How the recurrence ends. */
  endMode: RecurringInvoiceEndMode;
  /** End date (ISO 8601) when endMode='on_date', else null. */
  endDate: string | null;
  /** Maximum number of occurrences when endMode='after_occurrences', else null. */
  maxOccurrences: number | null;
  /** Whether each occurrence is auto-sent (PDP + email) or left as a draft. */
  emissionMode: RecurringInvoiceEmissionMode;
  /** Days before the due date to notify the buyer (null = no pre-notification). */
  notifyBeforeDays: number | null;
  /** Number of occurrences already generated. */
  occurrencesGenerated: number;
  /** Date of the next scheduled occurrence (ISO 8601), or null if completed/cancelled. */
  nextRunDate: string | null;
  /** Date of the last generated occurrence (ISO 8601), or null if none yet. */
  lastRunDate: string | null;
  /** Free-form metadata. */
  metadata?: Record<string, unknown> | null;
  /** Creation timestamp (ISO 8601 UTC). */
  createdAt: string;
  /** Last update timestamp (ISO 8601 UTC). */
  updatedAt: string;
}

/**
 * Input for creating a recurring invoice schedule
 * (`POST /api/v1/recurring-invoices`).
 *
 * Same line shape as `InvoiceInput` (`lines: InvoiceLine[]`). Buyer can be
 * provided via `buyerId` (registry, snapshot semantics) OR inline through the
 * flat `buyerName` / `buyerCountry` / … fields. The server auto-generates the
 * occurrence invoice numbers when each occurrence is emitted.
 *
 * NOTE: types use camelCase (LLM-friendly, aligned with
 * `InvoiceInput.invoiceNumber`). The REST API expects snake_case
 * (`sub_tenant_id`, `buyer_id`, `buyer_name`, `buyer_country`,
 * `buyer_is_individual`, `buyer_siret`, `buyer_vat_number`, `buyer_email`,
 * `buyer_address`, `buyer_shipping_address`, `output_format`, `payment_terms`,
 * `start_date`, `end_mode`, `end_date`, `max_occurrences`, `emission_mode`,
 * `notify_before_days`, and on `recurrence`: `interval_unit`, `interval_count`,
 * `day_of_month`, `day_of_week`) — the MCP server consuming this client config
 * maps camelCase → snake_case before the POST.
 *
 * @since 2.32.0
 */
export interface CreateRecurringInvoiceInput {
  /** Human-readable title of the schedule (required). */
  title: string;
  /**
   * Optional sub-tenant scoping (UUID).
   * Anti-IDOR: 403 if the sub-tenant does not belong to the API key's tenant.
   */
  subTenantId?: string;
  /**
   * UUID of an existing Buyer registry entry. When provided, the API snapshots
   * the current buyer data onto each generated occurrence.
   */
  buyerId?: string;
  /** Inline buyer name (when not using buyerId). */
  buyerName?: string;
  /** Inline buyer country (ISO 3166-1 alpha-2). */
  buyerCountry?: string;
  /** B2C flag — when true, buyer SIRET / VAT number become optional. */
  buyerIsIndividual?: boolean;
  /** Inline buyer SIRET (14 digits, required for French B2B). */
  buyerSiret?: string;
  /** Inline buyer VAT number (e.g. FR12345678901). */
  buyerVatNumber?: string;
  /** Inline buyer email (used for occurrence delivery when emissionMode='auto_send'). */
  buyerEmail?: string;
  /** Inline buyer billing address. */
  buyerAddress?: {
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    region?: string;
    country: string;
  };
  /** Optional shipping address (Factur-X BG-13 shape). */
  buyerShippingAddress?: ShippingAddress;
  /** Currency (ISO 4217, defaults to EUR). */
  currency?: string;
  /** Output format of generated invoices: facturx | ubl | cii (defaults to facturx). */
  outputFormat?: 'facturx' | 'ubl' | 'cii';
  /** Payment terms text applied to each occurrence. */
  paymentTerms?: string;
  /** Line items rendered on every occurrence (minimum 1, required). */
  lines: InvoiceLine[];
  /** Recurrence rule (cadence + calendar pinning, required). */
  recurrence: RecurrenceRule;
  /** First occurrence date (ISO 8601 YYYY-MM-DD, required). */
  startDate: string;
  /** How the recurrence ends (defaults to 'never'). */
  endMode?: RecurringInvoiceEndMode;
  /** End date (ISO 8601) — required when endMode='on_date'. */
  endDate?: string;
  /** Maximum occurrences — required when endMode='after_occurrences'. */
  maxOccurrences?: number;
  /** Auto-send (PDP + email) or draft each occurrence (defaults to 'draft'). */
  emissionMode?: RecurringInvoiceEmissionMode;
  /** Days before the due date to notify the buyer. */
  notifyBeforeDays?: number;
  /** Free-form metadata. */
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating a recurring invoice schedule (partial update)
 * (`PUT /api/v1/recurring-invoices/{id}`).
 *
 * Every field is optional — only the provided fields are changed. Changing the
 * recurrence or start date affects FUTURE occurrences only; already generated
 * occurrences (invoices) are immutable (ISCA).
 *
 * @since 2.32.0
 */
export interface UpdateRecurringInvoiceInput {
  title?: string;
  subTenantId?: string;
  buyerId?: string;
  buyerName?: string;
  buyerCountry?: string;
  buyerIsIndividual?: boolean;
  buyerSiret?: string;
  buyerVatNumber?: string;
  buyerEmail?: string;
  buyerAddress?: CreateRecurringInvoiceInput['buyerAddress'];
  buyerShippingAddress?: ShippingAddress;
  currency?: string;
  outputFormat?: 'facturx' | 'ubl' | 'cii';
  paymentTerms?: string;
  lines?: InvoiceLine[];
  recurrence?: RecurrenceRule;
  startDate?: string;
  endMode?: RecurringInvoiceEndMode;
  endDate?: string;
  maxOccurrences?: number;
  emissionMode?: RecurringInvoiceEmissionMode;
  notifyBeforeDays?: number;
  metadata?: Record<string, unknown>;
}
