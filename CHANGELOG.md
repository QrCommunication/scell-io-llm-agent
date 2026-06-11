# Changelog

All notable changes to this project will be documented in this file.

## [3.2.0] - 2026-06-11

### Added — Document live preview + branding/templates enrichments
- `scell_preview_document` — `POST /api/v1/documents/preview`. Render a live HTML preview of a draft document (invoice, credit note or quote) using the REAL template, branding and legal mentions of the issuing company — nothing is persisted. Body: `type` (`'invoice' | 'credit_note' | 'quote'`, required), `document_number?`, `buyer?`, `lines?` (max 200), `issue_date?`, `due_date?`, `currency?`, `notes?`, `payment_terms?`. Returns raw `text/html` (`Cache-Control: no-store`). New types `DocumentPreviewInput`, `DocumentPreviewBuyer`, `DocumentPreviewLine`.
- `scell_derive_template_colors_from_logo` — `POST /api/v1/invoice-templates/derive-colors-from-email-logo`. Extract the dominant primary/accent colors from the tenant's email branding logo (`brand_logo_url`) and apply them to the tenant's default invoice template (created on the fly if missing). No body. 404 if no email logo is configured; 422 if the logo is unreachable or only has neutral colors.
- `Branding.brand_email_enabled` (boolean, updatable via `BrandingInput` — `false` = emails sent with the default channel branding) and `Branding.computed_email_footer` (string|null, READ-ONLY — footer computed from the company identity, used at render time when `brand_email_footer` is empty).
- `InvoiceTemplate.is_enabled` (boolean, default `true` — `false` = template skipped by the resolution cascade, system template used instead), updatable via `InvoiceTemplateInput.is_enabled`.
- `scell_upload_branding_logo` description now documents the direct multipart alternative `POST /api/v1/branding/tenant/logo` / `POST /api/v1/branding/sub-tenants/{subTenantId}/logo` (field `logo`, jpeg/png/webp/svg/svgz, max 2 MB, returns the flat `Branding` object).
- `scell_preview_branding` description now documents the non-persisted query overrides `brand_primary_color`, `brand_email_footer`, `brand_email_signature`, `brand_logo_url`.

## [3.1.0] - 2026-06-08

### Added — SuperPDP disconnect / reconnect tools (sub-tenants)
- `scell_disconnect_subtenant_superpdp` — `POST /tenant/sub-tenants/{id}/superpdp-disconnect`. Revoke the SuperPDP tokens and reset `onboarding_status` to `pending_superpdp`.
- `scell_reconnect_subtenant_superpdp` — `POST /tenant/sub-tenants/{id}/superpdp-reconnect`. Disconnect then return a fresh prefilled authorize URL in one call.
- `scell_mint_subtenant_widget_token` — `POST /tenant/sub-tenants/{id}/superpdp-widget-token`. Mint a signed 24h token for the `scell-onboarding` web component in `mode="superpdp"`; `{ reset: true }` disconnects before minting.

## [3.0.0] - 2026-06-07

### BREAKING CHANGES

#### Suppliers Registry — API contract change (derived-from-invoice model)

Suppliers are now read-only entities derived from received invoices. The API
reflects this: creation and deletion are no longer allowed at the registry
level (source of truth = invoice). Only contact metadata enrichment remains
editable.

**Removed tools** (API returns 405):
- **`scell_create_supplier`** — `POST /api/v1/suppliers` removed. Suppliers are
  created automatically when an incoming invoice is processed. To add a
  supplier, create an incoming invoice with its details.
- **`scell_delete_supplier`** — `DELETE /api/v1/suppliers/{id}` removed.
  Suppliers derive their lifecycle from the invoices that reference them.

**Restricted tool**:
- **`scell_update_supplier`** — now maps to `PATCH /api/v1/suppliers/{id}`
  (was `PUT`). Only `{ email?, phone?, notes?, metadata? }` are accepted.
  Identity fields (`name`, `country`, `billingAddress`, `siret`, `vatNumber`,
  `legalId`, `isIndividual`) are immutable — they come from the source invoice.
  Attempts to update identity fields return 422.

**Restricted type** (`SupplierInput`):
- The `SupplierInput` interface is now update-only: `{ email?, phone?, notes?, metadata? }`.
  All identity fields (`name`, `country`, `billingAddress`, `isIndividual`,
  `siret`, `vatNumber`, `legalId`, `legalIdScheme`) have been removed.
  Consumers who were using `SupplierInput` to drive `POST /suppliers` payloads
  must migrate — there is no longer a create endpoint.

**Read tools unchanged**:
- `scell_list_suppliers` — `GET /api/v1/suppliers` — unchanged
- `scell_get_supplier` — `GET /api/v1/suppliers/{id}` — unchanged

### Migration guide

| Before (≤2.34.0) | After (3.0.0) |
|---|---|
| `scell_create_supplier({ name, country, ... })` | Create an incoming invoice with the supplier's details — the supplier is derived automatically |
| `scell_delete_supplier(id)` | Not possible — suppliers live as long as their source invoices exist |
| `scell_update_supplier(id, { name, country, ... })` | `scell_update_supplier(id, { email?, phone?, notes?, metadata? })` — identity fields are read-only |

## [2.35.0] - 2026-06-07

### Added — Product catalog tools (Products + ProductCategories)

New reusable product/service catalog scoped by `(tenant_id, sub_tenant_id)`,
mirroring the buyers registry. Reference a product via `productId` on an
invoice/quote **line** to pre-fill it (label, unit price, default VAT rate).
Mutating a product never alters previously emitted invoices (snapshot, ISCA).

**New tools (10):**
- `scell_list_products`, `scell_get_product`, `scell_create_product`,
  `scell_update_product`, `scell_delete_product`
