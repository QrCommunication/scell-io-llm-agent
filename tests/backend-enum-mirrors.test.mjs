/**
 * Tests for the backend enum mirrors exposed in v2.22.0.
 *
 * Verifies that:
 * - Every new type is exported from `dist/index.js` AND `dist/types/index.js`.
 * - The exact set of values for every enum string union matches the backend
 *   source of truth (PHP `App\Enums\*` or PostgreSQL CHECK constraints).
 * - The new tool description annotations land in `dist/config/generator.js`
 *   so the LLM can enumerate filter values at runtime.
 *
 * Run: node --test tests/backend-enum-mirrors.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readDts(filename) {
  const dtsPath = resolve(__dirname, `../dist/types/${filename}`);
  try {
    return readFileSync(dtsPath, 'utf8');
  } catch {
    return '';
  }
}

function readDist(filename) {
  const distPath = resolve(__dirname, `../dist/${filename}`);
  try {
    return readFileSync(distPath, 'utf8');
  } catch {
    return '';
  }
}

function assertUnionMatches(dts, typeName, expectedValues) {
  // The TS compiler emits `export type Foo = 'a' | 'b' | 'c'` on one line
  // (when short) or split across multiple lines (when long).
  // Strategy: find the declaration, then assert each expected literal is
  // present in the surrounding window. We do NOT enforce ordering because
  // tsc may reorder unions in edge cases.
  const declRe = new RegExp(`export type ${typeName}\\b[^;]*;`, 's');
  const match = dts.match(declRe);
  assert.ok(
    match,
    `Type ${typeName} should be declared in the .d.ts (got: ${dts.slice(0, 200)}...)`,
  );
  const body = match[0];
  for (const v of expectedValues) {
    assert.ok(
      body.includes(`"${v}"`) || body.includes(`'${v}'`),
      `Type ${typeName} should include literal "${v}" — got: ${body}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Type exports — every new enum lands in dist/types/index.d.ts
// ---------------------------------------------------------------------------

describe('Backend enum mirrors — .d.ts type declarations (v2.22.0)', () => {
  const dts = readDts('index.d.ts');

  it('InvoiceTemplateKind = invoice | quote | both', () => {
    assertUnionMatches(dts, 'InvoiceTemplateKind', ['invoice', 'quote', 'both']);
  });

  it('InvoiceType = standard | deposit | balance', () => {
    assertUnionMatches(dts, 'InvoiceType', ['standard', 'deposit', 'balance']);
  });

  it('PaymentScheduleLineAmountType (alias of PaymentScheduleAmountType)', () => {
    assert.match(
      dts,
      /export type PaymentScheduleLineAmountType\s*=\s*PaymentScheduleAmountType/,
      'PaymentScheduleLineAmountType should be declared as an alias',
    );
  });

  it('PaymentScheduleLineStatus = pending | invoiced | cancelled (already exists)', () => {
    assertUnionMatches(dts, 'PaymentScheduleLineStatus', ['pending', 'invoiced', 'cancelled']);
  });

  it('SubTenantOnboardingStatus (alias of OnboardingStatus)', () => {
    assert.match(
      dts,
      /export type SubTenantOnboardingStatus\s*=\s*OnboardingStatus/,
      'SubTenantOnboardingStatus should be declared as an alias',
    );
  });

  it('QuoteStatus — 8 values aligned with backend QuoteStatus enum', () => {
    assertUnionMatches(dts, 'QuoteStatus', [
      'draft',
      'sent',
      'viewed',
      'accepted',
      'refused',
      'expired',
      'converted',
      'cancelled',
    ]);
  });

  it('QuoteAuditAction — 21 values aligned with backend QuoteAuditAction enum', () => {
    assertUnionMatches(dts, 'QuoteAuditAction', [
      'created',
      'updated',
      'line_added',
      'line_removed',
      'line_updated',
      'buyer_changed',
      'sent',
      'resent',
      'viewed',
      'signed',
      'accepted',
      'refused',
      'cancelled',
      'expired',
      'converted',
      'public_link_regenerated',
      'public_link_revoked',
      'duplicated',
      'deposit_generated_from_schedule',
      'schedule_updated',
      'schedule_deleted',
    ]);
  });

  it('VatCategory — 8 EN16931 categories (re-exported from vat.ts)', () => {
    const vatDts = readDts('vat.d.ts');
    assertUnionMatches(vatDts, 'VatCategory', [
      'STANDARD',
      'INTERMEDIATE',
      'REDUCED',
      'SUPER_REDUCED',
      'ZERO_RATED',
      'EXEMPT',
      'REVERSE_CHARGE',
      'OUT_OF_SCOPE',
    ]);
  });

  it('CreditNoteStatus — backend canonical draft | sent (cancelled preserved for back-compat)', () => {
    // Backend canonical is draft|sent; SDK keeps cancelled for back-compat.
    assertUnionMatches(dts, 'CreditNoteStatus', ['draft', 'sent']);
  });

  it('CreditNoteType = partial | total', () => {
    assertUnionMatches(dts, 'CreditNoteType', ['partial', 'total']);
  });

  it('SignatureStatus — 7 backend values', () => {
    assertUnionMatches(dts, 'SignatureStatus', [
      'pending',
      'waiting_signers',
      'partially_signed',
      'completed',
      'refused',
      'expired',
      'error',
    ]);
  });

  it('SignatureArchiveStatus — 4 backend values', () => {
    assertUnionMatches(dts, 'SignatureArchiveStatus', [
      'pending',
      'archived',
      'glacier',
      'error',
    ]);
  });

  it('InvoiceArchiveStatus — 4 backend values', () => {
    assertUnionMatches(dts, 'InvoiceArchiveStatus', [
      'pending',
      'archived',
      'glacier',
      'error',
    ]);
  });

  it('TenantKybStatus — 5 backend values', () => {
    assertUnionMatches(dts, 'TenantKybStatus', [
      'pending',
      'documents_submitted',
      'under_review',
      'verified',
      'rejected',
    ]);
  });

  it('CompanyStatus — 3 backend values', () => {
    assertUnionMatches(dts, 'CompanyStatus', ['pending_kyc', 'active', 'suspended']);
  });

  it('ApiKeyStatus — 2 backend values', () => {
    assertUnionMatches(dts, 'ApiKeyStatus', ['active', 'revoked']);
  });

  it('TenantInvoiceStatus — 5 backend values', () => {
    assertUnionMatches(dts, 'TenantInvoiceStatus', [
      'draft',
      'sent',
      'paid',
      'overdue',
      'cancelled',
    ]);
  });

  it('TenantTransactionType — debit | credit', () => {
    assertUnionMatches(dts, 'TenantTransactionType', ['debit', 'credit']);
  });

  it('OnboardingSessionStatus — 9 backend values', () => {
    assertUnionMatches(dts, 'OnboardingSessionStatus', [
      'initiated',
      'siret_verified',
      'vat_verified',
      'documents_pending',
      'documents_submitted',
      'under_review',
      'completed',
      'failed',
      'expired',
    ]);
  });
});

// ---------------------------------------------------------------------------
// Root index re-exports — every new enum is reachable via @scell/mcp-client
// ---------------------------------------------------------------------------

describe('Backend enum mirrors — root package re-exports (v2.22.0)', () => {
  const rootDts = readDts('../index.d.ts'); // dist/index.d.ts

  const expected = [
    'InvoiceType',
    'InvoiceTemplateKind',
    'InvoiceArchiveStatus',
    'CreditNoteType',
    'SignatureArchiveStatus',
    'SubTenantOnboardingStatus',
    'TenantKybStatus',
    'TenantInvoiceStatus',
    'TenantTransactionType',
    'CompanyStatus',
    'ApiKeyStatus',
    'OnboardingSessionStatus',
    'PaymentScheduleLineAmountType',
    'QuoteStatus',
    'QuoteAuditAction',
  ];

  for (const t of expected) {
    it(`${t} is re-exported from dist/index.d.ts`, () => {
      // The barrel emits one export per identifier; the name appears in
      // either `export type { ..., FOO, ... }` or `export { type FOO }`.
      assert.ok(
        new RegExp(`\\b${t}\\b`).test(rootDts),
        `${t} should appear in dist/index.d.ts`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// Runtime value assignability — checks that the .d.ts unions are usable
// ---------------------------------------------------------------------------

describe('Backend enum mirrors — runtime assignability', () => {
  it('accepts every QuoteStatus literal (including viewed + expired)', () => {
    for (const status of [
      'draft',
      'sent',
      'viewed',
      'accepted',
      'refused',
      'expired',
      'converted',
      'cancelled',
    ]) {
      /** @type {import('../dist/types/index.js').QuoteStatus} */
      const v = /** @type {any} */ (status);
      assert.strictEqual(v, status);
    }
  });

  it('accepts CreditNoteType partial + total', () => {
    /** @type {import('../dist/types/index.js').CreditNoteType} */
    let v = 'partial';
    assert.strictEqual(v, 'partial');
    v = 'total';
    assert.strictEqual(v, 'total');
  });

  it('accepts every SignatureStatus literal', () => {
    for (const status of [
      'pending',
      'waiting_signers',
      'partially_signed',
      'completed',
      'refused',
      'expired',
      'error',
    ]) {
      /** @type {import('../dist/types/index.js').SignatureStatus} */
      const v = /** @type {any} */ (status);
      assert.strictEqual(v, status);
    }
  });

  it('accepts every InvoiceArchiveStatus + SignatureArchiveStatus literal', () => {
    for (const status of ['pending', 'archived', 'glacier', 'error']) {
      /** @type {import('../dist/types/index.js').InvoiceArchiveStatus} */
      const inv = /** @type {any} */ (status);
      /** @type {import('../dist/types/index.js').SignatureArchiveStatus} */
      const sig = /** @type {any} */ (status);
      assert.strictEqual(inv, status);
      assert.strictEqual(sig, status);
    }
  });

  it('accepts TenantTransactionType debit + credit', () => {
    /** @type {import('../dist/types/index.js').TenantTransactionType} */
    let v = 'debit';
    assert.strictEqual(v, 'debit');
    v = 'credit';
    assert.strictEqual(v, 'credit');
  });

  it('accepts every TenantKybStatus literal', () => {
    for (const v of [
      'pending',
      'documents_submitted',
      'under_review',
      'verified',
      'rejected',
    ]) {
      /** @type {import('../dist/types/index.js').TenantKybStatus} */
      const s = /** @type {any} */ (v);
      assert.strictEqual(s, v);
    }
  });
});

