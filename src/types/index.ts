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
 * 21 champs alignes sur la spec OpenAPI.com EU-SES v1.0.17. Les couleurs
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
 */
export interface SignaturePosition {
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
  /** Liste de 1 a 10 signataires. */
  signers: SignerInput[];
  /** Positions visuelles des zones de signature. */
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