- `scell_list_product_categories`, `scell_get_product_category`,
  `scell_create_product_category`, `scell_update_product_category`,
  `scell_delete_product_category`

**New types** (`src/types/index.ts`):
- `Product`, `ProductInput`, `ProductCategory`, `ProductCategoryInput`.

**Invoice/quote line catalog fields** (optional, on `InvoiceLine`):
- `productId` → `product_id` (pre-fill the line from a catalog product)
- `saveToCatalog` → `save_to_catalog` (server-side upsert of the line as a product)
- `productCategoryId` → `product_category_id` (file the saved product under a category)

### Changed
- `VERSION` (CLI + package) → `2.35.0`.

## [2.34.0] - 2026-06-06

### Added
- **`scell_preview_branding`** tool (Email Branding section): renders a live
  preview of how a branded email will look with the current branding profile,
  before sending anything. `GET /api/v1/branding/tenant/preview` (no
  `sub_tenant_id`) or `GET /api/v1/branding/sub-tenants/{subTenantId}/preview`
  (anti-IDOR). The `Accept` header negotiates the format (`text/html` default,
  or `application/pdf`). Use after `scell_update_branding` /
  `scell_upload_branding_logo` so the user can visually confirm the rendering.
- Tool count in the generated config bumped **112 → 113**.

### Fixed
- **`scell_upload_branding_logo`** description corrected: the endpoint is
  `POST /api/v1/branding/tenant/logo-upload-url` (resp.
  `/branding/sub-tenants/{id}/logo-upload-url`), the request body uses
  `mime_type`, and the response field is `url` (not `upload_url`), alongside
  `public_url` and `expires_at` — aligning the agent guidance with the real
  backend contract.

## [2.33.0] - 2026-06-05

### Added
- **Quote sealing (PAdES + Bitcoin/OpenTimestamps anchoring)**: signed quotes now
  expose a `sealing` object in their API response. New exported type `QuoteSealing`
  with fields `is_sealed`, `pades_signed_at`, `signed_pdf_sha256` (the SHA-256 hash
  anchored on Bitcoin), `ots_status` (`pending` | `confirmed` | `failed`),
  `ots_submitted_at`, `ots_bitcoin_confirmed_at`, `bitcoin_block_height`, and
  `ots_proof_base64` (OpenTimestamps receipt). The optional `sealing?` field was
  added to the `Quote` type.
- `scell_get_quote` tool description updated so the agent surfaces the seal
  (PAdES PDF signature + Bitcoin blockchain anchoring) as tamper-evident proof of
  existence/integrity for accepted quotes.

## [2.32.0] - 2026-06-04

### Added
- **Recurring invoice tools** (facturation récurrente / abonnements, catalog):
  - `scell_list_recurring_invoices` — list schedules (GET /recurring-invoices),
    filters `status` (active|paused|completed|cancelled), `sub_tenant_id`, pagination.
  - `scell_get_recurring_invoice` — retrieve a schedule by UUID.
  - `scell_create_recurring_invoice` — create a schedule (template lines + recurrence
    rule + start date + end mode). LLM rules documented: clarify the recurrence end
    (never | on_date | after_occurrences), warn that `day_of_month=31` is clamped to
    the last day of short months, note each occurrence bills the buyer, and that
    `auto_send` submits to the PDP + emails the buyer (vs `draft` for review).
  - `scell_update_recurring_invoice` — partial update (future occurrences only).
  - `scell_delete_recurring_invoice` — delete a schedule.
  - `scell_pause_recurring_invoice` / `scell_activate_recurring_invoice` — suspend/resume.
  - `scell_cancel_recurring_invoice` — terminal cancellation.
  - `scell_run_recurring_invoice_now` — trigger an off-cycle occurrence immediately.
- New types: `RecurringInvoice`, `CreateRecurringInvoiceInput`,
  `UpdateRecurringInvoiceInput`, `RecurrenceRule`, `RecurringInvoiceStatus`,
  `RecurrenceIntervalUnit`, `RecurringInvoiceEndMode`, `RecurringInvoiceEmissionMode`
  (exported from the package root).
- Tool catalog count: 103 → 112.

### Added (autoliquidation TVA intra-UE — biens & services)
- **`VatCategory`** : 4 nouvelles catégories — `INTRACOM_GOODS` (K, livraison
  intracommunautaire de biens, art. 262 ter I), `EXPORT` (G, exportation hors UE,
  art. 262 I), `FRANCHISE_BASE` (E, franchise en base AE, art. 293 B),
  `EXEMPT_TRAINING` (E, formation professionnelle, art. 261-4-4°a).
- **`InvoiceLine`** : nouveaux champs `supplyType` (`'goods'|'services'`,
  discrimine K/G vs AE/O), `placeOfSupply` (art. 259-A), `vatOverrideReason`.
- **`scell_create_invoice`** : doc enrichie — résolution TVA **autoritaire**
  serveur + réponse **409 VAT_CORRECTION_REQUIRED** (corrections par ligne :
  taux/catégorie/mention suggérés) si un taux est incohérent sans
  `vatOverrideReason` ; le LLM doit surfacer les suggestions à l'utilisateur.
- **`scell_resolve_vat_context`** : doc `supplyType` (biens→K/G, services→AE/O)
  + nouvelles catégories.

## [2.31.0] - 2026-06-04

### Changed (doc des outils avoir)
- `scell_create_credit_note` : description enrichie — un avoir **partiel** DOIT
  sélectionner des lignes de la facture source via `items[].invoice_line_id`
  (prix + taux de TVA exact hérités par ligne ; multi-taux 20%/5,5%/exonéré OK).
  Le LLM ne doit pas inventer unit_price/tax_rate. Flow recommandé : appeler d'abord
  `scell_get_remaining_creditable`.
- `scell_get_remaining_creditable` : doc de la forme de réponse (items[] avec
  invoice_line_id/remaining_quantity/tax_rate + can_be_credited).


