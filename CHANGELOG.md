# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),

## [2.13.0] - 2026-05-21

### Added

- **6 new MCP tools** for the Payment Schedule (échéancier de paiement) surface
  on accepted quotes — full lifecycle from plan creation to deposit-invoice
  conversion:
  - `scell_set_quote_payment_schedule` — Create or replace the full schedule
    atomically. `POST /api/v1/quotes/{id}/payment-schedule` with
    `{ lines: PaymentScheduleLineInput[] }`. Blocked when the quote is
    accepted/converted/cancelled. Returns `PaymentScheduleLine[]`.
  - `scell_patch_quote_payment_schedule` — Partial update (add / update /
    remove lines) in a single atomic call. Only `pending` lines can be mutated.
    `PATCH /api/v1/quotes/{id}/payment-schedule`.
  - `scell_delete_quote_payment_schedule` — Remove all lines from a schedule.
    `DELETE /api/v1/quotes/{id}/payment-schedule`. Blocked if any line is
    `invoiced` or if the quote is accepted/converted.
  - `scell_get_quote_payment_summary` — Real-time tracker of invoiced vs.
    remaining TTC amounts, overdue lines, and SuperPDP enrichment per invoice.
    `GET /api/v1/quotes/{id}/payment-summary`. Returns `PaymentSummary`.
  - `scell_convert_quote_schedule_line_to_deposit` — Convert a specific
    `pending` line into a deposit invoice (acompte). Optional overrides:
    `due_date`, `label`, `send_email`. Returns `Invoice` with
    `invoice_type='deposit'`. `POST /api/v1/quotes/{id}/payment-schedule/lines/{line_id}/convert`.
  - `scell_list_payment_schedule_presets` — List server-defined preset schedules
    (30/70, 50/50, 30/30/40, 3 monthly instalments). Returns
    `PaymentSchedulePreset[]` with ready-to-use `lines` arrays the LLM can
    suggest to users. `GET /api/v1/payment-schedule/presets`.

- **1 new invoice tool**:
  - `scell_send_invoice_by_email` — Send an invoice to the buyer by email with
    optional `recipient_email` override, `cc[]`, and custom `message`. Auto-
    validates `draft` invoices before sending. Recipient resolved in cascade:
    explicit override → `buyer_billing_email` → `buyer_email` → quote buyer
    email → `422 BUYER_HAS_NO_EMAIL`. Returns `InvoiceSendByEmailResult` with
    `sent_to`, `sent_at`, `message_id`, `cc`.
    `POST /api/v1/invoices/{id}/send-by-email`.

- **4 new branding tools** for tenant and sub-tenant email customization:
  - `scell_get_tenant_branding` — `GET /api/v1/tenant/branding`. Returns the
    master-tenant's `Branding` with `is_complete` flag and `missing_fields[]`.
  - `scell_update_tenant_branding` — `PATCH /api/v1/tenant/branding`. Partial
    update of `brand_logo_url`, `brand_primary_color`, `brand_email_footer`,
    `brand_email_signature`. All optional; set `null` to clear.
  - `scell_get_sub_tenant_branding` — `GET /api/v1/sub-tenants/{id}/branding`.
    Anti-IDOR scoped to the calling tenant.
  - `scell_update_sub_tenant_branding` — `PATCH /api/v1/sub-tenants/{id}/branding`.
    Same fields as tenant branding but scoped to the sub-tenant.

