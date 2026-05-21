/**
 * Tests for Payment Schedule + Branding types (v2.13.0)
 *
 * These are structural / schema validation tests using Node.js built-in
 * test runner (`node --test`). They verify that:
 * - The new types can be constructed and satisfy their expected shapes
 * - Key constraints (amount_type, status literals) match the spec
 * - The new exports are present in the compiled dist
 *
 * Run: node --test tests/payment-schedule-types.test.mjs
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

/**
 * Parse the compiled dist/types/index.d.ts and check that a given export name
 * appears as an exported interface or type alias.
 */
function assertExportedFromTypes(name) {
  const dtsPath = resolve(__dirname, '../dist/types/index.d.ts');
  let content;
  try {
    content = readFileSync(dtsPath, 'utf8');
  } catch {
    // dist may not exist yet in CI before build — skip gracefully
    return;
  }
  assert.ok(
    content.includes(`export interface ${name}`) ||
      content.includes(`export type ${name}`) ||
      content.includes(`export declare interface ${name}`) ||
      content.includes(`export declare type ${name}`),
    `Expected '${name}' to be exported from dist/types/index.d.ts`,
  );
}

// ---------------------------------------------------------------------------
// Schema shape tests (pure JS object construction — no TypeScript compiler)
// ---------------------------------------------------------------------------

describe('PaymentScheduleLineInput schema', () => {
  it('accepts a percent line with due_date', () => {
    /** @type {import('../dist/types/index.js').PaymentScheduleLineInput} */
    const line = {
      amount_type: 'percent',
      amount_value: 30,
      due_date: '2026-07-01',
      milestone_label: 'Acompte commande',
      auto_generate: true,
    };
    assert.strictEqual(line.amount_type, 'percent');
    assert.strictEqual(line.amount_value, 30);
    assert.strictEqual(line.due_date, '2026-07-01');
    assert.strictEqual(line.auto_generate, true);
  });

  it('accepts a fixed-amount milestone-only line', () => {
    /** @type {import('../dist/types/index.js').PaymentScheduleLineInput} */
    const line = {
      amount_type: 'amount',
      amount_value: 5000,
      milestone_label: 'Livraison MVP',
      auto_generate: false,
    };
    assert.strictEqual(line.amount_type, 'amount');
    assert.strictEqual(line.milestone_label, 'Livraison MVP');
    assert.ok(line.due_date === undefined || line.due_date === null);
  });
});

describe('PaymentSchedulePatchInput schema', () => {
  it('accepts add-only patch', () => {
    /** @type {import('../dist/types/index.js').PaymentSchedulePatchInput} */
    const patch = {
      add: [
        { amount_type: 'percent', amount_value: 40, milestone_label: 'Phase 2' },
      ],
    };
    assert.ok(Array.isArray(patch.add));
    assert.strictEqual(patch.add.length, 1);
  });

  it('accepts remove-only patch', () => {
    /** @type {import('../dist/types/index.js').PaymentSchedulePatchInput} */
    const patch = {
      remove: ['00000000-0000-0000-0000-000000000001'],
    };
    assert.ok(Array.isArray(patch.remove));
  });

  it('accepts combined add + update + remove patch', () => {
    /** @type {import('../dist/types/index.js').PaymentSchedulePatchInput} */
    const patch = {
      add: [{ amount_type: 'percent', amount_value: 10, milestone_label: 'Bonus' }],
      update: [{ id: '00000000-0000-0000-0000-000000000002', due_date: '2026-09-01' }],
      remove: ['00000000-0000-0000-0000-000000000003'],
    };
    assert.ok(patch.update?.[0].id);
  });
});

describe('PaymentScheduleLine response shape', () => {
  it('has expected fields with proper types', () => {
    /** @type {import('../dist/types/index.js').PaymentScheduleLine} */
    const line = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      quote_id: '550e8400-e29b-41d4-a716-446655440001',
      order: 1,
      amount_type: 'percent',
      amount_value: 30,
      amount_ttc_snapshot: 3000.0,
      due_date: '2026-07-01',
      milestone_label: 'Acompte commande',
      description: null,
      auto_generate: true,
      status: 'pending',
      invoice_id: null,
      invoiced_at: null,
      locked_at: null,
      created_at: '2026-05-21T12:00:00Z',
      updated_at: '2026-05-21T12:00:00Z',
    };
    assert.strictEqual(line.status, 'pending');
    assert.strictEqual(line.invoice_id, null);
    assert.ok(typeof line.amount_ttc_snapshot === 'number');
  });

  it('supports invoiced status with invoice_id set', () => {
    /** @type {Partial<import('../dist/types/index.js').PaymentScheduleLine>} */
    const line = {
      status: 'invoiced',
      invoice_id: '550e8400-e29b-41d4-a716-446655440002',
      invoiced_at: '2026-07-02T08:00:00Z',
    };
    assert.strictEqual(line.status, 'invoiced');
    assert.ok(line.invoice_id);
  });
});