## [2.30.0] - 2026-06-04

### Added
- **Pre-issuance threshold simulator tool** `scell_simulate_subtenant_thresholds`
  (POST /api/v1/tenant/sub-tenants/{id}/thresholds/simulate). Body `{ amount, category }`.
  Projects the micro-entrepreneur threshold gauges AS IF a hypothetical invoice were
  issued — the gauge `level`/`actionable` reflect the post-invoice state. Read-only.
  New type `SimulateThresholdInput`.

## [2.29.0] - 2026-06-04

### Added
- **Micro-entrepreneur threshold + fiscal status tools** (catalog):
  - `scell_get_subtenant_thresholds` — French micro-entrepreneur threshold gauges
    for a sub-tenant (VAT franchise base/majored + micro-regime ceiling), with
    cumulative HT revenue per category, reached alert level, and projected crossing
    date. Dated rules (loi 2025-1044). Informational (`disclaimer`).
  - `scell_update_subtenant_fiscal_status` — update regime / VAT status / activity
    type / start date / VAT number; `vat_status='liable'` flips billing to VAT
    (drops art. 293 B mention), `vat_number` then required.
- **Closing CSV download tool** `scell_download_fiscal_closing`; `scell_list_fiscal_closings`
  now documents `closing_type` (daily|monthly|annual) + `sub_tenant_id` filters and the
  per-closing `download_url`.
- New types: `ThresholdReport`, `ThresholdGauge`, `ThresholdsResult`, `RevenueCategory`,
  `ThresholdKind`, `ThresholdAlertLevel`, `UpdateFiscalStatusInput`, `FiscalRegime`,
  `VatStatus`, `ActivityType`.

## [2.28.1] - 2026-06-04

### Fixed
- Docs: the country reference endpoint requires authentication (Sanctum or
  `sk_*`/`pk_*` API key) — corrected the type docs that wrongly described it as
  public.

## [2.28.0] - 2026-06-04

### Added
- Country company reference types `CountryReference`, `CountryVatInfo`,
  `CountryNationalIdInfo`, `LegalForm` for the public endpoint
  `GET /api/v1/reference/countries[/{code}]` (no auth). Per country: VAT number
  (label/example/regex/VIES-checkable), national registration identifier
  (label/scheme ISO 6523/example/regex/required-for-B2B) and known legal forms —
  to build country-aware buyer/seller forms.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),

## [2.27.1] - 2026-05-28

### Changed
- Alignement de version (parité SDK PHP/JS/MCP). `InvoiceStatus` était déjà
  conforme aux 16 statuts canoniques du backend — aucune modification de type.

## [2.27.0] - 2026-05-28

### Added — Per-signer signature positions (`signerIndex`, multi-position support)

The EU-SES signature API now lets each signature position be assigned to a
specific signer, and allows **multiple signature positions per signer**.

#### New field

- `SignaturePosition.signerIndex?` (number, optional) — 0-based index into the
  `SignatureInput.signers[]` array (`0` = first signer). When omitted, the
  position applies to the global signature flow (legacy, fully backward
  compatible).

#### Multi-position per signer

Provide N `SignaturePosition` entries sharing the same `signerIndex` to place a
single signer's signature on several pages or documents (combine with
`documentIndex` for multi-document bundles):

```typescript
signature_positions: [
  { signerIndex: 0, page: 1, x: 10, y: 80 },
  { signerIndex: 0, page: 3, x: 10, y: 80 }, // 2nd position for signers[0]
  { signerIndex: 1, page: 1, x: 60, y: 80 },
]
```

#### camelCase → snake_case mapping

The MCP server consuming this client config maps `signerIndex` →
`signer_index` before `POST /api/v1/signatures` (same convention already used
for `Mention.signerIndex`).

#### Updated

- `SignaturePosition` interface + JSDoc (`src/types/index.ts`).
- `SignatureInput.signature_positions` field doc.
- `scell_create_signature` tool description (`src/config/generator.ts`).

No breaking change — `signerIndex` is optional; existing payloads keep working.

## [2.26.0] - 2026-05-28

### Added — Suppliers Registry (5 new MCP tools, 2 new types)

Mirror of the Buyers Registry surface for suppliers / vendors (Accounts
Payable). Suppliers are reusable, deduplicated profiles scoped strictly by
`(tenant_id, sub_tenant_id)` — same isolation policy as buyers. Unlike
buyers, suppliers have **no** shipping address, **no** `billing_email`, and
**no** VAT-context resolution (they are the issuing party of incoming
invoices, not a delivery destination).

The MCP tool catalog passes from **98 → 103 tools**.

#### New tools (5)
- `scell_list_suppliers` — `GET /api/v1/suppliers` (filters: `q`, `is_individual`, `sub_tenant_id`, `page`, `per_page`). Returns `PaginatedResult<Supplier>`.
- `scell_create_supplier` — `POST /api/v1/suppliers`. Idempotent on `(tenant_id, sub_tenant_id, siret)` / `(tenant_id, sub_tenant_id, lower(email))`.
- `scell_get_supplier` — `GET /api/v1/suppliers/{id}` (anti-IDOR 404).
- `scell_update_supplier` — `PUT /api/v1/suppliers/{id}` (partial update).
- `scell_delete_supplier` — `DELETE /api/v1/suppliers/{id}` (soft delete, 204).

#### New types (2)
- `Supplier` — registry entry (id, name, isIndividual, siret, vatNumber, legalId, legalIdScheme, email, phone, country, billingAddress, metadata, notes, timestamps).
- `SupplierInput` — create/update payload.

Both types are exported from the package barrel (`@scell/mcp-client`).

## [2.25.0] - 2026-05-28

### Added — Factur-X BT-81 payment_means_code (2 new MCP tools, 1 new type)

