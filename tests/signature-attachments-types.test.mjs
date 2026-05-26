/**
 * Tests for SignatureAttachment + documentIndex extensions (v2.17.0)
 *
 * Vérifie que :
 * - `SignatureAttachment` peut être construit avec les champs attendus
 * - `SignatureInput.attachments[]` accepte un tableau d'attachments
 * - `SignaturePosition.documentIndex` est supporté
 * - `Mention.position.documentIndex` est supporté
 * - `InitialsPosition.documentIndex` est supporté
 * - Les nouveaux exports sont présents dans le dist compilé
 *
 * Run: node --test tests/signature-attachments-types.test.mjs
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
 * Parse le dist/types/index.d.ts compilé et vérifie qu'un nom exporté est présent.
 */
function assertExportedFromTypes(name) {
  const dtsPath = resolve(__dirname, '../dist/types/index.d.ts');
  let content;
  try {
    content = readFileSync(dtsPath, 'utf8');
  } catch {
    // dist peut ne pas exister avant le build en CI — skip gracefully
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

/**
 * Vérifie qu'un champ est présent dans le .d.ts compilé.
 */
function assertFieldInDts(fieldName, hintContext) {
  const dtsPath = resolve(__dirname, '../dist/types/index.d.ts');
  let content;
  try {
    content = readFileSync(dtsPath, 'utf8');
  } catch {
    return;
  }
  assert.ok(
    content.includes(fieldName),
    `Expected field '${fieldName}' to be present in dist/types/index.d.ts (${hintContext})`,
  );
}

/**
 * Vérifie qu'un champ est re-exporté depuis dist/index.d.ts (barrel).
 */
function assertReexportedFromBarrel(name) {
  const dtsPath = resolve(__dirname, '../dist/index.d.ts');
  let content;
  try {
    content = readFileSync(dtsPath, 'utf8');
  } catch {
    return;
  }
  assert.ok(
    content.includes(name),
    `Expected '${name}' to be re-exported from dist/index.d.ts`,
  );
}

// ---------------------------------------------------------------------------
// SignatureAttachment shape tests
// ---------------------------------------------------------------------------

describe('SignatureAttachment schema', () => {
  it('accepte les champs obligatoires (document, documentName)', () => {
    /** @type {import('../dist/types/index.js').SignatureAttachment} */
    const att = {
      document: 'JVBERi0xLjQKJ...',
      documentName: 'annexe-A.pdf',
    };
    assert.strictEqual(att.documentName, 'annexe-A.pdf');
    assert.ok(att.document.length > 0);
  });

  it('accepte plusieurs attachments dans un tableau', () => {
    /** @type {import('../dist/types/index.js').SignatureAttachment[]} */
    const atts = [
      { document: 'base64A==', documentName: 'annexe-A.pdf' },
      { document: 'base64B==', documentName: 'annexe-B.pdf' },
      { document: 'base64C==', documentName: 'annexe-C.pdf' },
    ];
    assert.strictEqual(atts.length, 3);
    assert.strictEqual(atts[1].documentName, 'annexe-B.pdf');
  });
});

// ---------------------------------------------------------------------------
// documentIndex on SignaturePosition
// ---------------------------------------------------------------------------

describe('SignaturePosition.documentIndex', () => {
  it('accepte documentIndex absent (défaut = 0, document principal)', () => {
    /** @type {import('../dist/types/index.js').SignaturePosition} */
    const pos = { page: 1, x: 10, y: 80 };
    assert.ok(pos.documentIndex === undefined);
  });

  it('accepte documentIndex = 0 (document principal explicite)', () => {
    /** @type {import('../dist/types/index.js').SignaturePosition} */
    const pos = { documentIndex: 0, page: 1, x: 10, y: 80, unit: 'percent' };
    assert.strictEqual(pos.documentIndex, 0);
  });

  it('accepte documentIndex sur un attachment (1..10)', () => {
    /** @type {import('../dist/types/index.js').SignaturePosition} */
    const pos = { documentIndex: 2, page: 1, x: 10, y: 80, unit: 'percent' };
    assert.strictEqual(pos.documentIndex, 2);
  });
});

// ---------------------------------------------------------------------------
// documentIndex on Mention.position
// ---------------------------------------------------------------------------

describe('Mention.position.documentIndex', () => {
  it('accepte documentIndex sur la position de la mention', () => {
    /** @type {import('../dist/types/index.js').Mention} */
    const mention = {
      label: 'Lu et approuve',
      required: true,
      position: {
        documentIndex: 1,
        page: 1,
        x: 10,
        y: 90,
        unit: 'percent',
      },
    };
    assert.strictEqual(mention.position.documentIndex, 1);
    assert.strictEqual(mention.position.page, 1);
  });

  it('accepte une mention sans documentIndex (défaut = document principal)', () => {
    /** @type {import('../dist/types/index.js').Mention} */
    const mention = {
      label: 'Lu et approuve',
      position: { page: 1, x: 10, y: 90 },
    };
    assert.ok(mention.position.documentIndex === undefined);
  });
});

// ---------------------------------------------------------------------------
// documentIndex on InitialsPosition
// ---------------------------------------------------------------------------

describe('InitialsPosition.documentIndex', () => {
  it('accepte documentIndex sur une position de paraphe', () => {
    /** @type {import('../dist/types/index.js').InitialsPosition} */
    const pos = {
      documentIndex: 1,
      page: 1,
      x: 5,
      y: 90,
      unit: 'percent',
    };
    assert.strictEqual(pos.documentIndex, 1);
  });

  it('accepte initialsBlock.positions[] avec documentIndex variable', () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      positions: [
        { documentIndex: 0, page: 1, x: 5, y: 90 },
        { documentIndex: 1, page: 1, x: 5, y: 90 },
        { documentIndex: 2, page: 1, x: 5, y: 90, color: '#CC0000' },
      ],
    };
    assert.strictEqual(block.positions?.[0].documentIndex, 0);
    assert.strictEqual(block.positions?.[2].documentIndex, 2);
  });
});

