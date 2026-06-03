const {
  MICROCOPY_TRANSLATIONS_ZH
} = require('./language-microcopy-translations');
const {
  MICROCOPY_ACRONYMS,
  MICROCOPY_TOKEN_TRANSLATIONS_ZH
} = require('./language-microcopy-tokens');

function containsCjkText(value = '') {
  return /[\u3400-\u9fff]/.test(String(value || ''));
}

function explicitLanguageFrom(value = {}) {
  const policy = value.visibleLanguagePolicy || value.visible_language_policy || value.languagePolicy || value.language_policy || {};
  const raw = value.language || value.lang || value.locale || value.outputLanguage || value.output_language ||
    value.targetLanguage || value.target_language || policy.language || policy.targetLanguage || policy.target_language || '';
  const lang = String(raw || '').trim().toLowerCase();
  if (!lang) return '';
  if (/^(zh|cn|chinese|中文|汉语|简体中文|zh-cn|zh_hans)/i.test(lang)) return 'zh-CN';
  if (/^(en|english|英文|英语|en-us|en-gb)/i.test(lang)) return 'en';
  return raw;
}

function inferDeckLanguage(plan = {}) {
  const explicit = explicitLanguageFrom(plan);
  if (explicit) return explicit;
  const text = flattenLanguageText({
    title: plan.title,
    subtitle: plan.subtitle,
    organization: plan.organization,
    audience: plan.audience,
    slides: plan.slides,
    document: plan.document,
    claimSpine: plan.claimSpine || plan.claim_spine
  });
  const cjkCount = (String(text).match(/[\u3400-\u9fff]/g) || []).length;
  const latinWords = (String(text).match(/[A-Za-z]{3,}/g) || []).length;
  if (cjkCount >= 8 && cjkCount >= latinWords * 1.2) return 'zh-CN';
  if (cjkCount >= 18) return 'zh-CN';
  return 'en';
}

function languagePolicyFor(plan = {}) {
  const source = plan.visibleLanguagePolicy || plan.visible_language_policy || plan.languagePolicy || plan.language_policy || {};
  const language = explicitLanguageFrom(plan) || inferDeckLanguage(plan);
  const localize = /^zh/i.test(String(language || '')) &&
    source.localizeNonEssentialMicrocopy !== false &&
    source.localize_non_essential_microcopy !== false &&
    source.visibleMicrocopy !== 'preserve-english-labels' &&
    source.visible_microcopy !== 'preserve-english-labels' &&
    plan.preserveEnglishLabels !== true &&
    plan.allowEnglishLabels !== true;
  return Object.assign({
    version: 'visible-language-policy/v1',
    language,
    localizeNonEssentialMicrocopy: localize,
    preserveAcronyms: true,
    exceptions: ['brand names', 'product names', 'stock tickers', 'URLs', 'emails', 'standard acronyms', 'source titles']
  }, source, {
    language,
    localizeNonEssentialMicrocopy: localize
  });
}

function normalizeMicrocopyKey(value = '') {
  return String(value || '')
    .replace(/[–—]/g, '-')
    .replace(/\s*→\s*/g, ' → ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s*·\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function translateMicrocopySequence(key = '') {
  const parts = String(key || '').split(/(\s+(?:→|\/|·|\+|&)\s+|\s*-\s*)/).filter(part => part !== '');
  if (parts.length < 3) return '';
  let translatedAny = false;
  const out = parts.map(part => {
    if (/^\s*(?:→|\/|·|\+|&|-)\s*$/.test(part)) return part.replace(/\s+/g, ' ');
    const token = part.trim();
    if (!token) return part;
    if (MICROCOPY_ACRONYMS.has(token)) return token;
    const zh = MICROCOPY_TOKEN_TRANSLATIONS_ZH[token];
    if (!zh) return null;
    translatedAny = true;
    return zh;
  });
  if (!translatedAny || out.some(part => part == null)) return '';
  return out.join('').replace(/\s*\/\s*/g, ' / ').replace(/\s*·\s*/g, ' · ').replace(/\s*→\s*/g, ' → ').trim();
}

function localizeMicrocopy(plan = {}, text = '', opts = {}) {
  const raw = String(text == null ? '' : text).trim();
  if (!raw || opts.preserveLanguage || opts.preserveMicrocopy || opts.noLocalize) return text;
  const policy = languagePolicyFor(plan);
  if (!policy.localizeNonEssentialMicrocopy) return text;
  if (containsCjkText(raw)) return text;
  if (/^[\d\s./:%+-]+$/.test(raw)) return text;
  const upper = normalizeMicrocopyKey(raw);
  if (MICROCOPY_ACRONYMS.has(upper)) return text;
  const withYear = upper.match(/^(.+?)\s+\/\s+(\d{4})$/);
  if (withYear) {
    const translated = MICROCOPY_TRANSLATIONS_ZH.get(withYear[1]) || translateMicrocopySequence(withYear[1]);
    if (translated) return `${translated} / ${withYear[2]}`;
  }
  if (MICROCOPY_TRANSLATIONS_ZH.has(upper)) return MICROCOPY_TRANSLATIONS_ZH.get(upper);
  const numbered = upper.match(/^(PROOF|CHART|CERT|CONTROL|PRINCIPLE|LINE|STEP|SUPPORT|INFO)\s*0?(\d+)$/);
  if (numbered) {
    const labels = {
      PROOF: '证据',
      CHART: '图表',
      CERT: '证书',
      CONTROL: '控制',
      PRINCIPLE: '原则',
      LINE: '产线',
      STEP: '步骤',
      SUPPORT: '支撑',
      INFO: '信息'
    };
    return `${labels[numbered[1]] || numbered[1]} ${String(numbered[2]).padStart(2, '0')}`;
  }
  const sequence = translateMicrocopySequence(upper);
  if (sequence) return sequence;
  const metric = upper.match(/^METRIC\s+(\d+)$/);
  if (metric) return `指标 ${metric[1]}`;
  const risk = upper.match(/^RISK\s+(\d+)$/);
  if (risk) return `风险 ${risk[1]}`;
  return text;
}

function flattenLanguageText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(flattenLanguageText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenLanguageText).join(' ');
  return '';
}

module.exports = {
  containsCjkText,
  inferDeckLanguage,
  languagePolicyFor,
  localizeMicrocopy
};