- **12 new exported TypeScript types** (all backward-compatible, `@since 2.13.0`):
  - `PaymentScheduleAmountType` — `'percent' | 'amount'`
  - `PaymentScheduleLineStatus` — `'pending' | 'invoiced' | 'cancelled'`
  - `PaymentScheduleLineInput` — input for creating a schedule line
  - `PaymentSchedulePatchInput` — input for partial PATCH (add / update / remove)
  - `PaymentScheduleLine` — full schedule line response
  - `NextDueLine` — earliest upcoming due line in the summary
  - `OverdueLine` — overdue line in the summary
  - `PaymentSummaryInvoiceStatus` — SuperPDP / PEPPOL enrichment per invoice
  - `PaymentSummary` — full payment tracker response (scheduled vs. invoiced)
  - `PaymentSchedulePreset` — server-defined preset schedule template
  - `Branding` — branding response (tenant or sub-tenant)
  - `BrandingInput` — partial input for PATCH branding endpoints
  - `InvoiceSendByEmailResult` — response from the send-by-email endpoint

## [2.12.0] - 2026-05-16

### Added

- **3 new signature block parameters** for `scell_create_signature` (all optional,
  backward-compatible):
  - `initialsBlock` (`InitialsBlock`) — Automatic initials (paraphe) stamped on
    intermediate pages. Configurable mode (`auto` / `custom`), source, customText
    (max 8 chars), pages (`all` / `except_last` / `number[]`), position, fontSize,
    and color. Mapped to `initials_block` (snake_case) before the REST API call.
  - `mentions` (`Mention[]`) — Array of free-text / checkbox mentions placed on
    the document for the signer to fill in (e.g. "Lu et approuvé"). Each mention
    carries a label, required flag, optional signerIndex (0-based), position
    (page, x, y, w?, h?, unit), fallbackText, fontSize, and color. camelCase fields
    mapped to snake_case (`signer_index`, `fallback_text`, `font_size`) before the
    REST API call.
  - `dateBlock` (`DateBlock`) — Automatic date stamp placed at signing time.
    Configurable format string, IANA timezone, position (page / `'last'`, x, y,
    unit), fontSize, and color. Mapped to `date_block` (snake_case) before the
    REST API call.
- **3 new exported TypeScript types**: `InitialsBlock`, `Mention`, `DateBlock`
  (available from `@scell/mcp-client` v2.11.0).
- **llms.txt** updated: `scell_create_signature` now documents all 3 blocks with
  their full TypeScript shape, camelCase → snake_case mapping table, and 3 new
  example prompts (initials, mention, date).

- **11 new MCP tools** for the Quotes (Devis) surface — full lifecycle
  from creation to invoicing:

- **11 new MCP tools** for the Quotes (Devis) surface — full lifecycle
  from creation to invoicing:
  - `scell_create_quote` — Create a quote with buyer/seller/lines +
    validity date, signature_required flag, and deposit_schedule array.
    Returns `Quote`.
  - `scell_get_quote` — Retrieve a quote by ID with all lines,
    deposit schedule, and eIDAS signature evidence.
  - `scell_list_quotes` — List quotes with filters on status,
    sub_tenant_id (anti-IDOR), buyer_id, and date range.
  - `scell_update_quote` — Partial update (blocked on
    accepted/converted/cancelled quotes).
  - `scell_delete_quote` — Soft delete (blocked on
    accepted/converted/sent quotes — use `scell_cancel_quote` instead).
  - `scell_send_quote` — Send to buyer by email + generate a signed
    public URL (90-day TTL). Returns `{ public_url, sent_at }`.
  - `scell_cancel_quote` — Cancel a draft or sent quote with a reason.
  - `scell_duplicate_quote` — Clone into a new DRAFT with a fresh
    server-generated `quoteNumber`. Returns the new `Quote`.
  - `scell_convert_quote_to_deposit` — Convert an accepted quote to a
    deposit invoice (acompte). Params: `percent` XOR `amount`, optional
    `label` + `dueDate`. Returns `Invoice` with
    `invoice_type='deposit'` and `parent_quote_id` set. Multiple calls
    allowed.
  - `scell_convert_quote_to_balance` — Convert an accepted quote to the
    final balance invoice (solde). Balance is auto-computed as
    `quote.totalIncludingTax − Σ(deposits)`. Returns `Invoice` with
    `invoice_type='balance'` and `parent_invoice_ids` referencing all
    deposits.
  - `scell_get_quote_audit_log` — Full tamper-evident audit log with
    SHA-256 `chainHash` chain (legal proof of all state transitions).
    Returns `QuoteAuditEntry[]`.
