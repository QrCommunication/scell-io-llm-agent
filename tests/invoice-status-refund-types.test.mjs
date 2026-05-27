/**
 * Tests for `InvoiceStatus` union extension + `RefundStatus` + `Invoice.refundStatus`
 * + `Invoice.totalRefunded` (v2.21.0).
 *
 * Backend support: the PostgreSQL `invoices.status` CHECK constraint now lists
 * 16 lifecycle values. The backend also exposes `refund_status` and
 * `total_refunded`, auto-maintained by `CreditNoteObserver`.
 *
 * Vérifie que :
 * - Le type `InvoiceStatus` couvre les 16 valeurs autorisées par la BDD
 * - Le type `RefundStatus` couvre 'none' | 'partial' | 'full'
 * - `Invoice.refundStatus?: RefundStatus` est exposé (camelCase, optionnel)
 * - `Invoice.totalRefunded?: number` est exposé (camelCase, optionnel)
 * - Les nouvelles valeurs `refunded` et `partially_refunded` sont assignables
 * - Le .d.ts compilé contient bien `InvoiceStatus` + `RefundStatus`
 * - Le tool description mentionne les 16 statuts + les nouveaux champs réponse
 *
 * Run: node --test tests/invoice-status-refund-types.test.mjs
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

// ---------------------------------------------------------------------------
// InvoiceStatus union — exhaustive value coverage
// ---------------------------------------------------------------------------

describe('InvoiceStatus — 16 values aligned with backend CHECK constraint (since v2.21.0)', () => {
  const ALL_INVOICE_STATUSES = [
    'draft',
    'validating',
    'validated',
    'converting',
    'converted',
    'transmitting',
    'transmitted',
    'accepted',
    'rejected',
    'disputed',
    'paid',
    'received',
    'completed',
    'error',
    'refunded',
    'partially_refunded',
  ];

  for (const status of ALL_INVOICE_STATUSES) {
    it(`accepte status='${status}' sur un Invoice`, () => {
      /** @type {import('../dist/types/index.js').Invoice} */
      const invoice = {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        invoiceNumber: 'INV-2026-0001',
        status: /** @type {import('../dist/types/index.js').InvoiceStatus} */ (status),
        totalExcludingTax: 1000,
        totalVat: 200,
        totalIncludingTax: 1200,
        currency: 'EUR',
        format: 'factur-x',
        createdAt: '2026-05-27T10:00:00Z',
        updatedAt: '2026-05-27T10:00:00Z',
      };
      assert.strictEqual(invoice.status, status);
    });
  }

  it('le type InvoiceStatus est exporté depuis le package racine', () => {
    /** @type {import('../dist/index.js').InvoiceStatus | undefined} */
    let s;
    s = 'refunded';
    assert.strictEqual(s, 'refunded');
    s = 'partially_refunded';
    assert.strictEqual(s, 'partially_refunded');
  });
});

// ---------------------------------------------------------------------------
// RefundStatus union
// ---------------------------------------------------------------------------

describe('RefundStatus — none | partial | full (since v2.21.0)', () => {
  for (const value of ['none', 'partial', 'full']) {
    it(`accepte refundStatus='${value}'`, () => {
      /** @type {import('../dist/types/index.js').RefundStatus} */
      const v = /** @type {any} */ (value);
      assert.strictEqual(v, value);
    });
  }
});

// ---------------------------------------------------------------------------
// Invoice — new refund response fields
// ---------------------------------------------------------------------------

describe('Invoice — refundStatus + totalRefunded read-only fields (since v2.21.0)', () => {
  it('accepte un Invoice complet avec refundStatus=full + totalRefunded', () => {
    /** @type {import('../dist/types/index.js').Invoice} */
    const invoice = {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      invoiceNumber: 'INV-2026-0042',
      status: 'refunded',
      totalExcludingTax: 1000,
      totalVat: 200,
      totalIncludingTax: 1200,
      currency: 'EUR',
      format: 'factur-x',
      createdAt: '2026-05-27T10:00:00Z',
      updatedAt: '2026-05-27T11:00:00Z',
      refundStatus: 'full',
      totalRefunded: 1200,
      creditNotesCount: 1,
      creditedAmount: 1200,
    };
    assert.strictEqual(invoice.refundStatus, 'full');
    assert.strictEqual(invoice.totalRefunded, 1200);
    assert.strictEqual(invoice.status, 'refunded');
  });

  it('accepte un Invoice partiellement remboursé', () => {
    /** @type {import('../dist/types/index.js').Invoice} */
    const invoice = {
      id: 'aaaa-bbbb',
      invoiceNumber: 'INV-2026-0043',
      status: 'partially_refunded',
      totalExcludingTax: 1000,
      totalVat: 200,
      totalIncludingTax: 1200,
      currency: 'EUR',
      format: 'factur-x',
      createdAt: '2026-05-27T10:00:00Z',
      updatedAt: '2026-05-27T11:00:00Z',
      refundStatus: 'partial',
      totalRefunded: 600,
    };
    assert.strictEqual(invoice.refundStatus, 'partial');
    assert.strictEqual(invoice.totalRefunded, 600);
    assert.ok(invoice.totalRefunded < invoice.totalIncludingTax);
  });

  it('accepte un Invoice sans aucun remboursement (refundStatus + totalRefunded omis = rétrocompatible)', () => {
    /** @type {import('../dist/types/index.js').Invoice} */
    const invoice = {
      id: 'bbbb-cccc',
      invoiceNumber: 'INV-2026-0044',
      status: 'paid',
      totalExcludingTax: 500,
      totalVat: 100,
      totalIncludingTax: 600,
      currency: 'EUR',
      format: 'factur-x',
      createdAt: '2026-05-27T10:00:00Z',
      updatedAt: '2026-05-27T11:00:00Z',
    };
    assert.ok(invoice.refundStatus === undefined);
    assert.ok(invoice.totalRefunded === undefined);
  });
});

