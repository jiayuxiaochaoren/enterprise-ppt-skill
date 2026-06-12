const {
  MICROCOPY_CORE_TRANSLATIONS_ZH
} = require('./language-microcopy-translations-core');
const {
  MICROCOPY_DOMAIN_TRANSLATIONS_ZH
} = require('./language-microcopy-translations-domain');

const MICROCOPY_TRANSLATION_SHARDS_ZH = [
  MICROCOPY_CORE_TRANSLATIONS_ZH,
  MICROCOPY_DOMAIN_TRANSLATIONS_ZH
];

const MICROCOPY_TRANSLATIONS_ZH = new Map(
  MICROCOPY_TRANSLATION_SHARDS_ZH.flatMap(shard => Object.entries(shard))
);

module.exports = {
  MICROCOPY_TRANSLATIONS_ZH
};
