const {
  compactUnique,
  hasAny,
  textBlob
} = require('./common');
const {
  QUESTION_PRIORITY_RANK,
  addClarificationQuestion,
  defaultClarificationOptions
} = require('./clarification-options');
const {
  hasActualContact,
  looksExternalUse,
  modelClarificationCandidates,
  sourceInventoryValues
} = require('./clarification-signals');

function buildClarificationGate(bundle = {}, sourceAudit = {}, storyPlan = {}, options = {}) {
  const industry = storyPlan.industry || ((bundle.textSummary && bundle.textSummary.industryCandidates && bundle.textSummary.industryCandidates[0] || {}).industry) || 'general-operations';
  const missingInputs = compactUnique([
    sourceAudit.missing_inputs,
    sourceAudit.global_risks,
    sourceInventoryValues(sourceAudit, 'rights_risks'),
    storyPlan.missing_inputs,
    storyPlan.external_delivery_risks,
    (storyPlan.coverage_gaps || []),
    (storyPlan.visual_gaps || [])
  ]);
  const missingText = missingInputs.join(' ');
  const sourceText = (bundle.sources || []).map(s => s.text || s.name || '').join('\n');
  const storyText = textBlob(storyPlan);
  const allText = `${missingText} ${sourceText} ${storyText}`;
  const externalUse = options.external === true || looksExternalUse(storyPlan, sourceAudit, bundle);
  const questions = [];

  modelClarificationCandidates(storyPlan).forEach(q => addClarificationQuestion(questions, q));

  if ((externalUse && !hasActualContact(bundle, storyPlan)) || hasAny(missingText, [/联系人|联系方式|电话|手机|邮箱|官网|地址|二维码|contact/i])) {
    addClarificationQuestion(questions, {
      id: 'contact_block',
      priority: externalUse ? 'blocking' : 'recommended',
      category: 'external-readiness',
      kind: 'contact',
      question: '是否有可公开展示的联系人、电话、官网、地址或二维码？',
      why: '决定封底是否能做正式外发页；没有时只能做内审/沟通稿收束。',
      affects: ['closing', 'commercial-review', 'external-use'],
      fallbackChoice: 'omit'
    });
  }

  if (hasAny(allText, [/客户案例|客户名|客户名称|客户\s*logo|LOGO|logo|项目案例|典型项目|军工|轨交|中航|中车|中船|特斯拉|授权|脱敏/i])) {
    addClarificationQuestion(questions, {
      id: 'customer_case_authorization',
      priority: externalUse ? 'blocking' : 'recommended',
      category: 'evidence-authorization',
      kind: 'cases',
      question: '是否有可公开展示的客户案例、项目名称、客户 logo 或敏感行业案例授权？',
      why: '决定是否生成案例页、客户证据页或只做行业化脱敏表达。',
      affects: ['toc', 'case-gallery', 'evidence-board', 'commercial-risk'],
      fallbackChoice: 'desensitize'
    });
  }

  if (hasAny(allText, [/证书|资质|荣誉|专利|软著|编号|有效期|高新|专精特新|认证/i])) {
    addClarificationQuestion(questions, {
      id: 'certificate_details',
      priority: externalUse ? 'recommended' : 'optional',
      category: 'fact-hardness',
      kind: 'certificates',
      question: '是否能提供资质、证书、荣誉、专利或软著的名称、编号、年份、有效期和可用截图？',
      why: '决定是否生成资质页；缺少编号和有效期时不能写成强背书。',
      affects: ['qualification-page', 'fact-hardness', 'external-use'],
      fallbackChoice: 'summarize_only'
    });
  }

  const numberCount = ((bundle.textSummary && bundle.textSummary.numbers) || []).length;
  if (hasAny(missingText, [/数据|指标|口径|测算|KPI|OEE|MTTR|ARR|NRR|IRR|ROI|营收|收入|成本|转化|留存|复购|产能|良率/i]) || (numberCount < 2 && hasAny(storyText, [/solution|report|investor|方案|汇报|路演|复盘/i]))) {
    addClarificationQuestion(questions, {
      id: 'metric_basis',
      priority: 'recommended',
      category: 'data-proof',
      kind: 'metrics',
      question: '是否有真实指标、计算口径、前后对比或目标值可以作为数据页依据？',
      why: '决定是否生成数据说服页；没有依据时改用定性逻辑链或结构图。',
      affects: ['metric-board', 'data-component', 'value-signal'],
      fallbackChoice: 'qualitative'
    });
  }

  const imageCount = (bundle.images || []).length;
  const imageSensitiveIndustry = /manufacturing|energy|park|retail|beauty|consumer|healthcare|real-estate|education/i.test(industry);
  if (!imageCount && (imageSensitiveIndustry || hasAny(missingText, [/现场图|产品图|设备图|截图|界面|证书图|照片|图片|素材/i]))) {
    addClarificationQuestion(questions, {
      id: 'visual_evidence_assets',
      priority: imageSensitiveIndustry ? 'recommended' : 'optional',
      category: 'visual-evidence',
      kind: 'visuals',
      question: '是否有真实现场图、产品图、界面截图、证书截图或案例图片可用？',
      why: '决定是否生成图片证据页；缺少真实图时不使用生成图冒充证据。',
      affects: ['cover', 'evidence-board', 'case-gallery', 'visual-router'],
      fallbackChoice: 'use_solid'
    });
  } else if (imageCount && hasAny(`${missingText} ${textBlob(sourceAudit)}`, [/图片.*授权|素材.*授权|来源|版权|rights|license|unknown/i])) {
    addClarificationQuestion(questions, {
      id: 'asset_rights',
      priority: externalUse ? 'blocking' : 'recommended',
      category: 'asset-rights',
      kind: 'visuals',
      question: '现有图片、截图、logo 或证书素材是否允许用于这次 PPT 外发？',
      why: '决定图片能否作为证据；授权不明时需要降级为内审或移除。',
      affects: ['visual-evidence', 'asset-rights', 'external-use'],
      fallbackChoice: 'use_solid'
    });
  }

  if (!storyPlan.audience || !storyPlan.decision_goal) {
    addClarificationQuestion(questions, {
      id: 'audience_decision_goal',
      priority: 'recommended',
      category: 'story-architecture',
      kind: 'audience',
      question: '这份 PPT 的主要受众和希望推动的决策是什么？',
      why: '决定目录顺序、证据密度、结尾动作和风险页是否出现。',
      affects: ['outline', 'claim-spine', 'closing'],
      fallbackChoice: 'internal_alignment'
    });
  }

  if (/beauty|consumer|brand-retail/i.test(industry)) {
    if (!imageCount && !hasAny(allText, [/产品图|包装图|质地|门店|柜台|场景图|小红书|天猫|直播|达人|截图/i])) {
      addClarificationQuestion(questions, {
        id: 'beauty_real_visual_assets',
        priority: 'recommended',
        category: 'beauty-evidence',
        kind: 'visuals',
        question: '是否有真实产品图、包装图、质地特写、柜台/门店图或平台截图？',
        why: '美妆经营报告需要可检查的产品和消费者证据；没有真实图时生成图只能做示意氛围。',
        affects: ['cover', 'sku-proof', 'consumer-proof-gallery', 'industry-fit'],
        fallbackChoice: 'abstract_only'
      });
    }
    if (!hasAny(allText, [/销售额|渠道|客单|复购|会员|转化|GMV|成交|直播|活动|天猫|抖音|小红书/i])) {
      addClarificationQuestion(questions, {
        id: 'beauty_operating_metrics',
        priority: 'recommended',
        category: 'beauty-operating-data',
        kind: 'metrics',
        question: '是否有销售额、渠道占比、客单价、复购率、会员数、转化率或活动表现数据？',
        why: '决定是否生成经营数据页；没有数据时只能保留品牌和证据结构，不写数字承诺。',
        affects: ['channel-mix', 'member-growth-board', 'activity-funnel'],
        fallbackChoice: 'qualitative'
      });
    }
  }

  const maxQuestions = Number(options.maxQuestions || 6);
  const sortedQuestions = questions
    .sort((a, b) => (QUESTION_PRIORITY_RANK[a.priority] ?? 1) - (QUESTION_PRIORITY_RANK[b.priority] ?? 1))
    .slice(0, maxQuestions);
  const unresolvedBlocking = sortedQuestions.filter(q => q.priority === 'blocking');

  return {
    version: 'material-clarification-gate/v1',
    status: unresolvedBlocking.length ? 'needs_user_input' : (sortedQuestions.length ? 'ready_with_assumptions' : 'ready'),
    industry,
    pptType: storyPlan.ppt_type || '',
    externalUse,
    canContinueWithoutAnswers: unresolvedBlocking.length === 0,
    fallbackStrategy: unresolvedBlocking.length
      ? 'Ask the user to choose an option for blocking questions before external-delivery extraction; if they decline, continue only as an internal/conservative draft.'
      : 'Continue with conservative assumptions for unanswered recommended questions and keep missing facts out of visible slides.',
    missingInputSummary: missingInputs.slice(0, 12),
    questions: sortedQuestions
  };
}