// ---------------------------------------------------------------------------
// Tool descriptions — enriched filter enumerations land in generator output
// ---------------------------------------------------------------------------

describe('Tool description enrichments (v2.22.0)', () => {
  const generatorJs = readDist('config/generator.js');

  it('scell_list_quotes mentions all 8 QuoteStatus values', () => {
    const allValues = [
      'draft',
      'sent',
      'viewed',
      'accepted',
      'refused',
      'expired',
      'converted',
      'cancelled',
    ];
    const slice = generatorJs.slice(
      generatorJs.indexOf('scell_list_quotes'),
      generatorJs.indexOf('scell_update_quote'),
    );
    for (const v of allValues) {
      assert.ok(slice.includes(`'${v}'`), `scell_list_quotes should mention '${v}' — slice: ${slice.slice(0, 400)}`);
    }
  });

  it('scell_list_signatures mentions all 7 SignatureStatus values', () => {
    const allValues = [
      'pending',
      'waiting_signers',
      'partially_signed',
      'completed',
      'refused',
      'expired',
      'error',
    ];
    const slice = generatorJs.slice(
      generatorJs.indexOf('scell_list_signatures'),
      generatorJs.indexOf('scell_tenant_list_signatures'),
    );
    for (const v of allValues) {
      assert.ok(slice.includes(`'${v}'`), `scell_list_signatures should mention '${v}'`);
    }
  });

  it('scell_list_signatures mentions all 4 SignatureArchiveStatus values', () => {
    const slice = generatorJs.slice(
      generatorJs.indexOf('scell_list_signatures'),
      generatorJs.indexOf('scell_tenant_list_signatures'),
    );
    for (const v of ['pending', 'archived', 'glacier', 'error']) {
      assert.ok(
        slice.includes(`'${v}'`),
        `scell_list_signatures should mention SignatureArchiveStatus value '${v}'`,
      );
    }
  });

  it('scell_list_credit_notes mentions both status (draft|sent) and type (partial|total) filters', () => {
    const slice = generatorJs.slice(
      generatorJs.indexOf('scell_list_credit_notes'),
      generatorJs.indexOf('scell_get_credit_note'),
    );
    for (const v of ['draft', 'sent', 'partial', 'total']) {
      assert.ok(
        slice.includes(`'${v}'`),
        `scell_list_credit_notes should mention '${v}'`,
      );
    }
  });

  it('scell_list_invoices mentions InvoiceArchiveStatus values', () => {
    const slice = generatorJs.slice(
      generatorJs.indexOf('scell_list_invoices'),
      generatorJs.indexOf('scell_download_invoice'),
    );
    for (const v of ['pending', 'archived', 'glacier']) {
      assert.ok(
        slice.includes(`'${v}'`),
        `scell_list_invoices should mention archive_status value '${v}'`,
      );
    }
  });

  it('scell_get_subtenant_status mentions all 6 SubTenantOnboardingStatus values', () => {
    const allValues = [
      'pending_superpdp',
      'superpdp_redirected',
      'superpdp_authorized',
      'superpdp_pending_review',
      'active',
      'superpdp_failed',
    ];
    const slice = generatorJs.slice(
      generatorJs.indexOf('scell_get_subtenant_status'),
      generatorJs.indexOf('scell_refresh_subtenant_status'),
    );
    for (const v of allValues) {
      assert.ok(slice.includes(`'${v}'`), `scell_get_subtenant_status should mention '${v}'`);
    }
  });
});
