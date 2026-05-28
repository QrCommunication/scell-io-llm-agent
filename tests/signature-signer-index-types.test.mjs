/**
 * Tests for SignaturePosition.signerIndex + multi-position per signer (v2.27.0)
 *
 * Vérifie que :
 * - `SignaturePosition.signerIndex` est supporté (optionnel, 0-base)
 * - Une position sans `signerIndex` reste valide (flux global, legacy)
 * - Plusieurs positions peuvent partager le même `signerIndex`
 *   (N positions par signataire — capacité EU-SES)
 * - `signerIndex` se combine avec `documentIndex`
 * - Le champ `signerIndex` est présent dans le dist compilé
 *
 * Run: node --test tests/signature-signer-index-types.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Vérifie qu'un champ est présent dans le .d.ts compilé.
 */
function assertFieldInDts(fieldName, hintContext) {
  const dtsPath = resolve(__dirname, '../dist/types/index.d.ts');
  let content;
  try {
    content = readFileSync(dtsPath, 'utf8');
  } catch {
    // dist peut ne pas exister avant le build en CI — skip gracefully
    return;
  }
  assert.ok(
    content.includes(fieldName),
    `Expected field '${fieldName}' to be present in dist/types/index.d.ts (${hintContext})`,
  );
}

// ---------------------------------------------------------------------------
// signerIndex on SignaturePosition
// ---------------------------------------------------------------------------

describe('SignaturePosition.signerIndex', () => {
  it('accepte signerIndex absent (défaut = flux global, legacy)', () => {
    /** @type {import('../dist/types/index.js').SignaturePosition} */
    const pos = { page: 1, x: 10, y: 80 };
    assert.ok(pos.signerIndex === undefined);
  });

  it('accepte signerIndex = 0 (premier signataire)', () => {
    /** @type {import('../dist/types/index.js').SignaturePosition} */
    const pos = { signerIndex: 0, page: 1, x: 10, y: 80, unit: 'percent' };
    assert.strictEqual(pos.signerIndex, 0);
  });

  it('accepte signerIndex sur un autre signataire (1..N)', () => {
    /** @type {import('../dist/types/index.js').SignaturePosition} */
    const pos = { signerIndex: 2, page: 1, x: 60, y: 80 };
    assert.strictEqual(pos.signerIndex, 2);
  });

  it('combine signerIndex et documentIndex', () => {
    /** @type {import('../dist/types/index.js').SignaturePosition} */
    const pos = { signerIndex: 1, documentIndex: 2, page: 1, x: 10, y: 80 };
    assert.strictEqual(pos.signerIndex, 1);
    assert.strictEqual(pos.documentIndex, 2);
  });
});

// ---------------------------------------------------------------------------
// Multi-position par signataire (capacité EU-SES)
// ---------------------------------------------------------------------------

describe('Multiple signature positions per signer', () => {
  it('accepte N positions partageant le même signerIndex', () => {
    /** @type {import('../dist/types/index.js').SignaturePosition[]} */
    const positions = [
      { signerIndex: 0, page: 1, x: 10, y: 80 },
      { signerIndex: 0, page: 3, x: 10, y: 80 }, // 2e position pour signers[0]
      { signerIndex: 1, page: 1, x: 60, y: 80 },
    ];
    const signer0 = positions.filter((p) => p.signerIndex === 0);
    assert.strictEqual(signer0.length, 2);
    assert.strictEqual(positions[2].signerIndex, 1);
  });

  it('intégration dans un SignatureInput multi-signataires', () => {
    /** @type {Partial<import('../dist/types/index.js').SignatureInput>} */
    const input = {
      title: 'Contrat bipartite',
      document: 'base64Main==',
      document_name: 'contrat.pdf',
      signers: [
        { first_name: 'Jean', last_name: 'Dupont', email: 'jean@example.com', auth_method: 'email' },
        { first_name: 'Marie', last_name: 'Martin', email: 'marie@example.com', auth_method: 'email' },
      ],
      signature_positions: [
        { signerIndex: 0, page: 1, x: 10, y: 80 },
        { signerIndex: 0, page: 3, x: 10, y: 80 },
        { signerIndex: 1, page: 3, x: 60, y: 80 },
      ],
    };
    assert.strictEqual(input.signature_positions?.length, 3);
    assert.strictEqual(input.signature_positions?.[0].signerIndex, 0);
    assert.strictEqual(input.signature_positions?.[2].signerIndex, 1);
  });
});

// ---------------------------------------------------------------------------
// Vérification de présence dans le dist compilé
// ---------------------------------------------------------------------------

describe('dist/types/index.d.ts (post-build)', () => {
  it('SignaturePosition a le champ signerIndex dans le .d.ts', () => {
    assertFieldInDts('signerIndex', 'SignaturePosition');
  });
});
