# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),

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
