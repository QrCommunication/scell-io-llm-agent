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
  InvoiceStatus,
  RefundStatus,
  InvoiceType,
  InvoiceTemplateKind,
  InvoiceArchiveStatus,
  PaymentMeansCode,

  // Credit Note types
  CreditNote,
  CreditNoteInput,
  CreditNoteLine,
  CreditNoteStatus,
  CreditNoteType,

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
  SignatureArchiveStatus,

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
  SubTenantOnboardingStatus,
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
  TenantKybStatus,
  TenantInvoiceStatus,
  TenantTransactionType,
  CompanyStatus,
  ApiKeyStatus,

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
  OnboardingSessionStatus,

  // Webhook types
  WebhookEventType,
  WebhookPayload,

  // Payment Schedule types (since 2.13.0)
  PaymentScheduleAmountType,
  PaymentScheduleLineAmountType,
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

  // Quote types (since 2.11.0)
  QuoteStatus,
  QuoteAuditAction,

  // Branding types (since 2.13.0)
  Branding,
  BrandingInput,

  // VAT Context Resolution types (since 2.19.0)
  VatCategory,
  VatResolution,
  LineVatContext,
  VatContextRequest,
  VatContextResponse,

  // Suppliers Registry types (since 2.26.0)
  Supplier,
  SupplierInput,

  // Country company reference types (since 2.29.0)
  CountryReference,
  CountryVatInfo,
  CountryNationalIdInfo,
  LegalForm,

  // Recurring Invoice types (since 2.32.0)
  RecurringInvoice,
  CreateRecurringInvoiceInput,
  UpdateRecurringInvoiceInput,
  RecurrenceRule,
  RecurringInvoiceStatus,
  RecurrenceIntervalUnit,
  RecurringInvoiceEndMode,
  RecurringInvoiceEmissionMode,
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
