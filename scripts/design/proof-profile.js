const { compactUnique } = require('./text-utils');

function camelProofField(id = '') {
  const parts = String(id || '').split(/[^a-z0-9]+/i).filter(Boolean);
  if (!parts.length) return '';
  return parts[0] + parts.slice(1).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

function routeForPackProof(id = '') {
  const value = String(id || '');
  if (/kpi|scorecard|revenue|growth|conversion|metric/i.test(value)) return `metric-comparison:${value}`;
  if (/matrix|risk|governance|assurance|control|policy/i.test(value)) return `risk-table:${value}`;
  if (/map|process|creation|model|blueprint|topology|capability|workflow|journey|world/i.test(value)) return `strategy-map:${value}`;
  if (/gallery|proof|photo|mosaic|evidence|product|people|place|story|cover|lookbook/i.test(value)) return `case-gallery:${value}`;
  if (/mission|culture|principle|statement|value/i.test(value)) return `manifesto:${value}`;
  return value;
}

function valueTitle(id = '') {
  return String(id || '').replace(/[-_]/g, ' ').trim();
}

function keywordsForPackProof(id = '', pack = {}) {
  const words = String(id || '').split(/[-_]/).filter(Boolean);
  const zh = {
    beauty: ['美妆', '美容', '品牌', '产品', '包装', '门店', '会员'],
    consumer: ['消费', '品牌', '零售', '渠道', '会员', '复购'],
    culture: ['文化', '使命', '愿景', '价值观', '团队', '招聘'],
    government: ['政府', '园区', '政策', '治理', '国企', '招商'],
    public: ['公共', '政策', '治理', '服务'],
    food: ['食品', '餐饮', '产品', '体验'],
    tourism: ['文旅', '旅游', '空间', '路线', '客群'],
    fashion: ['时尚', 'lookbook', '产品', '穿搭'],
    finance: ['财报', '投资', '风险', '收益', '组合'],
    saas: ['SaaS', '平台', '工作流', '采用', '留存'],
    healthcare: ['医疗', '护理', '患者', '质控', '服务']
  };
  const packText = `${pack.labelZh || ''} ${pack.labelEn || ''} ${(pack.aliases || []).join(' ')}`.toLowerCase();
  const expanded = Object.entries(zh).flatMap(([key, values]) => {
    return packText.includes(key) || words.includes(key) ? values : [];
  });
  return compactUnique([...words, ...expanded, valueTitle(id)]);
}

function profileFromIndustryPack(pack = {}) {
  if (!pack || !pack.id) return null;
  const proofObjects = (pack.proofObjects || []).map(id => ({
    id,
    route: routeForPackProof(id),
    fields: [camelProofField(id), id],
    keywords: keywordsForPackProof(id, pack),
    depth: /risk|governance|assurance|policy|control/i.test(id) ? 'risk-governance' :
      (/metric|kpi|scorecard|growth|conversion|revenue/i.test(id) ? 'business-metric' :
        (/gallery|photo|proof|evidence|mosaic|product|people|place|cover/i.test(id) ? 'evidence-proof' : 'system-map'))
  }));
  return {
    label: pack.labelZh || pack.labelEn || pack.id,
    narrativeArchetype: (pack.recommendedOutline || []).join(' -> '),
    entities: {
      asset: compactUnique([...(pack.proofObjects || []), ...(pack.pageFamilies || [])]),
      actor: [],
      risk: pack.forbiddenTemplates || [],
      metric: (pack.qaFocus || []).filter(Boolean)
    },
    proofObjects,
    depthGates: {
      minProofObjects: Math.min(3, Math.max(2, proofObjects.length >= 4 ? 2 : 1)),
      requiredDomains: compactUnique(proofObjects.slice(0, 2).map(proof => proof.depth))
    },
    pack
  };
}

module.exports = {
  camelProofField,
  keywordsForPackProof,
  profileFromIndustryPack,
  routeForPackProof,
  valueTitle
};
