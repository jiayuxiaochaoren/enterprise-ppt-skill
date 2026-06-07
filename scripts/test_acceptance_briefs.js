const assert = require('assert/strict');
const { acceptanceAudit, normalizeDeckPlan } = require('./design-system');
const { industryAcceptanceBriefs } = require('./industry_acceptance_matrix');

const briefs = industryAcceptanceBriefs();
assert.equal(briefs.length, 8, 'full acceptance matrix should cover 8 industry briefs');
assert.deepEqual(
  briefs.map(brief => brief.label),
  [
    '金融 / 财报 / 投资者关系',
    '制造 / 工业 / 能源',
    '美妆 / 消费品牌 / 零售',
    'SaaS / AI / 科技服务',
    '医疗 / 护理 / 健康',
    '食品 / 文旅 / 时尚',
    '政府 / 园区 / 国企汇报',
    '招聘 / 文化 / 公司介绍'
  ]
);

briefs.forEach(brief => {
  const plan = brief.plan;
  const normalized = normalizeDeckPlan(plan);
  assert.ok(normalized.slides.length >= 8 && normalized.slides.length <= 12, `${brief.slug} should be an 8-12 page acceptance deck`);
  const audit = acceptanceAudit(plan, normalized);
  assert.deepEqual(
    audit.checks.map(check => check.id),
    [
      'report-depth',
      'evidence',
      'page-count',
      'component-plan',
      'chart-semantic',
      'chart-visual',
      'chart-evidence',
      'chart-gate',
      'industry-customization',
      'layout-repetition',
      'semantic-color',
      'image-evidence'
    ]
  );
  assert.equal(audit.checks.some(check => check.status === 'fail'), false, `${brief.slug} should not have failing acceptance QA`);
  assert.ok(normalized.slides.some(slide => slide.referenceRecipe || (slide.compositionPlan && slide.compositionPlan.referenceRecipeId)), `${brief.slug} should use reference recipe context`);
});

console.log('acceptance briefs ok');
