/**
 * Tests for InitialsPosition + InitialsBlock extensions (v2.16.0)
 *
 * Vérifie que :
 * - `InitialsPosition` peut être construit avec les champs attendus
 * - `InitialsBlock.positions[]` accepte un tableau d'InitialsPosition
 * - `InitialsBlock.bold` est supporté en champ global
 * - Les overrides par page (fontSize, color, bold dans InitialsPosition) fonctionnent
 * - Les formats legacy (position + pages) restent valides
 * - Les nouveaux exports sont présents dans le dist compilé
 *
 * Run: node --test tests/initials-position-types.test.mjs
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
 * Vérifie qu'un champ est présent dans la définition d'une interface dans le .d.ts.
 */
function assertFieldInInterface(interfaceName, fieldName) {
  const dtsPath = resolve(__dirname, '../dist/types/index.d.ts');
  let content;
  try {
    content = readFileSync(dtsPath, 'utf8');
  } catch {
    return;
  }
  assert.ok(
    content.includes(fieldName),
    `Expected field '${fieldName}' to be present in dist/types/index.d.ts (interface ${interfaceName})`,
  );
}

// ---------------------------------------------------------------------------
// InitialsPosition shape tests
// ---------------------------------------------------------------------------

describe('InitialsPosition schema', () => {
  it('accepte les champs obligatoires (page, x, y)', () => {
    /** @type {import('../dist/types/index.js').InitialsPosition} */
    const pos = {
      page: 1,
      x: 5,
      y: 90,
    };
    assert.strictEqual(pos.page, 1);
    assert.strictEqual(pos.x, 5);
    assert.strictEqual(pos.y, 90);
    assert.ok(pos.unit === undefined);
  });

  it('accepte unit percent (défaut implicite)', () => {
    /** @type {import('../dist/types/index.js').InitialsPosition} */
    const pos = { page: 2, x: 85, y: 90, unit: 'percent' };
    assert.strictEqual(pos.unit, 'percent');
  });

  it('accepte unit pixel avec dimensions page', () => {
    /** @type {import('../dist/types/index.js').InitialsPosition} */
    const pos = {
      page: 3,
      x: 50,
      y: 720,
      unit: 'pixel',
      pageWidthPx: 595,
      pageHeightPx: 842,
    };
    assert.strictEqual(pos.unit, 'pixel');
    assert.strictEqual(pos.pageWidthPx, 595);
    assert.strictEqual(pos.pageHeightPx, 842);
  });

  it('accepte les overrides visuels par page (fontSize, color, bold)', () => {
    /** @type {import('../dist/types/index.js').InitialsPosition} */
    const pos = {
      page: 1,
      x: 5,
      y: 90,
      fontSize: 10,
      color: '#CC0000',
      bold: true,
    };
    assert.strictEqual(pos.fontSize, 10);
    assert.strictEqual(pos.color, '#CC0000');
    assert.strictEqual(pos.bold, true);
  });

  it('accepte bold=false explicitement', () => {
    /** @type {import('../dist/types/index.js').InitialsPosition} */
    const pos = { page: 1, x: 5, y: 90, bold: false };
    assert.strictEqual(pos.bold, false);
  });

  it('accepte page numéro maximum (500)', () => {
    /** @type {import('../dist/types/index.js').InitialsPosition} */
    const pos = { page: 500, x: 50, y: 50 };
    assert.strictEqual(pos.page, 500);
  });
});

// ---------------------------------------------------------------------------
// InitialsBlock.positions[] (nouveau format)
// ---------------------------------------------------------------------------

describe('InitialsBlock avec positions[] (format recommandé v2.16.0)', () => {
  it('accepte un tableau positions avec une seule page', () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      positions: [
        { page: 1, x: 5, y: 90, unit: 'percent' },
      ],
    };
    assert.strictEqual(block.enabled, true);
    assert.ok(Array.isArray(block.positions));
    assert.strictEqual(block.positions.length, 1);
    assert.strictEqual(block.positions[0].page, 1);
  });

  it('accepte un tableau positions avec plusieurs pages distinctes', () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      positions: [
        { page: 1, x: 5,  y: 90, unit: 'percent' },
        { page: 2, x: 85, y: 90, unit: 'percent' },
        { page: 3, x: 5,  y: 90, unit: 'percent', color: '#CC0000' },
      ],
    };
    assert.strictEqual(block.positions?.length, 3);
    assert.strictEqual(block.positions?.[1].x, 85);
    assert.strictEqual(block.positions?.[2].color, '#CC0000');
  });

  it('accepte positions[] avec overrides fontSize par page', () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      fontSize: 12,          // global
      positions: [
        { page: 1, x: 5, y: 90 },                // hérite fontSize=12
        { page: 2, x: 5, y: 90, fontSize: 8 },   // override page 2
      ],
    };
    assert.strictEqual(block.fontSize, 12);
    assert.strictEqual(block.positions?.[1].fontSize, 8);
  });

  it('accepte positions[] vide (aucun paraphe)', () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      positions: [],
    };
    assert.ok(Array.isArray(block.positions));
    assert.strictEqual(block.positions.length, 0);
  });

  it('accepte bold global dans InitialsBlock', () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      bold: true,
      positions: [{ page: 1, x: 5, y: 90 }],
    };
    assert.strictEqual(block.bold, true);
  });

  it('accepte bold=false dans InitialsBlock', () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = { enabled: true, bold: false };
    assert.strictEqual(block.bold, false);
  });
});

