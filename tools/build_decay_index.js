// Build a compact decay-tree index from the pace_ensdf ENSDF_JSON data.
// The output is written to `Nuclide Data/decay-index.json` and keeps only
// the minimal fields we need in the browser (parent/daughter keys, mode,
// branch %, Q-value, and half-life metadata).
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'Nuclide Data', 'pace_ensdf-main', 'paceENSDF', 'ENSDF_JSON');
const outFile = path.join(root, 'Nuclide Data', 'decay-index.json');

function toNumber(value) {
  if (value === undefined || value === null) return null;
  const num = Number(String(value).replace(/[^0-9.+-eE-]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function normalizeBranch(value) {
  const num = toNumber(value);
  if (num === null) return null;
  if (num <= 1.2) return +(num * 100).toFixed(3); // values already in fraction form
  if (num <= 120) return +num.toFixed(3); // treat as percentage
  return 100;
}

const parents = {};
let parsed = 0;
let skipped = 0;

for (const file of fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'))) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(sourceDir, file), 'utf8'));
    const parentKey = `${raw.parentAtomicNumber}-${raw.parentNeutronNumber}`;
    const daughterKey = `${raw.daughterAtomicNumber}-${raw.daughterNeutronNumber}`;
    const branchPercent = normalizeBranch(
      raw.decaySchemeNormalization?.[0]?.normalizationRecord?.[0]?.multiplerBranchingRatio
    );
    const qValueKeV = toNumber(raw.parentDecay?.[0]?.valueQ);
    const levelEnergyKeV = toNumber(raw.levelEnergyParentDecay);
    const halfLife = raw.parentDecay?.[0]?.halfLife?.[0] || {};
    const halfLifeSeconds = toNumber(halfLife.halfLifeConverted ?? halfLife.halfLifeBest);
    const halfLifeUnit = halfLife.unitHalfLifeConverted || halfLife.unitHalfLifeBest || null;

    if (!parents[parentKey]) {
      parents[parentKey] = {
        parentID: raw.parentID,
        z: raw.parentAtomicNumber,
        n: raw.parentNeutronNumber,
        a: raw.parentAtomicMass,
        branches: []
      };
    }

    const branchPayload = {
      to: daughterKey,
      daughterID: raw.daughterID,
      mode: raw.decayMode,
      branchPercent,
      qValueKeV,
      levelEnergyKeV,
      halfLifeSeconds,
      halfLifeUnit
    };

    const current = parents[parentKey].branches.findIndex(
      b => b.to === branchPayload.to && b.mode === branchPayload.mode
    );

    if (current >= 0) {
      const existing = parents[parentKey].branches[current];
      const preferNew =
        (branchPayload.levelEnergyKeV ?? Infinity) < (existing.levelEnergyKeV ?? Infinity) ||
        ((branchPayload.branchPercent ?? -1) > (existing.branchPercent ?? -1));
      if (preferNew) parents[parentKey].branches[current] = branchPayload;
    } else {
      parents[parentKey].branches.push(branchPayload);
    }

    parsed += 1;
  } catch (err) {
    skipped += 1;
  }
}

const payload = {
  generated: new Date().toISOString(),
  source: 'pace_ensdf-main/ENSDF_JSON',
  parents
};

fs.writeFileSync(outFile, JSON.stringify(payload));

console.log(`Wrote ${parsed} decay entries to ${outFile}`);
if (skipped) console.warn(`Skipped ${skipped} files due to parse errors.`);
