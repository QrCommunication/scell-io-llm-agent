/**
 * Country Company Reference Types
 *
 * Served by the authenticated endpoint `GET /api/v1/reference/countries[/{code}]`
 * (Sanctum or sk_/pk_ API key). Lets an agent build a country-aware buyer/seller form:
 * per country it exposes the VAT number, the national company-registration
 * identifier (register + format) and the known legal forms.
 *
 * @since 2.29.0
 */

/** Known legal form of a country (stable code + display label). */
export interface LegalForm {
  /** Stable form code, e.g. `SAS`, `GMBH`, `LTD`. */
  code: string;
  /** Human-readable label for a dropdown. */
  label: string;
}

/** VAT / tax identification metadata for a country. */
export interface CountryVatInfo {
  label: string;
  example: string | null;
  /** Anchored JS-compatible regex (`new RegExp(regex)`), null if unverified. */
  regex: string | null;
  /** Whether the number is checkable against the EU VIES registry. */
  vies_checkable: boolean;
}

/** National company-registration identifier metadata for a country. */
export interface CountryNationalIdInfo {
  label: string;
  /** ISO 6523 / Peppol EAS scheme of the register, e.g. `0002` (SIRENE FR). */
  scheme: string | null;
  example: string | null;
  /** Anchored JS-compatible regex, null if format unverified for this country. */
  regex: string | null;
  required_for_b2b: boolean;
}

/**
 * Per-country company reference. Returned as a list by
 * `GET /api/v1/reference/countries` (`{ data: CountryReference[] }`) and singly
 * by `GET /api/v1/reference/countries/{code}` (`{ data: CountryReference }`).
 */
export interface CountryReference {
  /** ISO 3166-1 alpha-2 code. */
  code: string;
  name: string | null;
  /** False when the country is not catalogued (permissive fallback). */
  known: boolean;
  is_eu: boolean;
  currency: string | null;
  vat: CountryVatInfo;
  national_id: CountryNationalIdInfo;
  legal_forms: LegalForm[];
}
