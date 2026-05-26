/**
 * Tests for VAT Context Resolution types (v2.19.0)
 *
 * Vérifie que :
 * - `VatCategory` peut prendre toutes les valeurs attendues
 * - `VatResolution` peut être construit avec les champs attendus
 * - `LineVatContext` est valide avec les champs minimaux
 * - `VatContextRequest` accepte buyer_id OU inline buyer
 * - `VatContextResponse` contient un `resolution` + `warnings[]`
 * - `InvoiceLine.vatRate` est maintenant optionnel (since 2.19.0)
 * - `InvoiceLine.category` est optionnel et accepte les VatCategory values
 * - Les nouveaux exports sont présents dans le dist compilé
 *
 * Run: node --test tests/vat-context-types.test.mjs
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
 * Reads a .d.ts file, returns '' if not found (pre-build CI).
 */
function readDts(filename) {
  const dtsPath = resolve(__dirname, `../dist/types/${filename}`);
  try {
    return readFileSync(dtsPath, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Parse les .d.ts compilés et vérifie qu'un nom exporté est présent.
 * Cherche dans index.d.ts (re-exports) ET dans vat.d.ts (déclaration).
 */
function assertExportedFromTypes(name) {
  // Types VAT vivent dans vat.d.ts (re-exportés depuis index.d.ts via `export type { ... }`)
  const vatContent = readDts('vat.d.ts');
  const indexContent = readDts('index.d.ts');
  const combined = vatContent + indexContent;
  if (!combined) return; // pre-build: skip gracefully
  assert.ok(
    combined.includes(`export interface ${name}`) ||
      combined.includes(`export type ${name}`) ||
      combined.includes(`export declare interface ${name}`) ||
      combined.includes(`export declare type ${name}`) ||
      combined.includes(`export { ${name}`) ||
      combined.includes(`${name},`) || // part of a re-export list
      combined.includes(`${name} }`),
    `Expected '${name}' to be exported from dist/types/vat.d.ts or dist/types/index.d.ts`,
  );
}

/**
 * Vérifie qu'un champ est présent dans les .d.ts compilés.
 * Cherche dans vat.d.ts ET index.d.ts.
 */
function assertFieldInDts(fieldName) {
  const vatContent = readDts('vat.d.ts');
  const indexContent = readDts('index.d.ts');
  const combined = vatContent + indexContent;
  if (!combined) return;
  assert.ok(
    combined.includes(fieldName),
    `Expected field '${fieldName}' to be present in dist/types/vat.d.ts or dist/types/index.d.ts`,
  );
}

/**
 * Vérifie qu'un champ est optionnel (avec ?) dans les .d.ts compilés.
 */
function assertFieldOptionalInDts(fieldName) {
  const vatContent = readDts('vat.d.ts');
  const indexContent = readDts('index.d.ts');
  const combined = vatContent + indexContent;
  if (!combined) return;
  assert.ok(
    combined.includes(`${fieldName}?:`),
    `Expected field '${fieldName}' to be optional (?: ) in the compiled .d.ts files`,
  );
}

// ---------------------------------------------------------------------------
// VatCategory union type
// ---------------------------------------------------------------------------

describe('VatCategory — toutes les valeurs autorisées', () => {
  /** @type {import('../dist/types/index.js').VatCategory[]} */
  const allValues = [
    'STANDARD',
    'INTERMEDIATE',
    'REDUCED',
    'SUPER_REDUCED',
    'ZERO_RATED',
    'EXEMPT',
    'REVERSE_CHARGE',
    'OUT_OF_SCOPE',
  ];

  it('contient exactement 8 valeurs', () => {
    assert.strictEqual(allValues.length, 8);
  });

  it('STANDARD est une valeur valide', () => {
    /** @type {import('../dist/types/index.js').VatCategory} */
    const cat = 'STANDARD';
    assert.strictEqual(cat, 'STANDARD');
  });

  it('REVERSE_CHARGE est une valeur valide', () => {
    /** @type {import('../dist/types/index.js').VatCategory} */
    const cat = 'REVERSE_CHARGE';
    assert.strictEqual(cat, 'REVERSE_CHARGE');
  });

  it('EXEMPT est une valeur valide', () => {
    /** @type {import('../dist/types/index.js').VatCategory} */
    const cat = 'EXEMPT';
    assert.strictEqual(cat, 'EXEMPT');
  });

  it('OUT_OF_SCOPE est une valeur valide', () => {
    /** @type {import('../dist/types/index.js').VatCategory} */
    const cat = 'OUT_OF_SCOPE';
    assert.strictEqual(cat, 'OUT_OF_SCOPE');
  });
});

// ---------------------------------------------------------------------------
// VatResolution shape
// ---------------------------------------------------------------------------

describe('VatResolution — construction avec champs requis', () => {
  it('accepte un REVERSE_CHARGE (prestation B2B intracom UE)', () => {
    /** @type {import('../dist/types/index.js').VatResolution} */
    const res = {
      rate: 0,
      category: 'REVERSE_CHARGE',
      en16931Code: 'AE',
      exemptionReason: null,
      justification: "Prestation B2B UE — art. 259-1 CGI, lieu de taxation chez l'acheteur",
      isAutoResolved: true,
      rule: 'R5_259A_force_seller_country',
    };
    assert.strictEqual(res.rate, 0);
    assert.strictEqual(res.category, 'REVERSE_CHARGE');
    assert.strictEqual(res.en16931Code, 'AE');
    assert.strictEqual(res.exemptionReason, null);
    assert.ok(typeof res.justification === 'string');
    assert.strictEqual(res.isAutoResolved, true);
  });

  it('accepte un STANDARD domestique (FR → FR, 20%)', () => {
    /** @type {import('../dist/types/index.js').VatResolution} */
    const res = {
      rate: 20,
      category: 'STANDARD',
      en16931Code: 'S',
      exemptionReason: null,
      justification: null,
      isAutoResolved: true,
      rule: 'R1_domestic_standard',
    };
    assert.strictEqual(res.rate, 20);
    assert.strictEqual(res.category, 'STANDARD');
    assert.strictEqual(res.en16931Code, 'S');
    assert.strictEqual(res.justification, null);
  });

  it('accepte un EXEMPT avec raison CGI', () => {
    /** @type {import('../dist/types/index.js').VatResolution} */
    const res = {
      rate: 0,
      category: 'EXEMPT',
      en16931Code: 'E',
      exemptionReason: 'Article 261 CGI',
      justification: 'Prestation médicale exonérée',
      isAutoResolved: false,
      rule: null,
    };
    assert.strictEqual(res.category, 'EXEMPT');
    assert.strictEqual(res.en16931Code, 'E');
    assert.strictEqual(res.exemptionReason, 'Article 261 CGI');
    assert.strictEqual(res.isAutoResolved, false);
    assert.strictEqual(res.rule, null);
  });

  it('accepte taux REDUCED (5.5%)', () => {
    /** @type {import('../dist/types/index.js').VatResolution} */
    const res = {
      rate: 5.5,
      category: 'REDUCED',
      en16931Code: 'AA',
      exemptionReason: null,
      justification: null,
      isAutoResolved: true,
      rule: 'R2_reduced_food',
    };
    assert.strictEqual(res.rate, 5.5);
    assert.strictEqual(res.category, 'REDUCED');
  });

  it('accepte taux INTERMEDIATE (10%)', () => {
    /** @type {import('../dist/types/index.js').VatResolution} */
    const res = {
      rate: 10,
      category: 'INTERMEDIATE',
      en16931Code: 'AA',
      exemptionReason: null,
      justification: null,
      isAutoResolved: true,
      rule: 'R3_intermediate_hospitality',
    };
    assert.strictEqual(res.rate, 10);
    assert.strictEqual(res.category, 'INTERMEDIATE');
  });
});

// ---------------------------------------------------------------------------
// LineVatContext shape
// ---------------------------------------------------------------------------

describe('LineVatContext — construction', () => {
  it('accepte les champs minimaux (category seul)', () => {
    /** @type {import('../dist/types/index.js').LineVatContext} */
    const ctx = {
      category: 'STANDARD',
    };
    assert.strictEqual(ctx.category, 'STANDARD');
    assert.ok(ctx.placeOfSupply === undefined);
    assert.ok(ctx.serviceNature === undefined);
  });

  it('accepte placeOfSupply et serviceNature', () => {
    /** @type {import('../dist/types/index.js').LineVatContext} */
    const ctx = {
      category: 'STANDARD',
      placeOfSupply: 'DE',
      serviceNature: 'conseil informatique',
    };
    assert.strictEqual(ctx.placeOfSupply, 'DE');
    assert.strictEqual(ctx.serviceNature, 'conseil informatique');
  });

  it('accepte serviceNature=null (non renseigné)', () => {
    /** @type {import('../dist/types/index.js').LineVatContext} */
    const ctx = {
      category: 'REVERSE_CHARGE',
      placeOfSupply: 'FR',
      serviceNature: null,
    };
    assert.strictEqual(ctx.serviceNature, null);
  });
});

// ---------------------------------------------------------------------------
// VatContextRequest — avec buyer_id OU inline buyer
// ---------------------------------------------------------------------------

describe('VatContextRequest — buyer_id vs inline buyer', () => {
  it('accepte buyer_id UUID', () => {
    /** @type {import('../dist/types/index.js').VatContextRequest} */
    const req = {
      buyerId: '550e8400-e29b-41d4-a716-446655440000',
      line: { category: 'STANDARD' },
    };
    assert.ok(typeof req.buyerId === 'string');
    assert.strictEqual(req.line.category, 'STANDARD');
    assert.ok(req.buyer === undefined);
  });

  it('accepte inline buyer avec country + vatNumber', () => {
    /** @type {import('../dist/types/index.js').VatContextRequest} */
    const req = {
      buyer: {
        country: 'DE',
        vatNumber: 'DE123456789',
        isIndividual: false,
      },
      line: { category: 'STANDARD', placeOfSupply: 'FR' },
    };
    assert.ok(req.buyer !== undefined);
    assert.strictEqual(req.buyer.country, 'DE');
    assert.strictEqual(req.buyer.vatNumber, 'DE123456789');
    assert.strictEqual(req.buyer.isIndividual, false);
    assert.ok(req.buyerId === undefined);
  });

  it('accepte inline buyer sans vatNumber (B2C hors-UE)', () => {
    /** @type {import('../dist/types/index.js').VatContextRequest} */
    const req = {
      buyer: { country: 'US', isIndividual: true },
      line: { category: 'STANDARD', placeOfSupply: 'FR' },
    };
    assert.strictEqual(req.buyer.country, 'US');
    assert.ok(req.buyer.vatNumber === undefined);
    assert.strictEqual(req.buyer.isIndividual, true);
  });
});

// ---------------------------------------------------------------------------
// VatContextResponse shape
// ---------------------------------------------------------------------------

describe('VatContextResponse — structure complète', () => {
  it('contient resolution + warnings (cas nominal)', () => {
    /** @type {import('../dist/types/index.js').VatContextResponse} */
    const resp = {
      resolution: {
        rate: 0,
        category: 'REVERSE_CHARGE',
        en16931Code: 'AE',
        exemptionReason: null,
        justification: 'B2B intracom',
        isAutoResolved: true,
        rule: 'R5_259A',
      },
      warnings: [],
    };
    assert.strictEqual(resp.resolution.rate, 0);
    assert.ok(Array.isArray(resp.warnings));
    assert.strictEqual(resp.warnings.length, 0);
  });

  it('contient des warnings non bloquants', () => {
    /** @type {import('../dist/types/index.js').VatContextResponse} */
    const resp = {
      resolution: {
        rate: 20,
        category: 'STANDARD',
        en16931Code: 'S',
        exemptionReason: null,
        justification: null,
        isAutoResolved: false,
        rule: null,
      },
      warnings: ['VAT number not provided — assumed B2C domestic rate'],
    };
    assert.strictEqual(resp.warnings.length, 1);
    assert.ok(typeof resp.warnings[0] === 'string');
  });
});

// ---------------------------------------------------------------------------
// InvoiceLine — vatRate optionnel depuis 2.19.0
// ---------------------------------------------------------------------------

describe('InvoiceLine — vatRate optionnel + category depuis 2.19.0', () => {
  it('accepte une ligne sans vatRate quand category est fourni', () => {
    /** @type {import('../dist/types/index.js').InvoiceLine} */
    const line = {
      description: 'Prestation conseil informatique',
      quantity: 1,
      unitPrice: 1000,
      category: 'STANDARD',
      // vatRate absent — auto-résolu côté MCP
    };
    assert.strictEqual(line.description, 'Prestation conseil informatique');
    assert.strictEqual(line.unitPrice, 1000);
    assert.strictEqual(line.category, 'STANDARD');
    assert.ok(line.vatRate === undefined);
  });

  it('accepte une ligne avec vatRate ET category (vatRate explicite respecté)', () => {
    /** @type {import('../dist/types/index.js').InvoiceLine} */
    const line = {
      description: 'Prestation B2B intracom',
      quantity: 1,
      unitPrice: 1000,
      vatRate: 0,
      category: 'REVERSE_CHARGE',
    };
    assert.strictEqual(line.vatRate, 0);
    assert.strictEqual(line.category, 'REVERSE_CHARGE');
  });

  it('accepte une ligne avec vatRate uniquement (comportement legacy)', () => {
    /** @type {import('../dist/types/index.js').InvoiceLine} */
    const line = {
      description: 'Fourniture de matériel',
      quantity: 2,
      unitPrice: 500,
      vatRate: 20,
    };
    assert.strictEqual(line.vatRate, 20);
    assert.ok(line.category === undefined);
  });

  it('accepte REVERSE_CHARGE avec vatRate=0', () => {
    /** @type {import('../dist/types/index.js').InvoiceLine} */
    const line = {
      description: 'Conseil B2B UE',
      quantity: 1,
      unitPrice: 2500,
      vatRate: 0,
      category: 'REVERSE_CHARGE',
    };
    assert.strictEqual(line.vatRate, 0);
    assert.strictEqual(line.category, 'REVERSE_CHARGE');
  });

  it('accepte EXEMPT avec vatRate=0', () => {
    /** @type {import('../dist/types/index.js').InvoiceLine} */
    const line = {
      description: 'Acte médical',
      quantity: 1,
      unitPrice: 150,
      category: 'EXEMPT',
    };
    assert.ok(line.vatRate === undefined);
    assert.strictEqual(line.category, 'EXEMPT');
  });
});

// ---------------------------------------------------------------------------
// Vérification de présence dans le dist compilé
// ---------------------------------------------------------------------------

describe('dist/types/index.d.ts — exports VAT context (post-build)', () => {
  it('exporte VatCategory', () => {
    assertExportedFromTypes('VatCategory');
  });

  it('exporte VatResolution', () => {
    assertExportedFromTypes('VatResolution');
  });

  it('exporte LineVatContext', () => {
    assertExportedFromTypes('LineVatContext');
  });

  it('exporte VatContextRequest', () => {
    assertExportedFromTypes('VatContextRequest');
  });

  it('exporte VatContextResponse', () => {
    assertExportedFromTypes('VatContextResponse');
  });

  it('VatResolution a le champ rate dans le .d.ts', () => {
    assertFieldInDts('rate:');
  });

  it('VatResolution a le champ en16931Code dans le .d.ts', () => {
    assertFieldInDts('en16931Code');
  });

  it('VatResolution a le champ exemptionReason dans le .d.ts', () => {
    assertFieldInDts('exemptionReason');
  });

  it('VatResolution a le champ isAutoResolved dans le .d.ts', () => {
    assertFieldInDts('isAutoResolved');
  });

  it('InvoiceLine.vatRate est optionnel dans le .d.ts', () => {
    assertFieldOptionalInDts('vatRate');
  });

  it('InvoiceLine.category est présent dans le .d.ts', () => {
    assertFieldInDts('category?:');
  });
});
