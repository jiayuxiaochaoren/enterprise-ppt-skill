const {
  TEXT_METADATA_OMIT_KEYS
} = require('./text-utils');

const CHAIN_TEXT_OMIT_KEYS = new Set(TEXT_METADATA_OMIT_KEYS);

function compactUnique(values = []) {
  return [...new Set((values || []).filter(value => value != null && String(value).trim() !== '').map(value => String(value)))];
}

function normalizeKey(value = '') {
  return String(value || '').trim().toLowerCase();
}

function flattenText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(' ');
  if (typeof value === 'object') {
    return Object.keys(value)
      .filter(key => !CHAIN_TEXT_OMIT_KEYS.has(key))
      .map(key => flattenText(value[key]))
      .join(' ');
  }
  return '';
}

function proofObjectIdForSlide(slide = {}) {
  return String(slide.proofObject || slide.proof_object || (slide.proof && slide.proof.id) || '').trim();
}

function routeTextForSlide(slide = {}) {
  const proofObject = proofObjectIdForSlide(slide);
  return normalizeKey([
    slide.type,
    slide.layoutVariant,
    slide.variant,
    proofObject,
    slide.proof && slide.proof.id
  ].filter(Boolean).join(':'));
}

function genericCardJudgmentWithoutEvidence(slide = {}, hasFieldPath = () => false) {
  const type = normalizeKey(slide.type);
  if (!['cards', 'value-tiles', 'executive-blocks', 'two-column', 'two-column-clean'].includes(type)) return false;
  return ![
    'visual.image',
    'visual.images',
    'image',
    'images',
    'product',
    'products',
    'productStory',
    'metrics',
    'rows',
    'reviews',
    'sales'
  ].some(field => hasFieldPath(slide, field));
}

module.exports = {
  CHAIN_TEXT_OMIT_KEYS,
  compactUnique,
  flattenText,
  genericCardJudgmentWithoutEvidence,
  normalizeKey,
  proofObjectIdForSlide,
  routeTextForSlide
};