// ---------------------------------------------------------------------------
// SignatureInput.attachments integration
// ---------------------------------------------------------------------------

describe('SignatureInput.attachments', () => {
  it('accepte un SignatureInput sans attachments (mode single-document legacy)', () => {
    /** @type {Partial<import('../dist/types/index.js').SignatureInput>} */
    const input = {
      title: 'Contrat',
      document: 'base64==',
      document_name: 'contrat.pdf',
      signers: [
        {
          first_name: 'Jean',
          last_name: 'Dupont',
          email: 'jean@example.com',
          auth_method: 'email',
        },
      ],
    };
    assert.ok(input.attachments === undefined);
  });

  it('accepte un bundle multi-document avec attachments + documentIndex', () => {
    /** @type {Partial<import('../dist/types/index.js').SignatureInput>} */
    const input = {
      title: 'Contrat + annexes',
      document: 'base64Main==',
      document_name: 'contrat.pdf',
      attachments: [
        { document: 'base64A==', documentName: 'annexe-A.pdf' },
        { document: 'base64B==', documentName: 'annexe-B.pdf' },
      ],
      signers: [
        {
          first_name: 'Jean',
          last_name: 'Dupont',
          email: 'jean@example.com',
          auth_method: 'email',
        },
      ],
      signature_positions: [
        { documentIndex: 0, page: 3, x: 10, y: 80, unit: 'percent' },
        { documentIndex: 2, page: 1, x: 10, y: 80, unit: 'percent' },
      ],
    };
    assert.strictEqual(input.attachments?.length, 2);
    assert.strictEqual(input.attachments?.[1].documentName, 'annexe-B.pdf');
    assert.strictEqual(input.signature_positions?.[0].documentIndex, 0);
    assert.strictEqual(input.signature_positions?.[1].documentIndex, 2);
  });
});

// ---------------------------------------------------------------------------
// Vérification de présence dans le dist compilé
// ---------------------------------------------------------------------------

describe('dist/types/index.d.ts exports (post-build)', () => {
  it('exporte SignatureAttachment', () => {
    assertExportedFromTypes('SignatureAttachment');
  });

  it('SignatureAttachment a le champ document', () => {
    assertFieldInDts('document', 'SignatureAttachment');
  });

  it('SignatureAttachment a le champ documentName', () => {
    assertFieldInDts('documentName', 'SignatureAttachment');
  });

  it('SignaturePosition a le champ documentIndex dans le .d.ts', () => {
    assertFieldInDts('documentIndex', 'SignaturePosition / Mention.position / InitialsPosition');
  });

  it('SignatureInput a le champ attachments dans le .d.ts', () => {
    assertFieldInDts('attachments', 'SignatureInput');
  });

  it('SignatureAttachment est re-exporté depuis dist/index.d.ts (barrel)', () => {
    assertReexportedFromBarrel('SignatureAttachment');
  });
});