Backend livraison du jour (commit `a48c241` sur scell.io backend) : le champ
`payment_means_code` (Factur-X EN16931 BT-81, codes UN/ECE 4461) devient
**obligatoire** sur les endpoints `mark-paid` (outgoing + incoming). Cette
release expose la nouvelle surface aux LLM via 2 nouveaux tools MCP et
enrichit les types `Invoice` / `CreditNote` pour refléter les champs
persistés côté backend.

Le MCP tool catalog passe de **96 → 98 tools**.

#### Nouveaux tools (2)

- `scell_mark_invoice_paid` — `POST /api/v1/invoices/{invoiceId}/mark-paid`
  (auth `sk_*` / Bearer Sanctum). Le tool existait déjà comme description
  partielle dans le tool catalog v2.24.0 mais sans body documenté. Cette
  release **rend le tool first-class** avec :
  - Body schema complet (`payment_means_code` requis enum, plus
    `payment_means_text`, `payment_reference`, `paid_at`, `note` optionnels).
  - Les 11 codes UN/ECE 4461 listés avec leur label FR/EN dans la description
    pour que le LLM puisse les surfacer à l'utilisateur sans aller-retour.
  - Mention explicite de la conformité **Factur-X EN16931 BT-81**.
  - Default UX-friendly recommandé : `'30'` (virement) ou `'58'` (SEPA pour
    tenants B2B France).
  - Erreurs documentées : `422 INVOICE_NOT_PAYABLE`, `422 ALREADY_PAID`,
    `422` si `payment_means_code` manquant / invalide.

- `scell_mark_incoming_invoice_paid` (**nouveau**) — `POST
  /api/v1/tenant/invoices/incoming/{invoiceId}/mark-paid` (auth `sk_*` /
  Bearer Sanctum). Tool dédié au paiement d'une facture **reçue d'un
  fournisseur** (suivi AP — Accounts Payable). Même body que
  `scell_mark_invoice_paid`. Différence comportementale clé : seules les
  factures en `status='accepted'` peuvent être marquées payées (lifecycle
  incoming plus strict : `received → accepted → paid`, pas de
  `validated`/`transmitted`/`sent`). Met à jour la facture entrante +
  appendice à `superpdp_response.payment_history` pour audit trail.

#### Nouveau type

- `PaymentMeansCode` — union literal type des 11 codes UN/ECE 4461 (`'1'`,
  `'10'`, `'20'`, `'30'`, `'42'`, `'48'`, `'49'`, `'57'`, `'58'`, `'59'`,
  `'97'`). JSDoc complet avec table des labels FR/EN, référence officielle
  (UN/ECE Rec. 16, FNFE-MPE Factur-X) et recommandation de défaut pour UX.
  Aligné sur le backend `App\Enums\Invoice\PaymentMeansCode`.

#### Types enrichis (2)

- `Invoice` : 2 nouveaux champs optionnels `paymentMeansCode?:
  PaymentMeansCode | null` (BT-81) et `paymentMeansText?: string | null`
  (BT-82, max 100 chars). Persistés par le backend quand l'invoice est
  marked-paid via les nouveaux endpoints. `null` tant que non payée.