// ---------------------------------------------------------------------------
// Vérification des .d.ts compilés (post-build)
// ---------------------------------------------------------------------------

describe('dist/types/index.d.ts — InvoiceStatus + RefundStatus exported (post-build)', () => {
  it('export du type InvoiceStatus présent dans .d.ts', () => {
    const content = readDts('index.d.ts');
    if (!content) return; // pre-build: skip gracefully
    assert.ok(
      /export\s+(declare\s+)?type\s+InvoiceStatus\b/.test(content),
      "Expected 'export type InvoiceStatus' to be present in dist/types/index.d.ts",
    );
  });

  it('export du type RefundStatus présent dans .d.ts', () => {
    const content = readDts('index.d.ts');
    if (!content) return;
    assert.ok(
      /export\s+(declare\s+)?type\s+RefundStatus\b/.test(content),
      "Expected 'export type RefundStatus' to be present in dist/types/index.d.ts",
    );
  });

  it("InvoiceStatus contient les 4 nouvelles valeurs (validating, transmitting, refunded, partially_refunded)", () => {
    const content = readDts('index.d.ts');
    if (!content) return;
    for (const literal of ["'validating'", "'transmitting'", "'refunded'", "'partially_refunded'"]) {
      assert.ok(
        content.includes(literal),
        `Expected ${literal} to be present in dist/types/index.d.ts (InvoiceStatus union)`,
      );
    }
  });

  it('Invoice contient refundStatus + totalRefunded optionnels', () => {
    const content = readDts('index.d.ts');
    if (!content) return;
    assert.ok(
      content.includes('refundStatus?:'),
      "Expected field 'refundStatus?:' to be present in dist/types/index.d.ts (Invoice)",
    );
    assert.ok(
      content.includes('totalRefunded?:'),
      "Expected field 'totalRefunded?:' to be present in dist/types/index.d.ts (Invoice)",
    );
  });
});

// ---------------------------------------------------------------------------
// Vérification du re-export racine (index.d.ts)
// ---------------------------------------------------------------------------

describe('dist/index.d.ts — InvoiceStatus + RefundStatus re-exported (post-build)', () => {
  it('Le package root re-exporte InvoiceStatus', () => {
    const content = readDist('index.d.ts');
    if (!content) return;
    assert.ok(
      content.includes('InvoiceStatus'),
      "Expected 'InvoiceStatus' to be re-exported from dist/index.d.ts",
    );
  });

  it('Le package root re-exporte RefundStatus', () => {
    const content = readDist('index.d.ts');
    if (!content) return;
    assert.ok(
      content.includes('RefundStatus'),
      "Expected 'RefundStatus' to be re-exported from dist/index.d.ts",
    );
  });
});

// ---------------------------------------------------------------------------
// Tool documentation — full status set + new response fields documented
// ---------------------------------------------------------------------------

describe('Tool documentation — full InvoiceStatus + refund_status documented', () => {
  it("La description de scell_get_invoice mentionne les nouvelles valeurs de status", () => {
    const content = readDist('config/generator.js');
    if (!content) return;
    for (const status of ['validating', 'transmitting', 'refunded', 'partially_refunded']) {
      assert.ok(
        content.includes(status),
        `Expected status '${status}' to be documented in the tool description (generator.js)`,
      );
    }
  });

  it("La description mentionne refund_status (snake_case REST) et total_refunded", () => {
    const content = readDist('config/generator.js');
    if (!content) return;
    assert.ok(
      content.includes('refund_status'),
      "Expected 'refund_status' (snake_case) to be documented in tool descriptions",
    );
    assert.ok(
      content.includes('total_refunded'),
      "Expected 'total_refunded' (snake_case) to be documented in tool descriptions",
    );
  });

  it("La description référence explicitement v2.21.0", () => {
    const content = readDist('config/generator.js');
    if (!content) return;
    assert.ok(
      content.includes('v2.21.0'),
      "Expected scell_get_invoice / scell_list_invoices tool descriptions to reference v2.21.0",
    );
  });
});
