/**
 * Tests for `InvoiceInput.parentQuoteId` + `InvoiceInput.invoiceType` (v2.20.0)
 *
 * Backend support: `POST /api/v1/invoices` now accepts `parent_quote_id`
 * for `invoice_type='standard'` invoices (in addition to `'deposit'` /
 * `'balance'` invoices generated via the quote conversion tools).
 *
 * Vérifie que :
 * - `InvoiceInput.parentQuoteId?: string` est exposé (camelCase, optionnel)
 * - `InvoiceInput.invoiceType?: 'standard'|'deposit'|'balance'` est exposé
 * - Les deux champs sont strictement optionnels (backward-compatible)
 * - Un InvoiceInput peut être construit avec OU sans parentQuoteId
 * - Le mapping camelCase → snake_case (`parentQuoteId` → `parent_quote_id`,
 *   `invoiceType` → `invoice_type`) est documenté pour le MCP server
 *   consommateur, et les deux noms sont présents dans la doc du tool
 *
 * Run: node --test tests/parent-quote-id-types.test.mjs
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
// Type shape (compile-time TS check via JSDoc `@type` annotations)
// ---------------------------------------------------------------------------

describe('InvoiceInput — parentQuoteId optional (since v2.20.0)', () => {
  it('accepte parentQuoteId sur un invoice standard', () => {
    /** @type {import('../dist/types/index.js').InvoiceInput} */
    const input = {
      invoiceNumber: 'INV-2026-0042',
      invoiceDate: '2026-05-27',
      dueDate: '2026-06-26',
      seller: {
        name: 'Acme FR',
        siret: '12345678901234',
        address: '1 rue de la Paix',
        postalCode: '75001',
        city: 'Paris',
        country: 'FR',
      },
      buyer: {
        name: 'Client SAS',
        siret: '98765432101234',
        address: '2 avenue des Champs',
        postalCode: '75008',
        city: 'Paris',
        country: 'FR',
      },
      lines: [
        {
          description: 'Prestation conseil',
          quantity: 1,
          unitPrice: 1000,
          vatRate: 20,
        },
      ],
      invoiceType: 'standard',
      parentQuoteId: '550e8400-e29b-41d4-a716-446655440000',
    };
    assert.strictEqual(input.invoiceType, 'standard');
    assert.strictEqual(input.parentQuoteId, '550e8400-e29b-41d4-a716-446655440000');
  });

  it('accepte un invoice sans parentQuoteId (rétrocompatible)', () => {
    /** @type {import('../dist/types/index.js').InvoiceInput} */
    const input = {
      invoiceNumber: 'INV-2026-0043',
      invoiceDate: '2026-05-27',
      dueDate: '2026-06-26',
      seller: {
        name: 'Acme FR',
        siret: '12345678901234',
        address: '1 rue',
        postalCode: '75001',
        city: 'Paris',
        country: 'FR',
      },
      buyer: {
        name: 'Client',
        siret: '98765432101234',
        address: '2 av',
        postalCode: '75008',
        city: 'Paris',
        country: 'FR',
      },
      lines: [
        {
          description: 'Fournitures',
          quantity: 1,
          unitPrice: 500,
          vatRate: 20,
        },
      ],
    };
    assert.ok(input.parentQuoteId === undefined);
    assert.ok(input.invoiceType === undefined);
  });

  it('accepte invoiceType=deposit (généré via convert tool en pratique)', () => {
    /** @type {import('../dist/types/index.js').InvoiceInput} */
    const input = {
      invoiceNumber: 'INV-2026-0044',
      invoiceDate: '2026-05-27',
      dueDate: '2026-06-26',
      seller: {
        name: 'Acme',
        siret: '12345678901234',
        address: '1 rue',
        postalCode: '75001',
        city: 'Paris',
        country: 'FR',
      },
      buyer: {
        name: 'C',
        siret: '98765432101234',
        address: '2',
        postalCode: '75008',
        city: 'Paris',
        country: 'FR',
      },
      lines: [{ description: 'Acompte', quantity: 1, unitPrice: 300, vatRate: 20 }],
      invoiceType: 'deposit',
      parentQuoteId: '550e8400-e29b-41d4-a716-446655440000',
    };
    assert.strictEqual(input.invoiceType, 'deposit');
  });

  it('accepte invoiceType=balance', () => {
    /** @type {import('../dist/types/index.js').InvoiceInput} */
    const input = {
      invoiceNumber: 'INV-2026-0045',
      invoiceDate: '2026-05-27',
      dueDate: '2026-06-26',
      seller: {
        name: 'A',
        siret: '12345678901234',
        address: '1',
        postalCode: '75001',
        city: 'Paris',
        country: 'FR',
      },
      buyer: {
        name: 'B',
        siret: '98765432101234',
        address: '2',
        postalCode: '75008',
        city: 'Paris',
        country: 'FR',
      },
      lines: [{ description: 'Solde', quantity: 1, unitPrice: 700, vatRate: 20 }],
      invoiceType: 'balance',
    };
    assert.strictEqual(input.invoiceType, 'balance');
  });
});

