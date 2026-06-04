/**
 * VAT Context Resolution Types
 *
 * Used by `scell_resolve_vat_context` and by the auto-resolution path
 * inside `scell_create_invoice` when `lines[].category` is provided
 * without an explicit `vatRate`.
 *
 * @since 2.19.0
 */

// ============================================================================
// VatCategory — EN16931 categories exposed by the Scell.io resolver
// ============================================================================

/**
 * VAT category code as understood by the Scell.io tax resolver.
 *
 * Maps to EN16931 duty-or-tax-or-fee category codes:
 * - `STANDARD`        → S  (TVA de droit commun : 20 % FR)
 * - `INTERMEDIATE`    → S  (taux intermédiaire : 10 % FR)
 * - `REDUCED`         → AA (taux réduit : 5,5 % FR)
 * - `SUPER_REDUCED`   → AA (super-réduit : 2,1 % FR)
 * - `ZERO_RATED`      → Z  (0 % — opération à taux zéro)
 * - `EXEMPT`          → E  (exonérée — art. 261 CGI)
 * - `REVERSE_CHARGE`  → AE (autoliquidation **services** intra-UE B2B — art. 283-2 CGI)
 * - `OUT_OF_SCOPE`    → O  (services preneur hors UE — art. 259-1 CGI)
 * - `INTRACOM_GOODS`  → K  (livraison intracommunautaire de **biens** — art. 262 ter I CGI)
 * - `EXPORT`          → G  (exportation de **biens** hors UE — art. 262 I CGI)
 * - `FRANCHISE_BASE`  → E  (franchise en base auto-entrepreneur — art. 293 B CGI)
 * - `EXEMPT_TRAINING` → E  (formation professionnelle continue — art. 261-4-4°a CGI)
 */
export type VatCategory =
  | 'STANDARD'
  | 'INTERMEDIATE'
  | 'REDUCED'
  | 'SUPER_REDUCED'
  | 'ZERO_RATED'
  | 'EXEMPT'
  | 'REVERSE_CHARGE'
  | 'OUT_OF_SCOPE'
  | 'INTRACOM_GOODS'
  | 'EXPORT'
  | 'FRANCHISE_BASE'
  | 'EXEMPT_TRAINING';

// ============================================================================
// VatResolution — single line resolution result from the backend resolver
// ============================================================================

/**
 * VAT resolution result for a single invoice line.
 *
 * Returned by `POST /api/v1/tenant/buyers/vat-context` and surfaced by
 * `scell_resolve_vat_context`.
 *
 * @since 2.19.0
 */
export interface VatResolution {
  /**
   * Applicable VAT rate in percentage.
   * `0` for REVERSE_CHARGE, EXEMPT, and OUT_OF_SCOPE.
   * Example: `20`, `10`, `5.5`, `2.1`, `0`.
   */
  rate: number;

  /**
   * Resolved VAT category.
   * The LLM should propagate this as `lines[].category` in `scell_create_invoice`
   * so the backend can generate the correct EN16931 tax node.
   */
  category: VatCategory;

  /**
   * EN16931 duty-or-tax-or-fee category code.
   * Informative — do not pass to `scell_create_invoice` directly.
   * Example: `"S"`, `"AE"`, `"E"`, `"Z"`, `"AA"`, `"O"`.
   */
  en16931Code: string;

  /**
   * CGI exemption reason, populated when `category` is `EXEMPT` or `OUT_OF_SCOPE`.
   * Surfaced in the invoice legal mentions (BT-120).
   * Example: `"Article 261 CGI"`, `"Article 293 B CGI"`.
   * `null` for taxable categories.
   */
  exemptionReason: string | null;

  /**
   * Human-readable justification of the rule applied (for LLM explanation).
   * Example: `"Prestation de service B2B UE : lieu de taxation chez l'acheteur (art. 259-1 CGI)"`.
   * `null` for trivial domestic STANDARD cases.
   */
  justification: string | null;

  /**
   * `true` when the backend resolved the rate automatically from known rules
   * (buyer country + VAT number + category). `false` when the input was
   * ambiguous and the rate was derived from a fallback.
   */
  isAutoResolved: boolean;

  /**
   * Internal rule identifier applied by the backend resolver.
   * Informative — may change across API versions.
   * Example: `"R5_259A_force_seller_country"`, `"R1_domestic_standard"`.
   */
  rule: string | null;
}

// ============================================================================
// LineVatContext — input for the VAT context resolver
// ============================================================================

/**
 * Input describing the VAT context of a single invoice line.
 *
 * Passed inside the `line` field of `POST /api/v1/tenant/buyers/vat-context`
 * and inside `scell_resolve_vat_context`.
 *
 * @since 2.19.0
 */
export interface LineVatContext {
  /**
   * Broad VAT category hint provided by the caller.
   * The resolver uses it as a starting point; the final `category` in
   * `VatResolution` may differ (e.g. STANDARD → REVERSE_CHARGE).
   */
  category: VatCategory;

  /**
   * ISO 3166-1 alpha-2 country code of the place of supply.
   * Defaults to `"FR"` (France) if omitted.
   * Relevant for the art. 259 CGI rules (B2B cross-border services).
   * Example: `"FR"`, `"DE"`, `"US"`.
   */
  placeOfSupply?: string;

  /**
   * Free-text description of the service nature.
   * Helps the resolver pick the correct exception (e.g. "location de meublé"
   * for the 10 % INTERMEDIATE rate, "transport de personnes" for 10 %).
   * Optional — omit for generic goods or standard services.
   */
  serviceNature?: string | null;
}

// ============================================================================
// VatContextRequest — full body for POST /api/v1/tenant/buyers/vat-context
// ============================================================================

/**
 * Request body for `POST /api/v1/tenant/buyers/vat-context`
 * and for the `scell_resolve_vat_context` MCP tool.
 *
 * Exactly one of `buyerId` or `buyer` must be provided.
 *
 * @since 2.19.0
 */
export interface VatContextRequest {
  /**
   * UUID of an existing Buyer in the registry.
   * The API loads the buyer's country and VAT number to determine the correct
   * VAT rule. Takes precedence over the inline `buyer` field if both are provided.
   */
  buyerId?: string;

  /**
   * Inline buyer data when no registry entry exists yet.
   * Provide at minimum `country` and `vatNumber` (for B2B cross-border rules).
   */
  buyer?: {
    /** ISO 3166-1 alpha-2 country code. */
    country: string;
    /** VAT registration number (e.g. `"DE123456789"`). Signals B2B intracom. */
    vatNumber?: string;
    /** `true` if the buyer is a private individual (B2C). Affects rate selection. */
    isIndividual?: boolean;
  };

  /** VAT context for the line being evaluated. */
  line: LineVatContext;
}

// ============================================================================
// VatContextResponse — response from POST /api/v1/tenant/buyers/vat-context
// ============================================================================

/**
 * Response from `POST /api/v1/tenant/buyers/vat-context`
 * and from the `scell_resolve_vat_context` MCP tool.
 *
 * @since 2.19.0
 */
export interface VatContextResponse {
  /** The resolved VAT rule for the queried line. */
  resolution: VatResolution;

  /**
   * Non-blocking warnings emitted by the resolver.
   * Typical warnings: missing VAT number for an EU buyer, ambiguous service
   * nature requiring manual confirmation, etc.
   * Empty array when no warnings.
   */
  warnings: string[];
}
