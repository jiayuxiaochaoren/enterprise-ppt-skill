#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SAMPLER = path.join(ROOT, 'out/reference-corpus/meta/slideland-category-reference-samples.json');
const DEFAULT_ANALYSIS = path.join(ROOT, 'out/reference-corpus/meta/reference-analysis.json');
const DEFAULT_OUT = path.join(ROOT, 'assets/reference-recipe-library.json');

function parseArgs(argv) {
  const opts = {
    sampler: DEFAULT_SAMPLER,
    analysis: DEFAULT_ANALYSIS,
    out: DEFAULT_OUT
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--sampler') opts.sampler = path.resolve(argv[++i]);
    else if (a === '--analysis') opts.analysis = path.resolve(argv[++i]);
    else if (a === '--out') opts.out = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

function usage() {
  console.error([
    'Usage:',
    '  node scripts/build_reference_recipes.js',
    '  node scripts/build_reference_recipes.js --sampler out/reference-corpus/meta/slideland-category-reference-samples.json --analysis out/reference-corpus/meta/reference-analysis.json --out assets/reference-recipe-library.json'
  ].join('\n'));
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeCompactJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value)}\n`, 'utf8');
}

function slugify(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'reference';
}

function compactUnique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function compactRecipeForIndex(recipe = {}) {
  const designSyntax = recipe.designSyntax || {};
  const taxonomy = recipe.taxonomy || {};
  const source = recipe.source || {};
  const scores = recipe.scores || {};
  return {
    id: recipe.id,
    renderType: recipe.renderType,
    slideType: recipe.slideType,
    layoutVariant: recipe.layoutVariant,
    themeIntent: recipe.themeIntent,
    proofObject: recipe.proofObject,
    pageFamilies: recipe.pageFamilies || [],
    assetRole: recipe.assetRole,
    componentHints: (recipe.componentHints || []).slice(0, 12),
    industryFit: recipe.industryFit || [],
    signals: (recipe.signals || []).slice(0, 28),
    scores: {
      overall: scores.overall,
      commercialPremium: scores.commercialPremium,
      industryRecognition: scores.industryRecognition,
      imageEvidenceValue: scores.imageEvidenceValue
    },
    industry: recipe.industry || [],
    materialType: recipe.materialType,
    pageRole: recipe.pageRole,
    mainVisualMethod: recipe.mainVisualMethod,
    informationDensity: recipe.informationDensity,
    generatedAsset: recipe.generatedAsset,
    designSyntax: {
      industry: designSyntax.industry || [],
      materialType: designSyntax.materialType || recipe.materialType || '',
      pageRole: designSyntax.pageRole || recipe.pageRole || '',
      proofObject: designSyntax.proofObject || recipe.proofObject || '',
      mainVisualMethod: designSyntax.mainVisualMethod || recipe.mainVisualMethod || '',
      informationDensity: designSyntax.informationDensity || recipe.informationDensity || '',
      suitablePageFamilies: designSyntax.suitablePageFamilies || recipe.suitablePageFamilies || [],
      forbiddenPoints: designSyntax.forbiddenPoints || recipe.forbiddenPoints || []
    },
    taxonomy: {
      documentType: taxonomy.documentType || '',
      pageRole: taxonomy.pageRole || recipe.pageRole || '',
      labels: (taxonomy.labels || []).slice(0, 8)
    },
    source: {
      kind: source.kind || '',
      categoryId: source.categoryId || ''
    }
  };
}

function writeReferenceRecipeLibrary(outFile, library) {
  const outDir = path.join(path.dirname(outFile), 'reference-recipes');
  const shardDir = path.join(outDir, 'shards');
  fs.mkdirSync(shardDir, { recursive: true });
  for (const old of fs.readdirSync(shardDir, { withFileTypes: true })) {
    if (old.isFile() && old.name.endsWith('.json')) fs.unlinkSync(path.join(shardDir, old.name));
  }
  const groups = new Map();
  for (const recipe of library.recipes || []) {
    const key = recipe.renderType || recipe.slideType || 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(recipe);
  }
  const shards = {};
  for (const [key, recipes] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const file = `shards/${slugify(key)}.json`;
    shards[key] = { file, recipeCount: recipes.length };
    writeCompactJson(path.join(outDir, file), {
      version: 'reference-recipe-shard/v1',
      key,
      recipeCount: recipes.length,
      recipes
    });
  }
  writeCompactJson(path.join(outDir, 'index.json'), {
    name: library.name,
    version: 'reference-recipe-index/v1',
    sourceVersion: library.version,
    generatedAt: library.generatedAt,
    sourcePolicy: library.sourcePolicy,
    coverage: library.coverage,
    shardStrategy: 'renderType',
    shards,
    recipes: (library.recipes || []).map(compactRecipeForIndex)
  });
  writeJson(outFile, {
    name: library.name,
    version: 'reference-recipe-library-manifest/v1',
    sourceVersion: library.version,
    generatedAt: library.generatedAt,
    sourcePolicy: library.sourcePolicy,
    recipeCount: (library.recipes || []).length,
    coverage: library.coverage,
    index: 'reference-recipes/index.json',
    shardDirectory: 'reference-recipes/shards',
    shardStrategy: 'renderType',
    shards,
    recipes: []
  });
}

function tagSlugs(sample = {}) {
  return (sample.tags || []).map(tag => {
    const href = String(tag.href || '');
    const m = href.match(/\/zh\/([^/]+)\/([^/?#]+)/);
    return m ? `${m[1]}/${m[2]}` : '';
  }).filter(Boolean);
}

function tagLabels(sample = {}) {
  return (sample.tags || []).map(tag => String(tag.label || '').trim()).filter(Boolean);
}

function sourceHost(url = '') {
  const m = String(url || '').match(/^https?:\/\/([^/]+)/);
  return m ? m[1].replace(/^www\./, '') : '';
}

function materialTypeFromTags(tags = []) {
  if (tags.includes('material/financial-result')) return 'financial-results';
  if (tags.includes('material/integrated-report')) return 'integrated-report';
  if (tags.includes('material/company-introduction')) return 'company-deck';
  if (tags.includes('material/service-introduction')) return 'service-deck';
  if (tags.includes('material/business-plan')) return 'business-plan';
  if (tags.includes('material/midterm-business')) return 'mid-term-plan';
  if (tags.includes('material/presentation')) return 'seminar-deck';
  return '';
}

function industryFitFromTags(tags = [], labels = []) {
  const text = `${tags.join(' ')} ${labels.join(' ')}`.toLowerCase();
  const hits = [];
  const add = (...ids) => ids.forEach(id => hits.push(id));
  if (/category\/finance|金融|投資|投资|ir\b|financial/.test(text)) add('finance-investment');
  if (/category\/manufacturing|category\/car|category\/chemistry|category\/architecture|category\/logistic|制造|汽车|化学|建筑|物流/.test(text)) add('manufacturing-operations');
  if (/category\/energy|能源|活力|電力|storage|utility/.test(text)) add('energy-utility');
  if (/category\/saas|category\/ai|category\/development|category\/information-communication|软件|人工智能|开发|信息通信|platform|api|saas/.test(text)) add('saas-technology');
  if (/category\/medtech|医疗|护理|health|clinical/.test(text)) add('healthcare-operations');
  if (/category\/beauty|category\/fashion|category\/food|category\/ec|category\/branding|category\/advertisement|美妆|美容|时尚|食物|食品|电子商务|品牌|广告|retail|consumer/.test(text)) add('beauty-consumer');
  if (/category\/sightseeing|category\/entertainment|category\/music|category\/publication|旅游|娱乐|音乐|出版|文旅/.test(text)) add('lifestyle-food-tourism-fashion');
  if (/category\/government|category\/rental-space|category\/real-estate|政府|园区|出租空间|房地产|公共/.test(text)) add('government-public-sector');
  if (/category\/human-resources|page\/culture|page\/member|page\/hiring|招聘|文化|员工|团队|人力资源/.test(text)) add('people-culture');
  if (/category\/sales|category\/consulting|category\/marketing|销售|咨询|营销/.test(text)) add('general-operations');
  return compactUnique(hits.length ? hits : ['general-operations']);
}

function pageRoleFromCategory(category = {}, tags = []) {
  if (category.kind === 'page') return category.slug;
  const page = tags.find(t => t.startsWith('page/'));
  return page ? page.split('/')[1] : '';
}

function tasteFromTags(tags = []) {
  return tags.filter(t => t.startsWith('taste/')).map(t => t.split('/')[1]);
}

function renderTypeFor(category = {}, tags = [], labels = []) {
  const id = category.id || '';
  const text = `${id} ${tags.join(' ')} ${labels.join(' ')}`.toLowerCase();
  if (/front-cover|inside-cover|cover|封面/.test(text)) return 'cover';
  if (/table-of-content|目录/.test(text)) return 'toc-clean';
  if (/last-page|closing|最后|結尾|结尾/.test(text)) return 'closing';
  if (/chapter|章节|inside-cover/.test(text)) return 'chapter-divider';
  if (/financial|balance-sheet|profit-and-loss|kpi|highlight|numerical-goal|sales|dividend|water-fall|bar-graph|line-graph|scatter|area-graph|pie-chart|财务|指标|图|销售趋势|瀑布/.test(text)) return 'metric-comparison';
  if (/value-creation|business-model|growth-strategy|flow|cycle|tree|pyramid|layer|map|strategy|价值创造|商业模式|成长策略|流程|循环|层级|地图/.test(text)) return 'strategy-map';
  if (/risk|governance|compliance|materiality|matrix|table|contrast|技能矩阵|治理|风险|合规|矩阵|表格|比较/.test(text)) return 'risk-table';
  if (/roadmap|schedule|recruitment-flow|daily-flow|step|gantt|timeline|路线图|日程|流程|甘特|步骤/.test(text)) return 'timeline';
  if (/culture|slogan|mission|vision|action-guideline|voice|message|quote|文化|使命|愿景|价值观|客户评价|员工心声/.test(text)) return 'manifesto';
  if (/case|office|member|interview|product|photo|portfolio|lookbook|案例|办公室|成员|面试|产品|照片/.test(text)) return 'case-gallery';
  if (/company-profile|company-information|profile|公司简介|公司及股票信息/.test(text)) return 'profile-proof';
  if (/price|pricing|价格|定价/.test(text)) return 'table';
  if (category.kind === 'schematic') return 'architecture';
  if (category.kind === 'graph') return 'metric-comparison';
  return 'executive-blocks';
}

function layoutVariantFor(category = {}, renderType = '', tags = [], labels = []) {
  const text = `${category.id || ''} ${tags.join(' ')} ${labels.join(' ')}`.toLowerCase();
  if (renderType === 'metric-comparison') {
    if (/water-fall|瀑布/.test(text)) return 'financial-waterfall';
    if (/financial-result|quarter|q1|q2|q3|q4|财务业绩/.test(text)) return 'quarterly-results-summary';
    if (/kpi|highlight|numerical/.test(text)) return 'financial-kpi-snapshot';
    return 'chart-grid-with-commentary';
  }
  if (renderType === 'strategy-map') {
    if (/value-creation|综合报告|integrated-report/.test(text)) return 'value-creation-process-map';
    if (/business-model/.test(text)) return 'business-model-map';
    if (/cycle|flywheel|循环/.test(text)) return 'operating-loop';
    return 'single-object-concept-map';
  }
  if (renderType === 'risk-table') {
    if (/materiality|重要问题/.test(text)) return 'materiality-matrix-board';
    if (/governance|compliance|治理|合规/.test(text)) return 'governance-table-editorial';
    if (/risk|风险/.test(text)) return 'guidance-and-risk-board';
    return 'matrix-board';
  }
  if (renderType === 'manifesto') {
    if (/culture|文化/.test(text)) return 'culture-cover-with-soft-geometry';
    if (/slogan|mission|vision|使命|愿景/.test(text)) return 'mission-statement-stage';
    return 'value-principle-cards';
  }
  if (renderType === 'case-gallery') {
    if (/beauty|美妆|美容|product|产品|lookbook/.test(text)) return 'consumer-proof-photo-grid';
    if (/member|团队|员工|portrait/.test(text)) return 'people-proof-mosaic';
    if (/before-after|之前|之后/.test(text)) return 'case-comparison';
    return 'evidence-board';
  }
  if (renderType === 'cover') {
    if (/beauty|美妆|美容|luxury|高级|奢华/.test(text)) return 'beauty-brand-editorial-cover';
    if (/minimal|极简/.test(text)) return 'airy-concept-opening';
    return 'editorial-cover';
  }
  if (renderType === 'closing') return 'premium-closing-anchor';
  return '';
}

function proofObjectFor(category = {}, renderType = '', variant = '', labels = []) {
  const text = `${category.label_zh || ''} ${category.label_en || ''} ${labels.join(' ')}`;
  if (variant) return variant;
  if (renderType === 'metric-comparison') return 'metric-board';
  if (renderType === 'strategy-map') return 'value-creation-map';
  if (renderType === 'risk-table') return 'governance-risk-board';
  if (renderType === 'case-gallery') return 'visual-evidence-gallery';
  if (renderType === 'manifesto') return 'culture-principle';
  if (renderType === 'cover') return 'brand-identity';
  return slugify(text).slice(0, 48);
}

function themeIntentFor(renderType = '', variant = '', category = {}) {
  if (renderType === 'cover') return 'industry-opening';
  if (renderType === 'toc-clean' || renderType === 'chapter-divider') return 'navigation-map';
  if (renderType === 'closing') return 'closing-anchor';
  if (renderType === 'case-gallery' || /proof|evidence/.test(variant)) return 'case-evidence';
  if (renderType === 'metric-comparison') return 'value-signal';
  if (renderType === 'strategy-map' || renderType === 'architecture') return 'system-architecture';
  if (renderType === 'risk-table' || renderType === 'table') return 'risk-warning';
  if (renderType === 'timeline') return 'operating-path';
  if (renderType === 'profile-proof') return 'company-proof';
  if ((category.slug || '').match(/issue|background|problem/)) return 'diagnosis';
  return 'executive-narrative';
}

function paletteIntentFor(tags = [], labels = []) {
  const text = `${tags.join(' ')} ${labels.join(' ')}`.toLowerCase();
  if (/category\/beauty|beauty|美妆|美容|red|红|luxury|奢华/.test(text)) return 'beauty-warm-premium';
  if (/finance|金融|navy|blue|蓝/.test(text)) return 'finance-slate';
  if (/manufacturing|energy|industrial|制造|能源|green|绿色/.test(text)) return 'japan-editorial-navy';
  if (/healthcare|医疗|natural|自然|green|绿色/.test(text)) return 'sage-operations';
  if (/saas|ai|futuristic|未来/.test(text)) return 'signal-charcoal';
  if (/government|trust|政府|信赖|相信/.test(text)) return 'japan-editorial-navy';
  return 'japan-editorial-navy';
}

function componentHintsFor(renderType = '', variant = '', industryFit = []) {
  const base = ['top-rule', 'page-number', 'section-kicker', 'source-note'];
  const add = [];
  if (renderType === 'metric-comparison') add.push('metric-strip', 'chart-commentary-panel', 'source-note');
  if (renderType === 'strategy-map') add.push('process-rail', 'system-rail', 'value-chain-connector');
  if (renderType === 'risk-table' || renderType === 'table') add.push('risk-matrix', 'control-tag', 'disclosure-footnote');
  if (renderType === 'case-gallery') add.push('evidence-frame', 'caption-bar', 'proof-gallery-grid');
  if (renderType === 'manifesto') add.push('statement-stage', 'value-principle-cards');
  if (renderType === 'cover') add.push('brand-world-hero', 'meta-folio');
  if (industryFit.includes('beauty-consumer')) add.push('brand-proof-caption', 'product-story-caption', 'warm-premium-redline');
  if (industryFit.includes('people-culture')) add.push('people-proof-mosaic', 'culture-value-marker');
  return compactUnique([...base, ...add, variant].filter(Boolean));
}

function mainVisualMethod(renderType = '', variant = '', tags = []) {
  const text = `${renderType} ${variant} ${tags.join(' ')}`.toLowerCase();
  if (/gallery|photo|image|lookbook|mosaic|cover|product|beauty|case/.test(text)) return 'captioned-real-asset-or-showcase';
  if (/metric|financial|chart|graph|kpi|waterfall/.test(text)) return 'data-readout-with-commentary';
  if (/risk|governance|matrix|table|materiality/.test(text)) return 'structured-board-or-matrix';
  if (/strategy|map|flow|creation|architecture|schematic/.test(text)) return 'process-map-or-system-diagram';
  if (/manifesto|culture|mission|principle/.test(text)) return 'statement-stage-with-proof-cards';
  return 'solid-editorial-structure';
}

function informationDensity(renderType = '', tags = []) {
  const text = `${renderType} ${tags.join(' ')}`.toLowerCase();
  if (/financial|integrated|report|table|governance|risk|chart|graph|财务|报告|治理/.test(text)) return 'high';
  if (/cover|closing|mission|slogan|culture/.test(text)) return 'low';
  return 'medium';
}

function colorSemanticsFor(renderType = '', variant = '', paletteIntent = '') {
  if (/risk|governance|materiality|guidance/.test(`${renderType} ${variant}`)) return ['risk=priority', 'brand=structure', 'neutral=readability'];
  if (/metric|financial|chart|kpi|quarter/.test(`${renderType} ${variant}`)) return ['data=primary-readout', 'action=commentary', 'neutral=grid'];
  if (/gallery|proof|photo|evidence|product|beauty/.test(`${renderType} ${variant}`)) return ['evidence=caption', 'brand=asset-frame', 'neutral=breathing-space'];
  if (/strategy|map|creation|architecture|process/.test(`${renderType} ${variant}`)) return ['brand=system-anchor', 'action=flow', 'data=outcome'];
  if (/culture|mission|principle/.test(`${renderType} ${variant}`)) return ['brand=identity', 'evidence=people-proof', 'neutral=stage'];
  return [`palette=${paletteIntent || 'default'}`, 'brand=anchor', 'neutral=body'];
}

function suitablePageFamilies(renderType = '', variant = '') {
  const families = [renderType].filter(Boolean);
  if (/financial|kpi|quarter|chart/.test(variant)) families.push('metric-comparison', 'industry-chart');
  if (/value-creation|concept|business-model|brand-world/.test(variant)) families.push('strategy-map', 'architecture');
  if (/risk|governance|materiality|guidance/.test(variant)) families.push('risk-table', 'table');
  if (/culture|mission|principle/.test(variant)) families.push('manifesto', 'cover');
  if (/proof|gallery|mosaic|photo|product|beauty/.test(variant)) families.push('case-gallery', 'product-showcase');
  if (/closing/.test(variant)) families.push('closing');
  return compactUnique(families);
}

function forbiddenPoints(renderType = '', variant = '') {
  const common = ['copy source layout exactly', 'reuse source images/logos/text'];
  if (/gallery|photo|proof|evidence|product/.test(`${renderType} ${variant}`)) common.push('use pretty image without evidence caption');
  if (/metric|financial|chart|kpi/.test(`${renderType} ${variant}`)) common.push('show numbers without business interpretation');
  if (/risk|governance|materiality/.test(`${renderType} ${variant}`)) common.push('collapse governance into unreadable plain table');
  if (/culture|mission|people/.test(`${renderType} ${variant}`)) common.push('use empty slogan without behavior proof');
  return common;
}

function designSyntaxFor({ industryFit, materialType, pageRole, tastes, renderType, layoutVariant, paletteIntent, proofObject, tags }) {
  return {
    industry: industryFit,
    materialType,
    pageRole,
    visualTemperament: tastes && tastes.length ? tastes : [paletteIntent || 'premium-commercial'],
    mainVisualMethod: mainVisualMethod(renderType, layoutVariant, tags),
    informationDensity: informationDensity(renderType, tags),
    colorSemantics: colorSemanticsFor(renderType, layoutVariant, paletteIntent),
    proofObject,
    suitablePageFamilies: suitablePageFamilies(renderType, layoutVariant),
    forbiddenPoints: forbiddenPoints(renderType, layoutVariant)
  };
}

function scoreRecipe(category = {}, sample = {}, renderType = '', industryFit = [], tags = [], labels = []) {
  const title = String(sample.title || '');
  const tagText = `${tags.join(' ')} ${labels.join(' ')} ${title}`.toLowerCase();
  const hasData = /financial|kpi|highlight|chart|graph|water|财务|指标|グラフ|売上|利益|%|％|\d/.test(tagText);
  const hasImageProof = /photo|product|case|office|portrait|mockup|screenshot|照片|产品|案例|办公室|人像|截图/.test(tagText) || Boolean(sample.thumbnail_url);
  const premium = /luxury|minimal|trust|clear|高级|奢华|极简|信赖|相信|清爽|shiseido|kao|canon/i.test(tagText) ? 88 : 72;
  const industrySpecificity = industryFit.some(id => id !== 'general-operations') ? 88 : 62;
  const dataPersuasion = hasData || ['metric-comparison', 'risk-table', 'strategy-map'].includes(renderType) ? 84 : 58;
  const imageEvidence = hasImageProof ? 78 : 42;
  const reusability = category.cards_found >= 12 ? 86 : (category.cards_found >= 4 ? 74 : 58);
  const host = sourceHost(sample.source_url);
  const copyrightRisk = /speakerdeck|eir-parts|corp\.shiseido|kao\.com|canon|ssl4/.test(host) ? 38 : 46;
  return {
    commercialPremium: premium,
    premiumLook: premium,
    dataPersuasion,
    industryRecognition: industrySpecificity,
    industrySpecificity,
    imageEvidenceValue: imageEvidence,
    imageEvidence,
    reusability,
    copyrightSimilarityRisk: copyrightRisk,
    overall: Math.round((premium + dataPersuasion + industrySpecificity + imageEvidence + reusability - copyrightRisk * 0.35) / 4.65)
  };
}

function exposeRecipeSyntax(recipe = {}) {
  const syntax = recipe.designSyntax || {};
  return {
    ...recipe,
    industry: syntax.industry || recipe.industryFit || [],
    materialType: syntax.materialType || (recipe.taxonomy && recipe.taxonomy.documentType) || '',
    pageRole: syntax.pageRole || (recipe.taxonomy && recipe.taxonomy.pageRole) || '',
    visualTemperament: syntax.visualTemperament || [],
    mainVisualMethod: syntax.mainVisualMethod || '',
    informationDensity: syntax.informationDensity || '',
    colorSemantics: syntax.colorSemantics || [],
    suitablePageFamilies: syntax.suitablePageFamilies || recipe.pageFamilies || [],
    forbiddenMoves: syntax.forbiddenPoints || [],
    forbiddenPoints: syntax.forbiddenPoints || []
  };
}

function derivedRecipe(base = {}, layoutVariant = '', renderType = '', overrides = {}) {
  const industryFit = overrides.industryFit || base.industryFit || ['general-operations'];
  const materialType = overrides.materialType || (base.taxonomy && base.taxonomy.documentType) || '';
  const pageRole = overrides.pageRole || (base.taxonomy && base.taxonomy.pageRole) || '';
  const tastes = overrides.tastes || (base.taxonomy && base.taxonomy.visualTaste) || [];
  const tags = compactUnique([layoutVariant, ...(base.taxonomy && base.taxonomy.tags || []), ...(overrides.tags || [])]);
  const labels = compactUnique([...(base.taxonomy && base.taxonomy.labels || []), ...(overrides.labels || [])]);
  const paletteIntent = overrides.paletteIntent || base.paletteIntent || paletteIntentFor(tags, labels);
  const source = Object.assign({}, base.source || {}, {
    derivedFrom: base.id,
    derivedPageFamily: layoutVariant
  });
  return exposeRecipeSyntax({
    ...base,
    id: `derived--${layoutVariant}--${base.id}`.slice(0, 140),
    source,
    taxonomy: Object.assign({}, base.taxonomy || {}, {
      pageRole,
      documentType: materialType,
      visualTaste: tastes,
      tags,
      labels
    }),
    designSyntax: designSyntaxFor({
      industryFit,
      materialType,
      pageRole,
      tastes,
      renderType,
      layoutVariant,
      paletteIntent,
      proofObject: layoutVariant,
      tags
    }),
    industryFit,
    signals: compactUnique([...(base.signals || []), layoutVariant, renderType, ...industryFit, ...tags]),
    renderType,
    layoutVariant,
    themeIntent: overrides.themeIntent || themeIntentFor(renderType, layoutVariant, {}),
    paletteIntent,
    proofObject: layoutVariant,
    pageFamilies: suitablePageFamilies(renderType, layoutVariant),
    assetRole: overrides.assetRole || (renderType === 'case-gallery' ? 'gallery' : (renderType === 'cover' ? 'showcase' : 'none')),
    componentHints: componentHintsFor(renderType, layoutVariant, industryFit),
    usage: Object.assign({}, base.usage || {}, {
      useAs: 'derived-reference-design-grammar-only',
      notesZh: '由同一参考样本派生为相邻页面族的设计语法；只复用行业证据、页面角色和节奏，不复制源版式。'
    })
  });
}

function derivedRecipesForBase(base = {}) {
  const ids = new Set();
  const out = [];
  const add = (layoutVariant, renderType, overrides = {}) => {
    if (!layoutVariant || ids.has(layoutVariant) || base.layoutVariant === layoutVariant) return;
    ids.add(layoutVariant);
    out.push(derivedRecipe(base, layoutVariant, renderType, overrides));
  };
  const text = [
    base.id,
    base.layoutVariant,
    base.renderType,
    base.source && base.source.categoryId,
    base.source && base.source.documentId,
    base.source && base.source.sampleTitle,
    ...(base.industryFit || []),
    ...((base.taxonomy && base.taxonomy.tags) || []),
    ...((base.taxonomy && base.taxonomy.labels) || [])
  ].join(' ').toLowerCase();
  const isBeautyConsumer = /beauty|美妆|美容|brand|品牌|fashion|时尚|food|食物|食品|ec\b|retail|consumer/.test(text) ||
    (base.industryFit || []).includes('beauty-consumer') ||
    (base.industryFit || []).includes('brand-retail');
  const isPeople = /people|culture|recruit|human-resources|member|voice|团队|员工|成员|招聘|文化|人力/.test(text) ||
    (base.industryFit || []).includes('people-culture');
  const isIntegrated = /integrated|annual|sustainability|esg|report|综合报告|统合报告|年度报告/.test(text) ||
    (base.taxonomy && /integrated|annual/i.test(base.taxonomy.documentType || ''));
  const isFinance = /financial|finance|ir|quarter|q[1-4]|财务|业绩|投资者/.test(text) ||
    (base.industryFit || []).includes('finance-investment');
  const isExecutive = /executive|board|management|董事|管理层|高管|投委会/.test(text);

  if (isBeautyConsumer) {
    add('brand-world-and-business-proof', 'strategy-map', {
      pageRole: 'brand-world-business-proof',
      themeIntent: 'system-architecture',
      assetRole: 'showcase'
    });
    add('consumer-proof-photo-grid', 'case-gallery', {
      pageRole: 'consumer-scene-proof',
      themeIntent: 'case-evidence',
      assetRole: 'gallery'
    });
    add('product-evidence-story', 'case-gallery', {
      pageRole: 'product-evidence-story',
      themeIntent: 'case-evidence',
      assetRole: 'gallery'
    });
  }
  if (isPeople) {
    add('people-proof-mosaic', 'case-gallery', {
      pageRole: 'people-team-proof',
      themeIntent: 'case-evidence',
      assetRole: 'gallery'
    });
  }
  if (isIntegrated) {
    add('sustainability-proof-spread', 'case-gallery', {
      pageRole: 'sustainability-proof',
      themeIntent: 'case-evidence',
      assetRole: 'gallery'
    });
    add('materiality-matrix-board', 'risk-table', {
      pageRole: 'materiality-matrix',
      themeIntent: 'risk-warning'
    });
    add('governance-table-editorial', 'risk-table', {
      pageRole: 'governance-editorial-table',
      themeIntent: 'risk-warning'
    });
  }
  if (isFinance) {
    add('financial-kpi-snapshot', 'metric-comparison', {
      pageRole: 'financial-kpi-snapshot',
      themeIntent: 'value-signal'
    });
    add('chart-grid-with-commentary', 'metric-comparison', {
      pageRole: 'chart-grid-commentary',
      themeIntent: 'value-signal'
    });
    add('guidance-and-risk-board', 'risk-table', {
      pageRole: 'guidance-risk-board',
      themeIntent: 'risk-warning'
    });
  }
  if (isExecutive || isFinance || isIntegrated) {
    add('executive-proof-board', 'case-gallery', {
      pageRole: 'executive-proof-board',
      themeIntent: 'case-evidence',
      assetRole: 'gallery'
    });
  }
  return out;
}

function recipeFromSample(category, sample) {
  const tags = tagSlugs(sample);
  const labels = tagLabels(sample);
  const renderType = renderTypeFor(category, tags, labels);
  const layoutVariant = layoutVariantFor(category, renderType, tags, labels);
  const industryFit = industryFitFromTags(tags, labels);
  const materialType = materialTypeFromTags(tags);
  const themeIntent = themeIntentFor(renderType, layoutVariant, category);
  const paletteIntent = paletteIntentFor(tags, labels);
  const proofObject = proofObjectFor(category, renderType, layoutVariant, labels);
  const tastes = tasteFromTags(tags);
  const sourceSlug = slugify(sample.title || sample.source_url || 'sample');
  const id = compactUnique([
    category.kind,
    category.slug,
    layoutVariant || renderType,
    sourceSlug
  ]).join('--').slice(0, 140);
  return exposeRecipeSyntax({
    id,
    version: 'reference-recipe/v1',
    source: {
      kind: 'slideland-category-sample',
      categoryId: category.id,
      categoryLabelZh: category.label_zh,
      categoryLabelEn: category.label_en,
      sampleTitle: sample.title,
      sourceUrl: sample.source_url,
      thumbnailUrl: sample.thumbnail_url,
      slidelandUrl: category.slideland_url_zh,
      sourceHost: sourceHost(sample.source_url),
      selectionRank: sample.selection_rank || null
    },
    taxonomy: {
      group: category.kind,
      groupZh: category.group_zh,
      groupEn: category.group_en,
      categorySlug: category.slug,
      pageRole: pageRoleFromCategory(category, tags),
      documentType: materialType,
      visualTaste: tastes,
      tags,
      labels
    },
    designSyntax: designSyntaxFor({
      industryFit,
      materialType,
      pageRole: pageRoleFromCategory(category, tags),
      tastes,
      renderType,
      layoutVariant,
      paletteIntent,
      proofObject,
      tags
    }),
    industryFit,
    signals: compactUnique([category.id, category.slug, materialType, ...tags, ...labels, ...industryFit]),
    renderType,
    layoutVariant,
    themeIntent,
    paletteIntent,
    proofObject,
    pageFamilies: suitablePageFamilies(renderType, layoutVariant),
    assetRole: renderType === 'case-gallery' ? 'gallery' : (renderType === 'cover' ? 'showcase' : 'none'),
    componentHints: componentHintsFor(renderType, layoutVariant, industryFit),
    usage: {
      useAs: 'abstract-design-evidence-only',
      doNotCopy: ['exact layout', 'external images', 'logos', 'brand assets', 'verbatim source text'],
      notesZh: '只抽象行业、页面角色、证据语法、色彩语义和节奏，不复制具体页面。'
    },
    scores: scoreRecipe(category, sample, renderType, industryFit, tags, labels)
  });
}

function recipeFromDocument(doc = {}) {
  const id = `deep-dive--${doc.id}`;
  const docType = doc.doc_type || '';
  const isBeauty = /beauty|consumer|shiseido/i.test(`${doc.id} ${docType} ${doc.label}`);
  const isFinance = /financial|disclosure|q1|finance/i.test(`${doc.id} ${docType} ${doc.label}`);
  const isCulture = /culture|recruit|hrx|postas/i.test(`${doc.id} ${docType} ${doc.label}`);
  const isReport = /integrated|annual|report/i.test(`${doc.id} ${docType} ${doc.label}`);
  const industryFit = isBeauty ? ['beauty-consumer', 'brand-retail'] :
    (isFinance ? ['finance-investment'] :
      (isCulture ? ['people-culture'] : (isReport ? ['finance-investment', 'general-operations'] : ['general-operations'])));
  const renderType = isBeauty ? 'case-gallery' : (isFinance ? 'metric-comparison' : (isCulture ? 'manifesto' : 'strategy-map'));
  const layoutVariant = isBeauty ? 'brand-world-and-business-proof' :
    (isFinance ? 'quarterly-results-summary' : (isCulture ? 'culture-cover-with-soft-geometry' : 'value-creation-process-map'));
  const docPremium = isBeauty || isReport ? 90 : 80;
  const docIndustrySpecificity = isBeauty || isFinance || isCulture ? 88 : 74;
  const docImageEvidence = (doc.page_kind_counts && (doc.page_kind_counts['hero-image'] || doc.page_kind_counts['image-gallery'])) ? 82 : 58;
  const scores = {
    commercialPremium: docPremium,
    premiumLook: docPremium,
    dataPersuasion: isFinance || isReport ? 88 : 64,
    industryRecognition: docIndustrySpecificity,
    industrySpecificity: docIndustrySpecificity,
    imageEvidenceValue: docImageEvidence,
    imageEvidence: docImageEvidence,
    reusability: 76,
    copyrightSimilarityRisk: 42,
    overall: 82
  };
  return exposeRecipeSyntax({
    id,
    version: 'reference-recipe/v1',
    source: {
      kind: 'deep-dive-document',
      documentId: doc.id,
      sampleTitle: doc.label,
      sourceUrl: doc.source_url || '',
      localFile: doc.file || '',
      pages: doc.pages,
      aspectRatio: doc.aspect_ratio
    },
    taxonomy: {
      group: 'deep-dive',
      groupZh: '精读参考',
      groupEn: 'Deep-dive reference',
      documentType: docType,
      pageRole: isBeauty ? 'brand-editorial' : (isFinance ? 'financial-results' : (isCulture ? 'culture' : 'integrated-report')),
      visualTaste: isBeauty ? ['luxury', 'minimal'] : [],
      tags: compactUnique([docType, doc.id, ...(doc.design_takeaways || [])]),
      labels: [doc.label].filter(Boolean)
    },
    designSyntax: designSyntaxFor({
      industryFit,
      materialType: docType,
      pageRole: isBeauty ? 'brand-editorial' : (isFinance ? 'financial-results' : (isCulture ? 'culture' : 'integrated-report')),
      tastes: isBeauty ? ['luxury', 'minimal'] : [],
      renderType,
      layoutVariant,
      paletteIntent: isBeauty ? 'beauty-warm-premium' : (isFinance ? 'finance-slate' : 'japan-editorial-navy'),
      proofObject: layoutVariant,
      tags: compactUnique([docType, doc.id, ...(doc.design_takeaways || [])])
    }),
    industryFit,
    signals: compactUnique([doc.id, docType, renderType, layoutVariant, ...industryFit]),
    renderType,
    layoutVariant,
    themeIntent: isBeauty ? 'case-evidence' : (isFinance ? 'value-signal' : (isCulture ? 'industry-opening' : 'system-architecture')),
    paletteIntent: isBeauty ? 'beauty-warm-premium' : (isFinance ? 'finance-slate' : 'japan-editorial-navy'),
    proofObject: layoutVariant,
    pageFamilies: suitablePageFamilies(renderType, layoutVariant),
    assetRole: isBeauty || isCulture ? 'gallery' : 'none',
    componentHints: componentHintsFor(renderType, layoutVariant, industryFit),
    usage: {
      useAs: 'abstract-design-evidence-only',
      doNotCopy: ['exact layout', 'external images', 'logos', 'brand assets', 'verbatim source text'],
      notesZh: '精读样本只进入设计语法和 QA，不进入可复制模板。'
    },
    scores
  });
}

function build(sampler, analysis) {
  const categories = sampler.categories || [];
  const recipes = [];
  categories.forEach(category => {
    (category.samples || []).forEach(sample => {
      const base = recipeFromSample(category, sample);
      recipes.push(base, ...derivedRecipesForBase(base));
    });
  });
  (analysis.documents || []).forEach(doc => {
    const base = recipeFromDocument(doc);
    recipes.push(base, ...derivedRecipesForBase(base));
  });
  const byGroup = recipes.reduce((acc, recipe) => {
    const group = recipe.taxonomy.group || 'unknown';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});
  const byIndustry = recipes.reduce((acc, recipe) => {
    (recipe.industryFit || []).forEach(industry => {
      acc[industry] = (acc[industry] || 0) + 1;
    });
    return acc;
  }, {});
  const byRenderType = recipes.reduce((acc, recipe) => {
    acc[recipe.renderType] = (acc[recipe.renderType] || 0) + 1;
    return acc;
  }, {});
  return {
    name: 'premium-commercial-reference-recipe-library',
    version: '0.1.0',
    generatedAt: '2026-05-24T00:00:00+08:00',
    sourcePolicy: 'Reference-only abstraction. Do not copy source layouts, images, logos, brand assets, or text.',
    inputs: {
      sampler: path.relative(ROOT, path.resolve(DEFAULT_SAMPLER)),
      analysis: path.relative(ROOT, path.resolve(DEFAULT_ANALYSIS))
    },
    coverage: {
      recipeCount: recipes.length,
      byGroup,
      byIndustry,
      byRenderType
    },
    scoringDimensions: {
      commercialPremium: '商用高级感 / visual restraint and commercial polish inferred from tags/source class',
      premiumLook: 'visual restraint and commercial polish inferred from tags/source class',
      dataPersuasion: '数据说服力 / fit for metrics, charts, proof objects and business explanation',
      industryRecognition: '行业识别度 / how strongly the sample maps to a concrete industry or document type',
      industrySpecificity: 'how strongly the sample maps to a concrete industry or document type',
      imageEvidenceValue: '图片证据价值 / whether visual material can teach evidence/showcase/gallery grammar',
      imageEvidence: 'whether visual material can teach evidence/showcase/gallery grammar',
      reusability: '可复用程度 / category depth and ability to generalize safely',
      copyrightSimilarityRisk: '版权/相似风险 / higher means stricter distance from source composition is required'
    },
    recipes
  };
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    process.exit(0);
  }
  if (!fs.existsSync(opts.sampler)) throw new Error(`sampler not found: ${opts.sampler}`);
  const sampler = readJson(opts.sampler, { categories: [] });
  const analysis = readJson(opts.analysis, { documents: [] });
  const library = build(sampler, analysis);
  if (path.basename(opts.out) === 'reference-recipe-library.json') writeReferenceRecipeLibrary(opts.out, library);
  else writeJson(opts.out, library);
  console.log(JSON.stringify({ success: true, out: opts.out, coverage: library.coverage }, null, 2));
} catch (e) {
  usage();
  console.error(e.stack || e.message || e);
  process.exit(1);
}