- **New TypeScript types** exported from `@scell/mcp-client`:
  - `QuoteStatus` — union of all quote lifecycle states.
  - `QuoteLine` — line item with pre-computed totals.
  - `QuoteDepositScheduleItem` — percent/amount deposit plan entry.
  - `QuoteSignature` — eIDAS EU-SES buyer signature evidence.
  - `QuoteAuditEntry` — single tamper-evident audit log entry.
  - `Quote` — full quote response object.
  - `CreateQuoteInput` — creation payload.
  - `UpdateQuoteInput` — partial update payload.
  - `ConvertToDepositInput` — deposit conversion params.
  - `ConvertToBalanceInput` — balance conversion params.
- **Invoice extensions** (all optional, backward-compatible):
  - `Invoice.invoiceType?: 'standard' | 'deposit' | 'balance'` — type
    of invoice (deposit = acompte, balance = solde).
  - `Invoice.parentQuoteId?: string | null` — UUID of the originating
    quote.
  - `Invoice.parentInvoiceIds?: string[] | null` — list of deposit
    invoice IDs consolidated by a balance invoice.
- `scell_create_invoice` description updated to mention optional
  `invoice_type` and `parent_quote_id` for the direct creation flow
  (without going through the quote→convert tools).
- Total tool count is now **55** (was 44).

### Compat

- Fully backward compatible: all new Invoice fields are optional, no
  existing tool or type was modified.

## [2.10.0] - 2026-05-15

### Fixed (mirror of backend fix from the same day)

- The MCP tool `scell_list_fiscal_closings` was effectively broken in
  production: the underlying `GET /tenant/fiscal/closings` endpoint
  returned a generic `500 Server Error` whenever a daily closing had
  been anchored to OpenTimestamps. Backend root cause: the raw
  `ots_proof` BYTEA column (non-UTF8 magic bytes from the `.ots`
  format) crashed `json_encode()` server-side. The API now exposes the
  receipt encoded in base64; this MCP client surfaces the new field.

### Added

- `FiscalClosing` type fully aligned with the backend schema:
  - `tenantId`, `subTenantId`, `firstSequenceNumber`,
    `lastSequenceNumber`
  - `closingHash`, `previousClosingHash`
  - `totals` (typed via `FiscalClosingTotals`), `cumulativeTotals`
  - `environment`, `csvPath`, `csvHash`
  - `otsProofBase64`, `otsStatus`, `otsSubmittedAt`,
    `otsBitcoinConfirmedAt`, `otsCalendars` (typed via
    `FiscalClosingOtsCalendar`)
  - `metadata`
- New exported types: `FiscalClosingTotals` and
  `FiscalClosingOtsCalendar`.

### Changed

- `VERSION` constant in `src/cli.ts` bumped from `'2.8.0'` (historical
  drift vs. Git tag) to `'2.10.0'`.

### Compat

- Fully backward compatible: every new field is optional.

## [2.9.0] - 2026-05-11

### Added

- **2 new MCP tools** for the sub-tenant lifecycle surface introduced in Scell.io API v2.9.0:
  - `scell_start_subtenant_superpdp_authorize` — `POST /api/v1/tenant/sub-tenants/{id}/superpdp-authorize` → `{ authorize_url, state }`. Recovery path when the sub-tenant's SuperPDP access token is missing or revoked. Auth: `sk_*` / Bearer.
  - `scell_delete_sub_tenant` — `DELETE /api/v1/tenant/sub-tenants/{id}?cascade={bool}`. Optional `cascade: boolean` to atomically drop attached Companies. Auth: `sk_*` / Bearer.
