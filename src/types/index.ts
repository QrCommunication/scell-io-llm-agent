/**
 * Scell.io MCP Client Type Definitions
 */

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
 * Company information for invoices
 */
export interface Company {
  /** Company name */
  name: string;
  /** SIRET number (14 digits) */
  siret: string;
  /** VAT number (optional) */
  vatNumber?: string;
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
}

/**
 * Invoice line item
 */
export interface InvoiceLine {
  /** Line description */
  description: string;
  /** Quantity */
  quantity: number;
  /** Unit price (excluding tax) */
  unitPrice: number;
  /** VAT rate (percentage, e.g., 20 for 20%) */
  vatRate: number;
  /** Unit of measure (optional) */
  unit?: string;
  /** Product/service code (optional) */
  productCode?: string;
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
  /** Buyer/customer information */
  buyer: Company;
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
}

/**
 * Created invoice response
 */
export interface Invoice {
  /** Unique invoice ID */
  id: string;
  /** Invoice number */
  invoiceNumber: string;
  /** Invoice status */
  status: 'draft' | 'pending' | 'sent' | 'paid' | 'cancelled' | 'disputed';
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
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

// ============================================================================
// Credit Note Types
// ============================================================================

/** Credit note status */
export type CreditNoteStatus = 'draft' | 'sent' | 'cancelled';

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
  /** Line items */
  items?: CreditNoteLine[];
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

// ============================================================================
// Signature Types
// ============================================================================

/**
 * Signer information
 */
export interface Signer {
  /** Signer\'s full name */
  name: string;
  /** Signer\'s email address */
  email: string;
  /** Signer\'s phone number (for SMS OTP, optional) */
  phone?: string;
  /** Signing order (for sequential signing) */
  order?: number;
  /** Signer role/title */
  role?: string;
}

/**
 * Input for creating a signature request
 */
export interface SignatureInput {
  /** Document to sign (base64 encoded) */
  document: string;
  /** Document filename */
  filename: string;
  /** Document MIME type */
  mimeType: string;
  /** List of signers */
  signers: Signer[];
  /** Signature type */
  signatureType?: 'simple' | 'advanced' | 'qualified';
  /** Signature level (eIDAS) */
  signatureLevel?: 'SES' | 'AES' | 'QES';
  /** Expiration date (ISO 8601 format) */
  expiresAt?: string;
  /** Email subject for notification */
  emailSubject?: string;
  /** Email message for notification */
  emailMessage?: string;
  /** Webhook URL for status updates */
  webhookUrl?: string;
  /** Redirect URL after signing */
  redirectUrl?: string;
}

/**
 * Signature request response
 */
export interface SignatureRequest {
  /** Unique signature request ID */
  id: string;
  /** Request status */
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'expired' | 'cancelled';
  /** Document filename */
  filename: string;
  /** Signers with their status */
  signers: Array<Signer & {
    status: 'pending' | 'signed' | 'declined';
    signedAt?: string;
  }>;
  /** Signing URL (for embedded signing) */
  signingUrl?: string;
  /** Download URL for signed document */
  downloadUrl?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Expiration timestamp */
  expiresAt?: string;
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
 * Fiscal closing record
 */
export interface FiscalClosing {
  id: string;
  closingDate: string;
  closingType: string;
  status: string;
  entriesCount: number;
  totalDebit: number;
  totalCredit: number;
  chainHash?: string;
  environment?: string;
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

// ============================================================================
// Billing Types
// ============================================================================

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
 * Sub-tenant
 */
export interface SubTenant {
  id: string;
  externalId?: string | null;
  name: string;
  siret?: string | null;
  siren?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: {
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    country?: string;
  } | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Input for creating a sub-tenant
 */
export interface SubTenantInput {
  externalId?: string;
  name: string;
  siret?: string;
  siren?: string;
  email?: string;
  phone?: string;
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
