# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.2.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.2.0
[1.1.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v1.1.0
[0.1.0]: https://github.com/QrCommunication/scell-io-llm-agent/releases/tag/v0.1.0