- New TypeScript types exported from `@scell/mcp-client`:
  - `SubTenantSuperPDPAuthorizeResponse` (`{ authorizeUrl, state }`)
  - `SubTenantDeleteOptions` (`{ cascade?: boolean }`)
  - `SubTenantDeleteResult` (`{ message, companiesDeleted }`)
  - `SubTenantErrorCode` union (`'SUB_TENANT_HAS_COMPANIES' | 'SUB_TENANT_HAS_FISCAL_ENTRIES' | 'MISSING_ACCESS_TOKEN'`)
  - `SubTenantHasCompaniesError`, `SubTenantHasFiscalEntriesError`, `SubTenantMissingAccessTokenError` — structured 422 payloads
- Total tool count is now **44** (was 42).
- `generateConfigWithInstructions()` documents the two new tools plus the explicit `MISSING_ACCESS_TOKEN` recovery path on `scell_refresh_subtenant_status`.
- `llms.txt` adds detailed tool docs (input schemas, error payloads, recommended LLM decision protocols for cascade-deletion and missing-token recovery).
- `README.md` adds a new "Sub-Tenant Lifecycle" section.

### Changed

- `scell_refresh_subtenant_status` documentation now mentions the new `422 MISSING_ACCESS_TOKEN` case that includes an `authorize_url` in the response. The LLM should branch on this code to surface the URL to the user or call `scell_start_subtenant_superpdp_authorize` to mint a fresh URL.

### LLM decision protocols (added to `llms.txt`)

- **Sub-tenant deletion**: branch on `SUB_TENANT_HAS_COMPANIES` (retry with `cascade=true` after user confirmation) vs `SUB_TENANT_HAS_FISCAL_ENTRIES` (refuse — ISCA, no force flag; propose `metadata.archived = true` instead).
- **Refresh status with missing token**: branch on `MISSING_ACCESS_TOKEN` → fetch a fresh URL via `scell_start_subtenant_superpdp_authorize` or surface the included one, then ask the user to re-authorize.

### Notes

- No breaking change at the MCP-tool surface.
- The sub-tenant lifecycle tools (`scell_get_subtenant_status`, `scell_refresh_subtenant_status`, `scell_resume_url`, `scell_create_sub_tenant`) that already existed in `llms.txt` are unchanged on the input side.

---

## [2.8.0] - 2026-05-11

### Changed