function normalizeClarificationAnswers(raw = {}) {
  const values = raw.answers || raw;
  if (Array.isArray(values)) {
    return new Map(values.map(answer => [answer.id || answer.question_id || answer.questionId, answer]).filter(([id]) => id));
  }
  if (values && typeof values === 'object') {
    return new Map(Object.entries(values).map(([id, answer]) => [id, typeof answer === 'string' ? { id, choice: answer } : Object.assign({ id }, answer)]));
  }
  return new Map();
}

function applyClarificationAnswers(gate = {}, rawAnswers = {}) {
  const answers = normalizeClarificationAnswers(rawAnswers);
  const questions = (gate.questions || []).map(question => {
    const answer = answers.get(question.id);
    if (!answer) return Object.assign({}, question, { resolved: false });
    return Object.assign({}, question, {
      resolved: true,
      answer: {
        choice: answer.choice || answer.option || answer.selected_option || '',
        value: answer.value || answer.note || answer.text || '',
        providedBy: answer.providedBy || 'user'
      }
    });
  });
  const unresolvedBlocking = questions.filter(q => q.priority === 'blocking' && !q.resolved);
  return Object.assign({}, gate, {
    status: unresolvedBlocking.length ? 'needs_user_input' : 'ready',
    canContinueWithoutAnswers: unresolvedBlocking.length === 0,
    questions,
    userAnswerCount: questions.filter(q => q.resolved).length
  });
}

module.exports = {
  applyClarificationAnswers,
  buildClarificationGate,
  defaultClarificationOptions,
  normalizeClarificationAnswers
};
