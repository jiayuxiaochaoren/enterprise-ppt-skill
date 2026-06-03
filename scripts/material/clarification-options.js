const QUESTION_PRIORITY_RANK = { blocking: 0, recommended: 1, optional: 2 };

function defaultClarificationOptions(kind = 'generic') {
  const choices = {
    contact: [
      { id: 'provide', label: '提供联系方式', effect: '封底可生成正式外发联系区。' },
      { id: 'omit', label: '暂不提供', effect: '封底改为内审/沟通稿收束，不编造联系人。' },
      { id: 'use_next_steps', label: '只写下一步', effect: '用明确行动项替代联系人。' }
    ],
    cases: [
      { id: 'provide_named', label: '提供公开案例', effect: '可以生成客户/项目证据页。' },
      { id: 'desensitize', label: '脱敏使用', effect: '只写行业、场景、交付范围，不展示客户名或 logo。' },
      { id: 'skip', label: '跳过案例页', effect: '目录和正文不承诺案例证据。' }
    ],
    certificates: [
      { id: 'provide', label: '提供证书信息', effect: '可以生成资质/荣誉页。' },
      { id: 'summarize_only', label: '只做概括', effect: '只写能力背书，不写编号、有效期或数量。' },
      { id: 'skip', label: '跳过资质页', effect: '目录和正文不承诺资质证据。' }
    ],
    metrics: [
      { id: 'provide', label: '提供真实数据', effect: '可以生成指标、对比、漏斗或 scorecard 页面。' },
      { id: 'qualitative', label: '用定性表达', effect: '保留业务逻辑链，不写未验证数字。' },
      { id: 'skip_data_page', label: '跳过数据页', effect: '用流程、架构或行动计划替代。' }
    ],
    visuals: [
      { id: 'provide_assets', label: '提供真实图片', effect: '可生成现场/产品/截图证据页。' },
      { id: 'use_solid', label: '不用图片', effect: '使用纯色结构和 proof object，避免装饰图。' },
      { id: 'abstract_only', label: '只允许抽象图', effect: '生成图只用于氛围背景，不冒充真实证据。' }
    ],
    audience: [
      { id: 'external_sales', label: '客户销售/对外', effect: '提高外发合规、案例授权和联系方式门槛。' },
      { id: 'management_review', label: '管理层汇报', effect: '强化决策目标、指标和风险保障。' },
      { id: 'internal_alignment', label: '内部对齐', effect: '可使用保守表达和内部行动项。' }
    ],
    generic: [
      { id: 'provide', label: '补充材料', effect: '把补充内容作为事实来源继续生成。' },
      { id: 'skip', label: '暂不补充', effect: '从可见 PPT 中移除相关承诺。' },
      { id: 'conservative', label: '保守表达', effect: '只写已确认事实和假设边界。' }
    ]
  };
  return choices[kind] || choices.generic;
}

function addClarificationQuestion(questions, q) {
  if (!q || !q.id || questions.some(existing => existing.id === q.id)) return;
  const priority = q.priority || 'recommended';
  questions.push({
    id: q.id,
    priority: QUESTION_PRIORITY_RANK[priority] == null ? 'recommended' : priority,
    category: q.category || 'missing-input',
    question: q.question,
    why: q.why || '',
    affects: Array.isArray(q.affects) ? q.affects : [],
    options: Array.isArray(q.options) && q.options.length ? q.options : defaultClarificationOptions(q.kind),
    fallbackChoice: q.fallbackChoice || 'conservative',
    source: q.source || 'deterministic-gate'
  });
}

module.exports = {
  QUESTION_PRIORITY_RANK,
  addClarificationQuestion,
  defaultClarificationOptions
};