- **Backend refonte** (2026-05-11): the `api_keys.company_id` column was dropped on the Scell.io API. An API key now resolves to a **tenant**, not to a single company. To attribute a created resource to a sub-tenant of the calling tenant, pass an optional `sub_tenant_id` (UUID) **in the POST payload**.
- `InvoiceInput.sub_tenant_id?: string` — new optional field on `scell_create_invoice` payloads. Anti-IDOR enforced server-side (`403` if the sub-tenant does not belong to the caller's tenant).
- `SignatureInput.sub_tenant_id?: string` — new optional field on `scell_create_signature` payloads. Same anti-IDOR contract.
- Tool documentation in `generateConfigWithInstructions()` updated for `scell_create_invoice`, `scell_create_signature` and `scell_list_signatures` to reflect the new payload field and the dropped legacy column.
- `llms.txt` and `README.md` updated accordingly.

### Removed

- `SignatureListQuery.company_id` — the underlying filter no longer exists server-side after the column drop. `sub_tenant_id` remains supported as an anti-IDOR query parameter on `scell_list_signatures`.

### Migration

- No code change required if you never used a company-bound API key or the `SignatureListQuery.company_id` filter.
- If you relied on a company-bound API key to scope newly created resources, drop that assumption and pass `sub_tenant_id` explicitly in the create payload.

### Notes

- No tool added or removed — total tool count unchanged at **42**.
- No breaking change at the MCP-tool surface for callers that omit `sub_tenant_id`.

---

## [2.7.0] - 2026-05-10

### Added

- **4 new MCP tools** for the URL-nested tenant signature endpoints introduced in Scell.io API v2.7.0:
  - `scell_tenant_list_signatures` — `GET /api/v1/tenant/signatures` (whole tenant scope)
  - `scell_tenant_get_signature` — `GET /api/v1/tenant/signatures/{id}`
  - `scell_subtenant_list_signatures` — `GET /api/v1/tenant/sub-tenants/{subTenantId}/signatures`
  - `scell_subtenant_get_signature` — `GET /api/v1/tenant/sub-tenants/{subTenantId}/signatures/{id}`
- New type `TenantSignatureListQuery` exported from `@scell/mcp-client`. Mirrors `SignatureListQuery` minus `company_id` / `sub_tenant_id` (those are now derived from the URL path on the new routes).
- `generateConfigWithInstructions()` updated: total tool count is now **42** (was 38), with the 4 new tool names, descriptions and auth requirements.
- `llms.txt` and `README.md` updated to document the new tools and migration guidance for master tenant API keys.

### Why

The legacy `GET /api/v1/signatures` endpoint requires the API key to be bound to a specific company (`COMPANY_REQUIRED`), so master tenant API keys (`sk_live_*` / `sk_test_*` not company-scoped) returned `403`. The new URL-nested routes resolve the tenant from the API key directly and follow the same convention as the existing tenant invoices and credit-notes endpoints.

### Notes

- Auth: all 4 new tools require `X-API-Key: sk_live_*` or `sk_test_*`.
- Anti-IDOR: sub-tenant variants return `403` if `subTenantId` does not belong to the caller.
- Optional query params on list endpoints: `status`, `environment`, `page`, `per_page` (max 100).
- No breaking change — minor bump.

---

## [2.6.0] - 2026-05-10

### Added

- `scell_list_signatures` and `scell_get_signature` are now usable under secret API keys (`sk_live_*` / `sk_test_*`) — previously dashboard-only via Sanctum.
- New type `SignatureListQuery` exported from `@scell/mcp-client` describing the optional query parameters for `scell_list_signatures`: `status`, `environment`, `company_id`, `sub_tenant_id`, `page`, `per_page` (max 100).
- Tool documentation updated in `generateConfigWithInstructions()` to reflect the new scope (tenant of the API key via `company.tenant_id`) and the new filters.

### Fixed (backend, documented here)

- 500 error when calling `GET /api/v1/signatures` with `sk_*` keys (backend used `$request->user()->id` which was null under `api.key`). Listing is now scoped via the resolved tenant.

### Notes

- Anti-IDOR: passing a `sub_tenant_id` that does not belong to the caller's tenant returns 403.
- No breaking change — minor bump.

---

## [2.2.0] - 2026-05-10

### Added

- New MCP tool documented: `scell_pay_billing_invoice` — Initiate Stripe payment for a Scell.io billing invoice. Returns `client_secret` for Stripe.js `confirmCardPayment()`. Auth: `X-API-Key sk_live_*`. No request body. Raises 404 if invoice belongs to another tenant, 422 if status is not payable (draft, paid, cancelled).
- Type `PaymentIntent` exported from `@scell/mcp-client` — fields: `clientSecret`, `paymentIntentId`, `amount` (cents), `currency` (ISO 4217 lowercase), `status`.
- Total tool count updated to 38 in `generateConfigWithInstructions()`.

### Backend endpoint documented

- `POST /api/v1/tenant/billing/invoices/{invoiceId}/pay`
- Response 200: `{ data: { client_secret, payment_intent_id, amount, currency, status } }`

---

## [2.1.0] - 2026-05-08

### Added

- New MCP tool documented: `scell_download_tenant_invoice` — Download tenant-scoped invoice PDF/XML. Comble le gap v2 ou les API keys tenant ne pouvaient pas telecharger les factures (`scell_download_invoice` legacy etait company-scoped et retournait 403).
- Format support: `'facturx'` (default), `'pdf'`, `'xml'`.
- Optional `sub_tenant_id` for strict sub-tenant scope.

### Backend endpoints documented

- `GET /api/v1/tenant/invoices/{invoiceId}/download[?format=]`
- `GET /api/v1/tenant/sub-tenants/{subTenantId}/invoices/{invoiceId}/download[?format=]`

### Notes

- `cli.ts` VERSION bumpe `2.0.0` → `2.1.0`.
- Pas de breaking change. Bump minor.
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-08

Major release. Aligns the MCP client types and documentation with the
Scell.io API v2 onboarding model. The legacy 3-state `kycStatus` field
is dropped from `SubTenant` and replaced by the richer `onboardingStatus`
enum plus explicit SuperPDP verification fields. New MCP tools are
documented for agents:

- `scell_lookup_sirene` (publishable-key) — Sirene company lookup.
- `scell_create_sub_tenant` (publishable-key) — create a sub-tenant
  from widget data.
- `scell_get_subtenant_status` (Bearer) — query cached SuperPDP status.
- `scell_refresh_subtenant_status` (Bearer, rate-limited 1/min) — force
  a fresh poll of SuperPDP.
- `scell_resume_url` (Bearer) — regenerate a 7-day signed resume URL.

### Breaking Changes

- **`SubTenant` no longer exposes `kycStatus` / `kycVerifiedAt` /
  `kycDelegated`.** The backend stopped returning these fields.
- **`SubTenant` now mandates `onboardingStatus: OnboardingStatus`**
  (6-value union). TypeScript will fail loudly on consumers that
  assumed the legacy shape.

### Added

- **`OnboardingStatus`** type (6 values) replacing legacy `kycStatus`:
  `pending_superpdp` | `superpdp_redirected` | `superpdp_authorized` |
  `superpdp_pending_review` | `active` | `superpdp_failed`.
- **`SubTenant`** new fields: `onboardingStatus`,
  `superpdpCompanyVerificationStatus`,
  `superpdpUserIdentityVerificationStatus`, `lastPolledAt`,
  `resumeUrl`, `contactFirstName`, `contactLastName`.
- **`RecommendedAction`** interface — structured i18n action object
  (FR/EN, with `code`, `severity`, `ctaUrl`, `dismissible`).
- **`SubTenantSummary`** type alias = `SubTenant` for explicit handling
  of the v2 enriched payload.
- **`CompanyData`**, **`IdentityFormData`**, **`SireneLookupResult`**,
  **`CreateSubTenantWidgetInput`**, **`CreateSubTenantWidgetResult`**,
  **`SubTenantStatusResult`**, **`SubTenantResumeUrlResult`**.
- New MCP tool input/output schemas documented in `llms.txt`. Agents
  using `@scell/mcp-client` types should pass `inputSchema` derived
  from these TypeScript types (Zod schemas can be generated with e.g.
  `ts-to-zod` when needed).

### Migration Guide

Replace `kycStatus` reads with `onboardingStatus`:

| Legacy `kycStatus` | New `onboardingStatus`                                                                  |
|--------------------|-----------------------------------------------------------------------------------------|
| `'pending'`        | `'pending_superpdp'` / `'superpdp_redirected'` / `'superpdp_authorized'` / `'superpdp_pending_review'` |
| `'verified'`       | `'active'`                                                                              |
| `'rejected'`       | `'superpdp_failed'`                                                                     |

```typescript
// BEFORE (v1.x)
if (subTenant.kycStatus === 'verified') { /* ... */ }

// AFTER (v2.0)
if (subTenant.onboardingStatus === 'active') { /* ... */ }
```

### Backend requirements

Scell.io API v2.0+ (release 2026-05-08).

## [1.14.0] - 2026-05-06

### Added

- **Support backend Scell.io v0.7.0** : nouveaux champs Factur-X complets
  sur Company (`iban`, `bic`, `payment_terms_default`, `payment_due_days_default`,
  `invoice_footer_default`, `invoice_notes_default`) + endpoint upload logo
  pour les invoice templates (`POST /v1/invoice-templates/{id}/logo`).
- Types `InvoiceTemplateInput` deja exposes (depuis 1.11.0). Le upload logo
  est accessible via le SDK JS @scell/sdk@1.18.0+ ou SDK PHP @scell/sdk@1.17.0+
  ou directement via API REST multipart.

### Use case (LLM agents)

Permettre aux agents IA de configurer le branding tenant (logo + couleurs +
mentions custom) une fois pour toutes, sans avoir besoin de re-passer ces
parametres a chaque generation de facture. Override par-facture reste
possible via les champs payload SDK.

## [1.13.0] - 2026-05-06

### Changed

- **`scell_download_self_attestation`** : tool desormais NOMINATIF. Le PDF
  inclut l'identite du beneficiaire (tenant ou sub_tenant : raison sociale,
  SIRET, TVA, adresse, contact, statut KYB/KYC) et un nouveau parametre
  optionnel `sub_tenant_id` permet de generer l'attestation pour un
  sub_tenant specifique. Le hash SHA-256 du document couvre l'identite,
  garantissant la non-transferabilite (preuve cryptographique).