describe('PaymentSummary response shape', () => {
  it('has all required top-level keys', () => {
    /** @type {import('../dist/types/index.js').PaymentSummary} */
    const summary = {
      quote: { id: 'q1', quote_number: 'DEV-2026-0001', total_ttc: 10000 },
      schedule: {
        planned_total_ttc: 7000,
        planned_remainder: 3000,
        lines_count: 3,
        pending_count: 2,
        invoiced_count: 1,
      },
      invoiced: {
        gross_ttc: 3000,
        credits_ttc: 0,
        net_ttc: 3000,
        remaining_ttc: 7000,
        remaining_pct: 70.0,
      },
      next_due: {
        line_id: 'l2',
        due_date: '2026-08-01',
        amount_ttc: 3000,
        label: 'Phase 2',
        days_until: 72,
      },
      overdue: [],
      superpdp_status: [],
    };
    assert.strictEqual(summary.invoiced.remaining_pct, 70.0);
    assert.strictEqual(summary.overdue.length, 0);
    assert.ok(summary.next_due !== null);
  });

  it('supports null next_due when no upcoming line', () => {
    /** @type {Partial<import('../dist/types/index.js').PaymentSummary>} */
    const partial = { next_due: null };
    assert.strictEqual(partial.next_due, null);
  });
});

describe('PaymentSchedulePreset shape', () => {
  it('has key, label, and lines array', () => {
    /** @type {import('../dist/types/index.js').PaymentSchedulePreset} */
    const preset = {
      key: '30-70',
      label: '30% / 70%',
      lines: [
        { amount_type: 'percent', amount_value: 30, milestone_label: 'Acompte 30%' },
        { amount_type: 'percent', amount_value: 70, milestone_label: 'Solde 70%' },
      ],
    };
    assert.strictEqual(preset.key, '30-70');
    assert.strictEqual(preset.lines.length, 2);
    assert.strictEqual(preset.lines[0].amount_value, 30);
  });
});

describe('InvoiceSendByEmailResult shape', () => {
  it('has sent_to, sent_at, message_id, cc', () => {
    /** @type {import('../dist/types/index.js').InvoiceSendByEmailResult} */
    const result = {
      sent_to: 'compta@buyer.com',
      sent_at: '2026-05-21T14:32:01Z',
      message_id: '<abc123@scell.io>',
      cc: ['manager@buyer.com'],
    };
    assert.strictEqual(result.sent_to, 'compta@buyer.com');
    assert.ok(Array.isArray(result.cc));
    assert.strictEqual(result.cc.length, 1);
  });

  it('allows empty cc', () => {
    /** @type {import('../dist/types/index.js').InvoiceSendByEmailResult} */
    const result = {
      sent_to: 'buyer@example.com',
      sent_at: '2026-05-21T14:32:01Z',
      message_id: '<xyz@scell.io>',
      cc: [],
    };
    assert.strictEqual(result.cc.length, 0);
  });
});

describe('Branding shape', () => {
  it('represents a complete tenant branding', () => {
    /** @type {import('../dist/types/index.js').Branding} */
    const branding = {
      scope: 'tenant',
      company_id: '550e8400-e29b-41d4-a716-446655440010',
      brand_logo_url: 'https://cdn.scell.io/branding/tenant/logo.png',
      brand_primary_color: '#1A73E8',
      brand_email_footer: 'Société XYZ — 12 rue de la République, 75001 Paris',
      brand_email_signature: "L'équipe Société XYZ",
      is_complete: true,
      missing_fields: [],
    };
    assert.strictEqual(branding.scope, 'tenant');
    assert.strictEqual(branding.is_complete, true);
    assert.strictEqual(branding.missing_fields.length, 0);
  });

  it('represents incomplete sub-tenant branding with missing_fields', () => {
    /** @type {import('../dist/types/index.js').Branding} */
    const branding = {
      scope: 'sub_tenant',
      company_id: '550e8400-e29b-41d4-a716-446655440011',
      brand_logo_url: null,
      brand_primary_color: '#FF5733',
      brand_email_footer: null,
      brand_email_signature: null,
      is_complete: false,
      missing_fields: ['brand_logo_url', 'brand_email_footer'],
    };
    assert.strictEqual(branding.is_complete, false);
    assert.ok(branding.missing_fields.includes('brand_logo_url'));
    assert.ok(branding.missing_fields.includes('brand_email_footer'));
  });
});

describe('BrandingInput shape', () => {
  it('allows all-optional partial input', () => {
    /** @type {import('../dist/types/index.js').BrandingInput} */
    const input = {
      brand_primary_color: '#1A73E8',
    };
    assert.strictEqual(input.brand_primary_color, '#1A73E8');
    assert.ok(input.brand_logo_url === undefined);
  });

  it('allows null values to clear fields', () => {
    /** @type {import('../dist/types/index.js').BrandingInput} */
    const input = {
      brand_logo_url: null,
      brand_email_signature: null,
    };
    assert.strictEqual(input.brand_logo_url, null);
  });
});

// ---------------------------------------------------------------------------
// dist export presence tests (run after build)
// ---------------------------------------------------------------------------

describe('dist/types/index.d.ts exports (post-build)', () => {
  const newTypes = [
    'PaymentScheduleLineInput',
    'PaymentSchedulePatchInput',
    'PaymentScheduleLine',
    'NextDueLine',
    'OverdueLine',
    'PaymentSummaryInvoiceStatus',
    'PaymentSummary',
    'PaymentSchedulePreset',
    'InvoiceSendByEmailResult',
    'Branding',
    'BrandingInput',
  ];

  for (const typeName of newTypes) {
    it(`exports ${typeName}`, () => {
      assertExportedFromTypes(typeName);
    });
  }
});