- `CreditNote` : mêmes 2 champs avec les mêmes sémantiques (codes de
  remboursement quand l'avoir est marked-paid).

### Compat

- Backward compatible : tous les 96 tools de v2.24.0 sont préservés.
- Les nouveaux champs sur `Invoice` / `CreditNote` sont strictement
  optionnels (`?: ... | null`), n'affectent pas le code consumer existant.
- Les nouveaux tools sont additifs — aucun renommage / suppression.

### Source de vérité

- Backend MarkPaidRequest : `backend/app/Http/Requests/Invoice/MarkPaidRequest.php`
- Backend enum : `backend/app/Enums/Invoice/PaymentMeansCode.php`
- Backend commit : `a48c241` (2026-05-27)

## [2.24.0] - 2026-05-28

### Added — 24 new MCP tools (Buyers, Invoice Templates, Branding, Billing, Credit Packs, Sub-Tenant CRUD)

Following the W2 audit (`docs/audit-api/W2-gap-matrix-2026-05-28.md`
in the backend repo), this release closes the 24-tool gap between the
MCP layer and the live backend surface. The MCP tool catalog grows
from **72 → 96 tools**.

#### Buyers Registry (5 new tools)

The buyers registry (introduced backend-side on 2026-05-06) is a
deduplicated catalog of reusable customer profiles scoped strictly
by `(tenant_id, sub_tenant_id)`. Snapshotted onto invoices / quotes
at emission time (ISCA-compliant).

- `scell_list_buyers` — `GET /api/v1/buyers` (paginated, `q` + `is_individual` filters)
- `scell_create_buyer` — `POST /api/v1/buyers` (upsert on SIRET / lowercase email)
- `scell_get_buyer` — `GET /api/v1/buyers/{id}` (anti-IDOR 404)
- `scell_update_buyer` — `PUT /api/v1/buyers/{id}` (does NOT propagate to past invoices)
- `scell_delete_buyer` — `DELETE /api/v1/buyers/{id}` (soft delete, 30-day trash)

#### Invoice Templates (6 new tools)

Templates customize Factur-X PDF + quote PDF rendering (logo, primary
color, footer, mentions). Cascade: explicit `invoice_template_id` →
sub_tenant default → tenant default → system default.

- `scell_list_invoice_templates` — `GET /api/v1/invoice-templates` (filter by `kind`)
- `scell_create_invoice_template` — `POST /api/v1/invoice-templates`
- `scell_get_invoice_template` — `GET /api/v1/invoice-templates/{id}`
- `scell_update_invoice_template` — `PUT /api/v1/invoice-templates/{id}` (system = 403)
- `scell_delete_invoice_template` — `DELETE /api/v1/invoice-templates/{id}` (FK preserved)
- `scell_set_default_invoice_template` — `PUT /api/v1/invoice-templates/{id}/default` (atomic swap)

#### Email Branding (3 new tools)

Branding customizes the logo, primary color, footer, and signature
on outbound emails (invoice, credit note, quote). Hex `#RRGGBB`
validated server-side. Distinct from `Company.logo_url` (Factur-X PDF).

- `scell_get_branding` — `GET /api/v1/branding/tenant` OR `…/sub-tenants/{id}`
- `scell_update_branding` — `PUT /api/v1/branding/…` (partial, nullable)
- `scell_upload_branding_logo` — `POST` (pre-signed S3 PUT URL, 15 min TTL)

#### Billing (4 new tools)

Tenant billing for Scell.io platform consumption (subscription,
top-ups, pack purchases, monthly usage).

- `scell_get_billing_invoices` — `GET /api/v1/tenant/billing/scell-invoices`
- `scell_get_billing_usage` — `GET /api/v1/tenant/billing/usage`
- `scell_topup_balance` — `POST /api/v1/tenant/billing/top-up` (Stripe PI, idempotent)
- `scell_pay_invoice` — `POST /api/v1/tenant/billing/invoices/{id}/pay`

#### Credit Packs (2 new tools)

One-shot bundles of platform credits (e.g. "100 signatures") at a
discounted rate vs. PAYG. Sandbox credits directly; live goes
through Stripe.

- `scell_list_credit_packs` — `GET /api/v1/packs/public` (no auth)
- `scell_purchase_credit_pack` — `POST /api/v1/tenant/billing/packs/{slug}/checkout`

#### Sub-Tenant CRUD (4 new tools)

CRUD on sub-tenants of the calling master tenant. Each sub-tenant has
its own isolated ISCA fiscal ledger (separate hash chain).

- `scell_list_sub_tenants` — `GET /api/v1/tenant/sub-tenants` (paginated)
- `scell_get_sub_tenant` — `GET /api/v1/tenant/sub-tenants/{id}` (raw row)
- `scell_create_sub_tenant` — `POST /api/v1/tenant/sub-tenants` (returns `pending_superpdp`)
- `scell_update_sub_tenant` — `PUT /api/v1/tenant/sub-tenants/{id}` (async SuperPDP sync)

Complements the existing 5 lifecycle tools
(`scell_get_subtenant_status`, `scell_refresh_subtenant_status`,
`scell_start_subtenant_superpdp_authorize`, `scell_resume_url`,
`scell_delete_sub_tenant`).

### Fixed — Drift detections from W2 audit

- `src/cli.ts` — `VERSION` const was hardcoded at `'2.14.0'` and missed
  every release since v2.15. Now bumped to `'2.24.0'` and visible via
  `scell-mcp --version` + help banner.
- `src/config/generator.ts` — header `"Available tools (57):"` was
  drifted from the actual count. Updated to `"Available tools (96):"`
  (72 prior + 24 new in this release).
- `scell_tenant_list_signatures` — description referenced the obsolete
  `403 COMPANY_REQUIRED` error code. The `api_keys.company_id`
  column was dropped in the 2026-05-11 backend refonte. Updated to
  reference the current model: `404 SUB_TENANT_NOT_FOUND` (anti-IDOR)
  and `401 TENANT_NOT_RESOLVED` (key cannot resolve to a tenant).

### Compat

- **Fully backward compatible.** All changes are additive (new tools
  in `generateConfigWithInstructions` output) or documentation-only
  (CLI banner, description fix). No type changes, no removed tools,
  no breaking changes to existing tool descriptions other than the
  obsolete error code fix.

### Tests

- Existing test suite (190 tests across 41 suites) continues to pass
  unchanged.
- No new test file added: the new tools are description-only string
  additions inside the existing `generateConfigWithInstructions`
  template literal; the existing post-build smoke tests
  (`tests/backend-enum-mirrors.test.mjs`) implicitly cover the
  generator output.

## [2.22.0] - 2026-05-27

### Added — Full backend enum mirror coverage + tool description enrichments

Following v2.21.0 (which only covered `InvoiceStatus`), this release ships
the **complete set of backend string-union mirrors** so the MCP layer can
enumerate legal filter values to the LLM at runtime.

#### New exported types (15)

All aligned 1:1 with the backend source of truth (`App\Enums\*` PHP enums
or PostgreSQL CHECK constraints):

| Type | Values | Backend reference |
|---|---|---|
| `InvoiceTemplateKind` | `'invoice' \| 'quote' \| 'both'` | `App\Enums\Invoice\InvoiceTemplateKind` |
| `InvoiceType` | `'standard' \| 'deposit' \| 'balance'` | `App\Enums\Invoice\InvoiceType` |
| `PaymentScheduleLineAmountType` | alias of `PaymentScheduleAmountType` (`'percent' \| 'amount'`) | `App\Enums\Quote\PaymentScheduleLineAmountType` |
| `SubTenantOnboardingStatus` | alias of `OnboardingStatus` (6 values) | `App\Enums\SubTenantOnboardingStatus` |
| `QuoteAuditAction` | 21 values — `'created'`, `'updated'`, `'line_added'`, `'line_removed'`, `'line_updated'`, `'buyer_changed'`, `'sent'`, `'resent'`, `'viewed'`, `'signed'`, `'accepted'`, `'refused'`, `'cancelled'`, `'expired'`, `'converted'`, `'public_link_regenerated'`, `'public_link_revoked'`, `'duplicated'`, `'deposit_generated_from_schedule'`, `'schedule_updated'`, `'schedule_deleted'` | `App\Enums\Quote\QuoteAuditAction` |
| `CreditNoteType` | `'partial' \| 'total'` | `credit_notes.type` CHECK |
| `SignatureArchiveStatus` | `'pending' \| 'archived' \| 'glacier' \| 'error'` | `signatures.archive_status` CHECK |
| `InvoiceArchiveStatus` | `'pending' \| 'archived' \| 'glacier' \| 'error'` | `invoices.archive_status` CHECK |
| `TenantKybStatus` | `'pending' \| 'documents_submitted' \| 'under_review' \| 'verified' \| 'rejected'` | `Tenant::KYB_STATUS_*` |
| `CompanyStatus` | `'pending_kyc' \| 'active' \| 'suspended'` | `companies.status` CHECK |
| `ApiKeyStatus` | `'active' \| 'revoked'` | `api_keys.status` CHECK |
| `TenantInvoiceStatus` | `'draft' \| 'sent' \| 'paid' \| 'overdue' \| 'cancelled'` | `tenant_invoices.status` CHECK |
| `TenantTransactionType` | `'debit' \| 'credit'` | `tenant_transactions.type` CHECK |
| `OnboardingSessionStatus` | 9 values — `'initiated'`, `'siret_verified'`, `'vat_verified'`, `'documents_pending'`, `'documents_submitted'`, `'under_review'`, `'completed'`, `'failed'`, `'expired'` | `OnboardingSession::STATUS_*` |
| `QuoteStatus` (re-exported from root) | now 8 values (added `'viewed'`, `'expired'`) — full alignment with `App\Enums\Quote\QuoteStatus` | `App\Enums\Quote\QuoteStatus` |

#### Extended — `QuoteStatus` from 6 to 8 values (non-breaking)

The `QuoteStatus` union now includes the two missing backend values:

- `'viewed'` — buyer opened the public viewer at least once
- `'expired'` — `validity_date` passed without buyer decision

The two new literals are additive — existing code accepting only the 6
previous values keeps compiling. The full union is now:

```ts
export type QuoteStatus =
  | 'draft' | 'sent' | 'viewed' | 'accepted'
  | 'refused' | 'expired' | 'converted' | 'cancelled';
```

#### Tool description enrichments

The 5 listed-resource tools now surface the full set of legal filter values
in their MCP description, so the LLM can produce valid queries without
guessing:

- `scell_list_quotes` — enumerates the 8 `QuoteStatus` values (incl. new `'viewed'` and `'expired'`)
- `scell_list_signatures` — enumerates the 7 `SignatureStatus` values + the 4 `archive_status` values
- `scell_list_credit_notes` — enumerates `status` (`draft \| sent`) AND `type` (`partial \| total`) filters
- `scell_list_invoices` — already enriched in v2.21.0; now also documents the `archive_status` field exposed on every returned invoice
- `scell_get_subtenant_status` — enumerates the 6 `SubTenantOnboardingStatus` values and tells the LLM which one triggers which remediation tool

#### Non-breaking notes

- `CreditNoteStatus` documentation now clarifies that the backend canonical
  values are `'draft' \| 'sent'` only. The legacy `'cancelled'` literal is
  preserved in the union for backwards compatibility with SDK consumers
  ≤ v2.21.0.
- All new exports are pure type-level additions. No runtime behaviour
  changes. No breaking change for existing consumers.

#### Tests

- New: `tests/backend-enum-mirrors.test.mjs` — 41 cases covering union
  declarations in `.d.ts`, root re-exports, runtime assignability, and
  tool-description enumerations.

## [2.21.0] - 2026-05-27

### Added — Full `InvoiceStatus` union + `RefundStatus` / `totalRefunded` on `Invoice`

The backend `invoices.status` PostgreSQL CHECK constraint now exposes 16
lifecycle values (previously the SDK typed only 6). The `Invoice` response
also carries two new read-only fields auto-maintained by the backend
`CreditNoteObserver` when validated credit notes target an invoice.

#### New `InvoiceStatus` type (exported)

```ts
export type InvoiceStatus =
  | 'draft'           // Editing, not yet validated
  | 'validating'      // Fiscal sequence + numbering being locked
  | 'validated'       // Issued (immutable on ISCA ledger)
  | 'converting'      // Factur-X / UBL / CII generation in progress
  | 'converted'       // XML+PDF artefacts produced and stored on S3
  | 'transmitting'    // Submission to SuperPDP / PEPPOL in progress
  | 'transmitted'     // Successfully accepted by recipient platform
  | 'accepted'        // Buyer (or their PDP) acknowledged
  | 'rejected'        // Recipient platform rejected
  | 'disputed'        // Buyer flagged a litigation
  | 'paid'            // Marked as paid (manual or auto)
  | 'received'        // Incoming invoice received from counterparty
  | 'completed'       // Terminal — no further transitions
  | 'error'           // Terminal failure
  | 'refunded'        // Credit note fully credited the invoice
  | 'partially_refunded'; // Credit note partially credited the invoice
```

The `Invoice.status` field now uses this union (previously
`'draft' | 'pending' | 'sent' | 'paid' | 'cancelled' | 'disputed'` — which
did not match the backend reality).

#### New `RefundStatus` type (exported)

```ts
export type RefundStatus = 'none' | 'partial' | 'full';
```

#### New `Invoice` fields (both optional, read-only)

| Field | Type | Description |
|---|---|---|
| `refundStatus` | `RefundStatus` | Aggregated refund coverage. `'full'` pairs with `status='refunded'`, `'partial'` with `status='partially_refunded'`. |
| `totalRefunded` | `number` | Sum of `totalIncludingTax` of every validated credit note targeting this invoice. `0` when `refundStatus='none'`. |

Both are auto-set by the backend `CreditNoteObserver` on credit note
validation — clients never write to these fields.

#### Tool documentation updates

- `scell_get_invoice` description now enumerates the full 16-value status
  set and documents the new `refund_status` / `total_refunded` REST
  response fields, with a hint to use `refund_status='full'` for robust
  refund detection.
- `scell_list_invoices` description now enumerates the full status set
  for the `status` query filter (with common LLM filtering patterns:
  `status=paid`, `status=transmitted`, `status=refunded`,
  `status=partially_refunded`) and documents the new response fields.

The MCP server consuming this client config maps camelCase ↔ snake_case
for the REST API:

- `refundStatus` ↔ `refund_status`
- `totalRefunded` ↔ `total_refunded`

### Compat

- **Backward compatible at runtime**: no breaking changes to the request
  payload of any tool. The new fields are response-only.
- **TypeScript breaking-ish for strict consumers**: the `Invoice.status`
  union was previously `'draft'|'pending'|'sent'|'paid'|'cancelled'|'disputed'`
  (a subset that did NOT match the backend reality). It is now the
  exhaustive 16-value `InvoiceStatus` union. Code that exhaustively
  switched on the old narrower union (e.g. `switch(invoice.status)` with
  no `default`) will need to handle the new values — but this was already
  a latent bug (the backend always emitted those values). Code that read
  `invoice.status` as a string and compared with `===` is unaffected.

## [2.20.0] - 2026-05-27

### Added — `parentQuoteId` + `invoiceType` on `InvoiceInput`

The backend now supports `parent_quote_id` on `POST /api/v1/invoices` for
**standard** invoices (`invoice_type='standard'`), in addition to the
existing support for deposit / balance invoices (which are typically
generated via `scell_convert_quote_to_deposit` /
`scell_convert_quote_to_balance`).

This enables tracking a standalone invoice that originated from a
commercial quote — without going through the deposit/balance conversion
flow — for traceability and reporting.

#### New `InvoiceInput` fields (camelCase, both optional)

| Field | Type | Description |
|---|---|---|
| `invoiceType` | `'standard' \| 'deposit' \| 'balance'` | Defaults to `'standard'` when omitted. |
| `parentQuoteId` | `string` (UUID) | Optional link to a source quote. Only valid for `'standard'` invoices when set explicitly — for deposit/balance, use the dedicated conversion tools. |

The MCP server consuming this client config maps camelCase → snake_case
before `POST /api/v1/invoices`:

- `parentQuoteId` → `parent_quote_id`
- `invoiceType` → `invoice_type`

#### Tool description update

`scell_create_invoice` description now explicitly documents the v2.20.0
behavior: `parent_quote_id` is valid for `invoice_type='standard'` (the
default), enabling LLMs to track quote-originated invoices without going
through the conversion flow. Anti-IDOR: the API returns 403 if the quote
does not belong to the tenant resolved from the `X-API-Key` header.

### Compat

- Fully backward compatible: both fields are optional. Existing
  integrations that did not pass `invoiceType` or `parentQuoteId`
  continue to work as before (backend defaults to `'standard'` and
  `parent_quote_id = NULL`).

## [2.19.0] - 2026-05-26

### Added — `scell_resolve_vat_context` + TVA auto-résolution dans `scell_create_invoice`

#### Nouveau tool : `scell_resolve_vat_context`

Résout le taux et la catégorie TVA applicable à une ligne de facture,
en tenant compte du profil acheteur (pays, numéro de TVA intracommunautaire,
B2B / B2C) et du contexte de la ligne (catégorie, lieu de prestation, nature).

- **Endpoint** : `POST /api/v1/tenant/buyers/vat-context`
- **Auth** : `sk_*` / `pk_*`
- **Input** : `buyer_id` OU `buyer { country, vatNumber?, isIndividual? }` +
  `line { category, placeOfSupply?, serviceNature? }`
- **Output** : `{ resolution: VatResolution, warnings: string[] }`

Cas d'usage principal : l'agent LLM reçoit une demande de facturation B2B
intracom européen et doit déterminer que le taux applicable est **0 %
REVERSE_CHARGE** (autoliquidation art. 259-1 CGI) avant de créer la facture.

#### VAT auto-résolution dans `scell_create_invoice` (since 2.19.0)

`lines[].vatRate` est maintenant **optionnel** quand `lines[].category` est
fourni. Le MCP layer appelle automatiquement `scell_resolve_vat_context` pour
chaque ligne sans `vatRate`, puis renseigne le taux résolu + les métadonnées
(`metadata.exemption_reason`, `metadata.category`) avant d'envoyer la requête
au backend.

Quand `vatRate` **et** `category` sont tous les deux fournis, le `vatRate`
explicite est respecté tel quel ; `category` est transmis pour la génération
du nœud Factur-X EN16931, sans appel supplémentaire au resolver.

#### Nouveaux types TypeScript

| Type | Description |
|---|---|
| `VatCategory` | Union de 8 catégories TVA EN16931 : `STANDARD`, `INTERMEDIATE`, `REDUCED`, `SUPER_REDUCED`, `ZERO_RATED`, `EXEMPT`, `REVERSE_CHARGE`, `OUT_OF_SCOPE` |
| `VatResolution` | Résultat du resolver : `rate`, `category`, `en16931Code`, `exemptionReason`, `justification`, `isAutoResolved`, `rule` |
| `LineVatContext` | Contexte ligne pour le resolver : `category`, `placeOfSupply?`, `serviceNature?` |
| `VatContextRequest` | Body complet pour `POST /api/v1/tenant/buyers/vat-context` |
| `VatContextResponse` | Réponse complète : `resolution` + `warnings[]` |

#### Extension de `InvoiceLine`

- `vatRate?: number` — **optionnel** depuis 2.19.0 (était requis). Compatible
  descendant : les intégrations existantes qui passent `vatRate` continuent de
  fonctionner sans modification.
- `category?: VatCategory` — nouveau champ optionnel. Déclenche l'auto-résolution
  quand `vatRate` est absent.

### Changed

- Compteur de tools : **55 → 57** (`scell_resolve_vat_context` + documentation
  de l'auto-résolution dans `scell_create_invoice`).

## [2.18.0] - 2026-05-26

### Security
- Documentation aligned with Scell.io backend security hardening (audit 2026-05-26).
- `WebhookPayload<T>` type unchanged — signature verification remains the
  responsibility of the consumer (use `@scell/sdk` `ScellWebhooks` helper).
- Note for MCP clients: webhook secrets are now only readable ONCE via
  `webhooks.create()` / `webhooks.regenerateSecret()`. Subsequent reads
  return a fingerprint only. Store the secret immediately.

### Changed
- Bumped peer SDK references in tools doc to mention v2.19.0 (`@scell/sdk`)
  and v2.17.0 (`scell/sdk` PHP) as recommended companion versions.

## [2.17.0] - 2026-05-26

### Added

- `attachments[]` on signature creation tool for multi-document bundles (up to 10 attachments).
- `documentIndex` on signature positions, mentions, and initials positions to target a specific document.
- New `SignatureAttachment` schema/type.

## [2.16.1] - 2026-05-25

### Changed

- Documentation: rewording générique des mentions du fournisseur de signature partenaire (aucun changement de surface publique).

## [2.16.0] - 2026-05-25

### Added — InitialsPosition : positions par page pour les paraphes eIDAS EU-SES

**Nouveau type `InitialsPosition`**
- Interface TypeScript `InitialsPosition` pour définir la position d'un paraphe
  sur une page PDF spécifique.
- Champs : `page` (1-indexed, 1–500), `x`, `y` (0–5000), `unit` (`'percent'` | `'pixel'`, défaut `'percent'`), `pageWidthPx`, `pageHeightPx` (fallback A4), `fontSize` (6–20), `color` (`#RRGGBB`), `bold`.

**Extension de `InitialsBlock`**
- Nouveau champ `positions?: InitialsPosition[]` — tableau de positions par page.
  Remplace `position + pages` côté backend si fourni. Les pages absentes du tableau
  ne reçoivent pas de paraphe.
- Nouveau champ `bold?: boolean` — mettre les initiales en gras globalement.
  Peut être surchargé par `InitialsPosition.bold` page par page.

**Compatibilité descendante**
- Format legacy (`position` + `pages: 'all' | 'except_last' | number[]`) toujours
  supporté. Si `positions[]` est fourni, il prend la priorité côté backend.

**Tool `scell_create_signature` mis à jour**
- Description étendue pour documenter les deux formats avec exemples JSON.
- Correspondances snake_case : `pageWidthPx` → `page_width_px`, `pageHeightPx` → `page_height_px`.

**llms.txt mis à jour**
- Section `## v2.16.0 (2026-05-25)` avec interface complète, exemples JSON nouveau
  et legacy, guidance LLM sur quand utiliser chaque format.

### Exports
- `InitialsPosition` ajouté aux exports publics du package.

---

## [2.14.0] - 2026-05-24

### Added — 11 nouveaux tools documentés

**Quote actions (5 new)**
- `scell_regenerate_quote_public_link` — Génère un fresh `public_token`
  + révoque le précédent. TTL configurable (default 90j, max 365j).
- `scell_revoke_quote_public_link` — Marque le token comme révoqué
  (URL viewer retourne 404 immédiat). Idempotent.
- `scell_get_quote_pdf` — Binaire PDF du devis (Snappy/wkhtmltopdf,
  branded avec logo + couleur tenant, échéancier + bloc signature).
- `scell_preview_quote_pdf` — Render PDF depuis payload brut sans
  persister le devis (preview UI temps réel).
- `scell_get_quote_audit_log` (déjà documenté) — chaîne SHA-256
  tamper-evident des transitions.

**Payment Schedule (7 new)**
- `scell_get_quote_payment_schedule` — Liste les lignes d'échéancier
  ordonnées (`order` puis `due_date`).
- `scell_set_quote_payment_schedule` — Remplace l'intégralité de
  l'échéancier (idempotent). Validation : somme percent ≤ 100% ou
  somme fixed ≤ total_ttc.
- `scell_patch_quote_payment_schedule` — Changements ciblés (add /
  update / remove) sans tout remplacer.
- `scell_delete_quote_payment_schedule` — Supprime toutes les lignes.
  Bloqué si une ligne est `invoiced`.
- `scell_get_quote_payment_summary` — Agrégats + lignes (
  `schedule`, `invoiced`, `next_due`, `overdue`, `superpdp_status`,
  `lines: PaymentScheduleLine[]`).
- `scell_convert_schedule_line_to_invoice` — Génère une facture
  d'acompte depuis une ligne d'échéancier. Lock automatique.
- `scell_list_payment_schedule_presets` — Templates 30/70, 50/50,
  3 jalons, etc. à appliquer via `scell_set_quote_payment_schedule`.

### Type augmenté

- **`PaymentSummary.lines: PaymentScheduleLine[]`** — Nouveau champ
  exposé par le backend depuis `PaymentSummaryService.summary()`.
  Permet à l'agent LLM d'afficher le tracker complet sans appel
  supplémentaire à `GET /payment-schedule`.

### CLI

- `VERSION` cli.ts bumped 2.13.0 → 2.14.0.

## [2.13.1] - 2026-05-24

### Added

- **`CreateQuoteInput.callbackUrl`** + **`UpdateQuoteInput.callbackUrl`**
  + **`Quote.callbackUrl`** — Le tenant peut fournir une URL de
  callback à la création du devis. Après acceptation ou refus via le
  viewer public, le buyer est redirigé vers cette URL avec query
  string :
  `?status=signed|refused&quote_id=<UUID>&quote_number=<num>&reason=<txt>`
- Description du tool `scell_create_quote` enrichie pour mentionner
  ce nouveau champ.

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
