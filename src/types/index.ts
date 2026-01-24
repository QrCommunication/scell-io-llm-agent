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
  status: 'draft' | 'pending' | 'sent' | 'paid' | 'cancelled';
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
  /** Signer's full name */
  name: string;
  /** Signer's email address */
  email: string;
  /** Signer's phone number (for SMS OTP, optional) */
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
