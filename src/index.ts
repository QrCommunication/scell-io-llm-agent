/**
 * @scell/mcp-client
 *
 * MCP client configuration generator for Scell.io API
 * Supports Claude Desktop, Cursor, VS Code, and other MCP-compatible clients
 *
 * @packageDocumentation
 */

// Export all types
export type {
  // Configuration types
  ScellMcpConfig,
  McpServerConfig,
  McpClientConfig,

  // Invoice types
  Company,
  InvoiceLine,
  InvoiceInput,
  Invoice,

  // Credit Note types
  CreditNote,
  CreditNoteInput,
  CreditNoteLine,
  CreditNoteStatus,

  // Signature types
  Signer,
  SignatureInput,
  SignatureRequest,

  // Fiscal Compliance types
  FiscalComplianceData,
  FiscalIntegrityReport,
  FiscalClosing,
  FiscalEntry,
  FiscalKillSwitchStatus,
  FiscalRule,
  FiscalAnchor,
  FiscalAttestation,

  // Billing types
  BillingInvoice,
  BillingUsage,
  BillingTransaction,

  // Statistics types
  StatsOverview,
  StatsMonthly,

  // Tenant types
  SubTenant,
  SubTenantInput,
  TenantProfile,
  TenantBalance,

  // Result types
  ToolResult,
  PaginatedResult,

  // API types
  HealthCheckResponse,
  ApiKeyValidationResponse,

  // Webhook types
  WebhookEventType,
  WebhookPayload,
} from './types/index.js';

// Export configuration generators
export {
  generateClaudeDesktopConfig,
  generateCursorConfig,
  generateVSCodeConfig,
  generateGenericConfig,
  generateConfigWithInstructions,
  getConfigPath,
  validateConfig,
} from './config/generator.js';

// Export default configuration function
export { generateGenericConfig as default } from './config/generator.js';