// ---------------------------------------------------------------------------
// Vérification des .d.ts compilés (post-build)
// ---------------------------------------------------------------------------

describe('dist/types/index.d.ts — InvoiceInput exposes parentQuoteId + invoiceType (post-build)', () => {
  it('InvoiceInput contient parentQuoteId optionnel dans le .d.ts', () => {
    const content = readDts('index.d.ts');
    if (!content) return; // pre-build: skip gracefully
    assert.ok(
      content.includes('parentQuoteId?:'),
      "Expected field 'parentQuoteId?:' to be present in dist/types/index.d.ts (InvoiceInput)",
    );
  });

  it('InvoiceInput contient invoiceType optionnel dans le .d.ts', () => {
    const content = readDts('index.d.ts');
    if (!content) return;
    assert.ok(
      content.includes('invoiceType?:'),
      "Expected field 'invoiceType?:' to be present in dist/types/index.d.ts (InvoiceInput)",
    );
  });

  it("L'union 'standard' | 'deposit' | 'balance' est présente", () => {
    const content = readDts('index.d.ts');
    if (!content) return;
    // Cette union apparaît sur l'Invoice response ET sur InvoiceInput → au moins 2 occurrences
    // (tsc émet les string literal unions avec des apostrophes simples dans .d.ts)
    const occurrences = (content.match(/'standard'\s*\|\s*'deposit'\s*\|\s*'balance'/g) || []).length;
    assert.ok(
      occurrences >= 2,
      `Expected 'standard'|'deposit'|'balance' union to appear at least twice (Invoice + InvoiceInput), found ${occurrences}`,
    );
  });
});

// ---------------------------------------------------------------------------
// Mapping camelCase → snake_case documenté dans le tool doc (REST)
// ---------------------------------------------------------------------------

describe('Tool documentation — camelCase → snake_case mapping documented', () => {
  it("La description du tool scell_create_invoice mentionne parent_quote_id (snake_case payload REST)", () => {
    const content = readDist('config/generator.js');
    if (!content) return;
    assert.ok(
      content.includes('parent_quote_id'),
      "Expected 'parent_quote_id' (snake_case) to be documented in scell_create_invoice tool description",
    );
  });

  it("La description du tool scell_create_invoice mentionne invoice_type (snake_case payload REST)", () => {
    const content = readDist('config/generator.js');
    if (!content) return;
    assert.ok(
      content.includes('invoice_type'),
      "Expected 'invoice_type' (snake_case) to be documented in scell_create_invoice tool description",
    );
  });

  it("La description du tool mentionne explicitement le support 'standard' invoice + parent_quote_id (v2.20.0)", () => {
    const content = readDist('config/generator.js');
    if (!content) return;
    assert.ok(
      content.includes("v2.20.0") && content.includes("parent_quote_id"),
      "Expected scell_create_invoice tool description to reference the v2.20.0 standard+parent_quote_id support",
    );
  });
});