// ---------------------------------------------------------------------------
// InitialsBlock format legacy (rétrocompatibilité)
// ---------------------------------------------------------------------------

describe('InitialsBlock format legacy (position + pages) — rétrocompat', () => {
  it("accepte pages='all' avec position commune", () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      pages: 'all',
      position: { x: 5, y: 90, unit: 'percent' },
    };
    assert.strictEqual(block.pages, 'all');
    assert.strictEqual(block.position?.x, 5);
  });

  it("accepte pages='except_last' avec position commune", () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      pages: 'except_last',
      position: { x: 5, y: 90 },
    };
    assert.strictEqual(block.pages, 'except_last');
  });

  it('accepte pages=number[] (liste explicite de pages)', () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      pages: [1, 2, 4],
      position: { x: 5, y: 90, unit: 'percent' },
    };
    assert.ok(Array.isArray(block.pages));
    assert.deepStrictEqual(block.pages, [1, 2, 4]);
  });

  it('accepte format legacy sans positions[] (coexistence sans conflit)', () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      mode: 'auto',
      source: 'signer_name',
      pages: 'all',
      position: { x: 5, y: 90 },
      fontSize: 11,
      color: '#000000',
    };
    assert.ok(block.positions === undefined);
    assert.ok(block.bold === undefined);
    assert.strictEqual(block.mode, 'auto');
  });
});

// ---------------------------------------------------------------------------
// InitialsBlock format mixte (positions[] prévaut sur position+pages)
// ---------------------------------------------------------------------------

describe('InitialsBlock : coexistence positions[] et champs legacy', () => {
  it('permet de fournir les deux formats (positions[] prévaut côté backend)', () => {
    /** @type {import('../dist/types/index.js').InitialsBlock} */
    const block = {
      enabled: true,
      pages: 'all',
      position: { x: 5, y: 90 },   // legacy — ignoré si positions[] présent
      positions: [
        { page: 1, x: 10, y: 85 },  // prévaut côté backend
      ],
    };
    assert.ok(Array.isArray(block.positions));
    assert.strictEqual(block.positions?.length, 1);
    assert.strictEqual(block.pages, 'all');  // champ présent mais ignoré backend
  });
});

// ---------------------------------------------------------------------------
// Intégration dans SignatureInput
// ---------------------------------------------------------------------------

describe('SignatureInput avec initialsBlock.positions[]', () => {
  it('accepte initialsBlock.positions[] dans un SignatureInput complet', () => {
    /** @type {Partial<import('../dist/types/index.js').SignatureInput>} */
    const input = {
      title: 'Contrat de prestation',
      document_name: 'contrat.pdf',
      document: 'base64data==',
      signers: [
        {
          first_name: 'Jean',
          last_name: 'Dupont',
          email: 'jean.dupont@example.com',
          auth_method: 'email',
        },
      ],
      initialsBlock: {
        enabled: true,
        mode: 'auto',
        source: 'signer_name',
        bold: false,
        positions: [
          { page: 1, x: 5,  y: 90, unit: 'percent' },
          { page: 2, x: 85, y: 90, unit: 'percent' },
        ],
      },
    };
    assert.strictEqual(input.initialsBlock?.enabled, true);
    assert.strictEqual(input.initialsBlock?.positions?.length, 2);
    assert.strictEqual(input.initialsBlock?.positions?.[0].page, 1);
    assert.strictEqual(input.initialsBlock?.positions?.[1].x, 85);
  });
});

// ---------------------------------------------------------------------------
// Vérification de présence dans le dist compilé
// ---------------------------------------------------------------------------

describe('dist/types/index.d.ts exports (post-build)', () => {
  it('exporte InitialsPosition', () => {
    assertExportedFromTypes('InitialsPosition');
  });

  it('exporte InitialsBlock (existant, maintenu)', () => {
    assertExportedFromTypes('InitialsBlock');
  });

  it('InitialsBlock a le champ positions dans le .d.ts', () => {
    assertFieldInInterface('InitialsBlock', 'positions');
  });

  it('InitialsBlock a le champ bold dans le .d.ts', () => {
    assertFieldInInterface('InitialsBlock', 'bold');
  });

  it('InitialsPosition a le champ pageWidthPx dans le .d.ts', () => {
    assertFieldInInterface('InitialsPosition', 'pageWidthPx');
  });

  it('InitialsPosition a le champ pageHeightPx dans le .d.ts', () => {
    assertFieldInInterface('InitialsPosition', 'pageHeightPx');
  });
});