- Endpoint mis a jour : `GET /api/v1/tenant/fiscal/isca/self-attestation/download`
  (tenant) ou `GET /api/v1/tenant/fiscal/isca/self-attestation/{subTenantId}/download`
  (sub_tenant).
- llms.txt : description detaillee du contenu PDF et de la preuve cryptographique
  de non-transferabilite.

### Notes

- Backend requis : Scell.io v0.6.0+ (ledger increvable + attestation nominative).
- Bump : 1.12.0 -> 1.13.0

## [1.11.0] - 2026-05-03

### Added

- **Invoice Templates** types : `InvoiceTemplate`, `InvoiceTemplateInput`, `InvoiceTemplateScope`, `InvoiceTemplateLogoPosition`. Documentation MCP des 6 nouveaux tools (`scell_list_invoice_templates`, `scell_get_invoice_template`, `scell_create_invoice_template`, `scell_update_invoice_template`, `scell_delete_invoice_template`, `scell_mark_invoice_template_default`).
- **Daily Closure** type : `DailyClosure` avec `csv_url` (signed). Tools : `scell_get_daily_closure`, `scell_download_daily_closure_csv`.
- **Avoirs** : documentation MCP precisee — `invoice_id` obligatoire, doit pointer sur une facture existante du meme tenant, creditable. Heritage strict des champs buyer (pas d'override).
- llms.txt : section dediee Invoice Templates (cascade de resolution, exemples B2B/B2C, prompts Claude Desktop).

### Notes

- No breaking change. Default = system template (transparent pour les LLM).
- Bump : 1.10.0 -> 1.11.0

## [1.10.0] - 2026-05-03

### Added

- **B2C support** : nouveau flag pour distinguer un acheteur particulier d'une entreprise.
  - `Company.isIndividual?: boolean` (a positionner sur `buyer` uniquement).
  - `InvoiceInput.buyerIsIndividual?: boolean` (alias top-level equivalent).
- Documentation MCP : les schemas JSON des tools `scell_create_invoice` et `scell_create_credit_note` mentionnent explicitement que SIRET / vatNumber / legal_id sont optionnels en B2C.

### Notes

- Aucun breaking change. Default = false (B2B).
- En B2C, le serveur Scell.io omet BT-46/BT-47/BT-48 du Factur-X / UBL / CII genere (BR-CO-26 EN16931). Les mentions B2B (Code de commerce L441-10) sont supprimees.

## [1.9.0] - 2026-04-07

### Changed

- Bumped version to publish all SuperPDP onboarding changes to npm

## [1.8.0] - 2026-04-07

### Changed

- Bumped version to publish SuperPDP OAuth2 onboarding tools to npm

## [1.7.0] - 2026-04-07

### Added

- Added SuperPDP OAuth2 onboarding section to `llms.txt` documentation

## [1.6.2] - 2026-04-07

### Added

- **3 New ISCA Document Tools**: `scell_download_measures_register`, `scell_download_technical_dossier`, `scell_download_self_attestation`

### Changed

- Renamed legacy fiscal certification references to ISCA throughout codebase and documentation (total: 33 tools)

## [1.6.0] - 2026-04-07

### Changed

- Invoice numbers are now server-generated; clients no longer provide `invoice_number`
- `siret` is now optional on Company — required only for French companies (`country=FR`)

## [1.5.0] - 2026-02-12

### Added

- **International Invoicing Support**: optional `siret`, EU `vatNumber`, non-EU `legal_id` + `legal_id_scheme` fields on Company type

## [1.4.0] - 2026-02-11

### Fixed

- Corrected tool count to 30 in generator comments
- Removed duplicate `--sandbox` flag in CLI help output

## [1.3.0] - 2026-02-11

### Fixed

- Corrected API key prefix documentation from `sk_*` to `tk_*`
- Updated tool count to match actual available tools

## [1.2.0] - 2026-02-11

### Added

- **18 New MCP Tools** (total: 30 tools):
  - **Signature**: `cancel_signature`, `send_reminder`
  - **System**: `health_check`, `validate_api_key`
  - **Fiscal Compliance** (7 tools, tenant key required): `get_fiscal_compliance`, `check_fiscal_integrity`, `list_fiscal_closings`, `get_fiscal_attestation`, `list_fiscal_entries`, `get_kill_switch_status`, `list_fiscal_rules`
  - **Credit Notes** (7 tools, tenant key required): `list_credit_notes`, `get_credit_note`, `download_credit_note`, `create_credit_note`, `send_credit_note`, `delete_credit_note`, `get_remaining_creditable`
- **Dual Auth Support**: MCP server now supports both user API keys (`sk_*`) and tenant API keys (`tk_*`)
- Updated tool list in generator comments (30 tools)

### Changed

- Bumped MCP server version to 1.1.0

## [1.1.0] - 2026-02-10

### Added

- **Sandbox Support**: `--sandbox` CLI flag and `sandbox` config option to route requests through sandbox environment
- **Fiscal Compliance Types** (LF 2026): `FiscalComplianceData`, `FiscalIntegrityReport`, `FiscalClosing`, `FiscalEntry`, `FiscalKillSwitchStatus`, `FiscalRule`, `FiscalAnchor`, `FiscalAttestation`
- **Credit Note Types**: `CreditNote`, `CreditNoteInput`, `CreditNoteLine`, `CreditNoteStatus`
- **Billing Types**: `BillingInvoice`, `BillingUsage`, `BillingTransaction`
- **Stats Types**: `StatsOverview`, `StatsMonthly`
- **Sub-Tenant Types**: `SubTenant`, `SubTenantInput`
- **Tenant Profile Types**: `TenantProfile`, `TenantBalance`
- **Updated Invoice Type**: Added `disputed` status, `paidAt`, `paymentReference`, `paymentNote` fields
- **Updated Webhook Events**: Added incoming invoice events, credit note events
- **Updated MCP Tool List**: Added `scell_get_balance`, `scell_validate_siret`, `scell_validate_vat`, `scell_get_audit_trail`

## [0.1.0] - 2026-01-24

### Added

- Initial release of `@scell/mcp-client` package
- MCP configuration generator for Claude Desktop, Cursor, VS Code
- CLI tool (`scell-mcp`) for generating configs
- TypeScript type definitions for Scell.io API (invoices, signatures, webhooks)
- Programmatic API for config generation
- Config validation

[1.9.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.9.0
[1.8.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.8.0
[1.7.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.7.0
[1.6.2]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.6.2
[1.6.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.6.0
[1.5.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.5.0
[1.4.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.4.0
[1.3.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.3.0
[1.2.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.2.0
[1.1.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.1.0
[0.1.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v0.1.0
