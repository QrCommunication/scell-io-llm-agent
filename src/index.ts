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
  SignatureAttachment,
  SignatureRequest,
  SignatureListQuery,
  TenantSignatureListQuery,
  InitialsBlock,
  InitialsPosition,
  Mention,
  DateBlock,

  // Fiscal Compliance types
  FiscalComplianceData,
  FiscalIntegrityReport,
  FiscalClosing,
  FiscalEntry,
  FiscalKillSwitchStatus,
  FiscalRule,
  FiscalAnchor,
  FiscalAttestation,
  ISCADocument,

  // Billing types
  BillingInvoice,
  BillingUsage,
  BillingTransaction,
  PaymentIntent,

  // Statistics types
  StatsOverview,
  StatsMonthly,

  // Tenant types
  SubTenant,
  SubTenantInput,
  SubTenantSummary,
  SubTenantStatusResult,
  SubTenantResumeUrlResult,
  SubTenantSuperPDPAuthorizeResponse,
  SubTenantDeleteOptions,
  SubTenantDeleteResult,
  SubTenantErrorCode,
  SubTenantHasCompaniesError,
  SubTenantHasFiscalEntriesError,
  SubTenantMissingAccessTokenError,
  OnboardingStatus,
  SuperPDPCompanyVerificationStatus,
  SuperPDPUserIdentityVerificationStatus,
  RecommendedAction,
  CompanyData,
  IdentityFormData,
  SireneLookupResult,
  CreateSubTenantWidgetInput,
  CreateSubTenantWidgetResult,
  TenantProfile,
  TenantBalance,

  // Result types
  ToolResult,
  PaginatedResult,

  // API types
  HealthCheckResponse,
  ApiKeyValidationResponse,

  // Onboarding types
  OnboardingAuthorizeResponse,
  OnboardingCallbackResponse,
  OnboardingSession,
  OnboardingSessionInput,

  // Webhook types
  WebhookEventType,
  WebhookPayload,

  // Payment Schedule types (since 2.13.0)
  PaymentScheduleAmountType,
  PaymentScheduleLineStatus,
  PaymentScheduleLineInput,
  PaymentSchedulePatchInput,
  PaymentScheduleLine,
  NextDueLine,
  OverdueLine,
  PaymentSummaryInvoiceStatus,
  PaymentSummary,
  PaymentSchedulePreset,
  InvoiceSendByEmailResult,

  // Branding types (since 2.13.0)
  Branding,
  BrandingInput,
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
