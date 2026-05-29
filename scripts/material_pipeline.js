const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const {
  INDUSTRY_PACK_LIBRARY,
  REFERENCE_RECIPE_LIBRARY,
  assetAuthorizationGate,
  imageDimensions,
  imageQualityProfile,
  industryBenchmarksFor,
  industryMatchIds,
  industryPackFor,
  inferDeckLanguage,
  languagePolicyFor,
  normalizeDeckPlan,
  slideContentOverlap
} = require('./design-system');

const TEXT_EXTS = new Set(['.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.yaml', '.yml']);
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg']);
const OFFICE_EXTS = new Set(['.pptx', '.docx', '.xlsx']);

const INDUSTRY_HINTS = {
  'manufacturing-operations': ['制造', '产线', '设备', '点检', '工单', 'OEE', 'MTTR', 'MTBF', '备件', '停机', '故障'],
  'finance-investment': ['基金', '投资', '投委会', 'IRR', 'DPI', 'TVPI', 'MOIC', '估值', '退出', '组合', 'LP', 'GP'],
  'healthcare-operations': ['医疗', '患者', '护理', '门诊', '检查', '质控', '随访', '交接', '病区'],
  'brand-retail': ['零售', '品牌', '门店', 'SKU', '商品', '会员', '复购', 'lookbook', '陈列', '搭配'],
  'energy-utility': ['能源', '电站', '储能', '光伏', 'SOC', 'PCS', 'BMS', '负荷', '告警', '调度'],
  'saas-technology': ['SaaS', '平台', 'API', 'SSO', '工作流', '自动化', '审计日志', '激活', '留存', 'NRR', 'ARR']
};

const INDUSTRY_ID_OPTIONS = compactUnique([
  ...Object.keys(INDUSTRY_HINTS),
  ...(INDUSTRY_PACK_LIBRARY.packs || []).map(pack => pack.id)
]);

const BAD_VISIBLE_COPY_PATTERNS = [
  /材料显示/,
  /材料中(?:明确)?(?:提到|写到|列出|包含|展示|指出|说明)/,
  /材料列出/,
  /公司材料列出/,
  /原材料(?:未|没|没有|中)/,
  /企业\s*PDF/i,
  /PDF\s*简介口径/i,
  /正式交付前/,
  /图册页优先/,
  /该页用于/,
  /该页只展示/,
  /第二页先/,
  /后续页面/,
  /后续再/,
  /本页仅/,
  /证明页优先/,
  /对比页优先/,
  /测试\s*closing/i,
  /正式结束页用于/,
  /模型抽取/,
  /用户材料自动整理/,
  /适合[^，。；\n]{0,18}材料/
];

const MATERIAL_CONTAMINATION_PATTERNS = [
  ...BAD_VISIBLE_COPY_PATTERNS,
  /deck\s*plan/i,
  /proof\s*object/i,
  /page\s*family/i,
  /layout\s*variant/i,
  /slide\s*\d+/i,
  /页面族/,
  /版式(?:策略|说明|选择|路由)/,
  /视觉\s*QA/i,
  /生成(?:稿|链路|脚本)/,
  /制作(?:备注|说明|口径|建议)/,
  /验收(?:点|规则|用例)/,
  /交付说明/,
  /请(?:补充|确认).*?(不要|不应|不能).*?PPT/,
  /本页(?:用于|只|仅|建议)/,
  /第[一二三四五六七八九十0-9]+页(?:先|用于|建议)/
];

const QUESTION_PRIORITY_RANK = { blocking: 0, recommended: 1, optional: 2 };

function hasBadVisibleCopy(text = '') {
  return BAD_VISIBLE_COPY_PATTERNS.some(re => re.test(String(text || '')));
}

function cleanPublicNote(text = '') {
  const value = String(text || '').trim();
  return hasBadVisibleCopy(value) ? '' : value;
}

function classifyMaterialLine(line = '') {
  const text = String(line || '').trim();
  if (!text) return { line: text, contaminated: false, reasons: [] };
  const reasons = MATERIAL_CONTAMINATION_PATTERNS
    .filter(re => re.test(text))
    .map(re => String(re).replace(/^\/|\/[a-z]*$/g, ''));
  return { line: text, contaminated: reasons.length > 0, reasons };
}

function sanitizeMaterialText(text = '') {
  const raw = String(text || '').replace(/\u0000/g, '');
  const lines = raw.split(/\r?\n/);
  const removed = [];
  const kept = [];
  lines.forEach((line, index) => {
    const classified = classifyMaterialLine(line);
    if (classified.contaminated) {
      removed.push({ lineNumber: index + 1, text: classified.line.slice(0, 180), reasons: classified.reasons.slice(0, 3) });
    } else {
      kept.push(line);
    }
  });
  return {
    rawText: raw,
    cleanText: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    hygiene: {
      removedLineCount: removed.length,
      removedSample: removed.slice(0, 12)
    }
  };
}

function usageError(message) {
  const err = new Error(message);
  err.usage = true;
  throw err;
}

function ensureDirFor(file) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
}

function writeJson(file, value) {
  ensureDirFor(file);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function collectFiles(inputs = []) {
  const files = [];
  inputs.forEach(input => {
    const p = path.resolve(input);
    if (!fs.existsSync(p)) usageError(`input not found: ${input}`);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      fs.readdirSync(p).sort().forEach(name => {
        if (name.startsWith('.')) return;
        files.push(...collectFiles([path.join(p, name)]));
      });
    } else if (stat.isFile()) {
      files.push(p);
    }
  });
  return files;
}

function decodeXmlEntities(s = '') {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlTextValues(xml = '') {
  return [...String(xml).matchAll(/<[^:>]*:?t\b[^>]*>([\s\S]*?)<\/[^:>]*:?t>/g)]
    .map(m => decodeXmlEntities(m[1].replace(/<[^>]+>/g, '')))
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function unzipList(file) {
  try {
    return cp.execFileSync('unzip', ['-Z1', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function unzipEntry(file, entry) {
  try {
    return cp.execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 16 });
  } catch (_) {
    return '';
  }
}

function extractOfficeText(file) {
  const ext = path.extname(file).toLowerCase();
  const entries = unzipList(file);
  if (!entries.length) return { text: '', method: 'office-unzip-missing' };
  let selected = [];
  if (ext === '.pptx') selected = entries.filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e)).sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));
  else if (ext === '.docx') selected = entries.filter(e => e === 'word/document.xml' || /^word\/header\d+\.xml$/.test(e) || /^word\/footer\d+\.xml$/.test(e));
  else if (ext === '.xlsx') selected = entries.filter(e => e === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(e));
  const parts = selected.map(entry => xmlTextValues(unzipEntry(file, entry)).join('\n')).filter(Boolean);
  return { text: parts.join('\n\n'), method: `office-${ext.slice(1)}` };
}

function extractPdfText(file) {
  try {
    const text = cp.execFileSync('pdftotext', [file, '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 16 });
    return { text, method: 'pdftotext' };
  } catch (_) {
    const pythonCandidates = [
      process.env.PYTHON,
      process.env.PYTHON3,
      path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'),
      'python3',
      'python'
    ].filter(Boolean);
    const code = [
      'import sys',
      'from pypdf import PdfReader',
      'reader = PdfReader(sys.argv[1])',
      'parts = []',
      'for i, page in enumerate(reader.pages):',
      '    text = page.extract_text() or ""',
      '    if text.strip():',
      '        parts.append(f"--- PDF Page {i + 1} ---\\n{text}")',
      'sys.stdout.write("\\n\\n".join(parts))'
    ].join('\n');
    for (const python of pythonCandidates) {
      try {
        const text = cp.execFileSync(python, ['-c', code, file], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          maxBuffer: 1024 * 1024 * 64
        });
        if (String(text || '').trim()) return { text, method: 'pypdf' };
      } catch (_) {
        // Try the next Python candidate.
      }
    }
    return { text: '', method: 'pdf-unsupported' };
  }
}

function fileKind(file) {
  const ext = path.extname(file).toLowerCase();
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (TEXT_EXTS.has(ext)) return 'text';
  if (OFFICE_EXTS.has(ext)) return 'office';
  if (ext === '.pdf') return 'pdf';
  return 'unsupported';
}

function splitChunks(text = '', maxChars = 1200) {
  const clean = String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
  if (!clean) return [];
  const paras = clean.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const chunks = [];
  let buf = '';
  paras.forEach(p => {
    if ((buf + '\n\n' + p).length > maxChars && buf) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  });
  if (buf) chunks.push(buf);
  return chunks.map((chunk, i) => ({ id: `chunk-${String(i + 1).padStart(3, '0')}`, text: chunk }));
}

function classifyImageRole(file, profile = imageQualityProfile(file)) {
  const name = path.basename(file).toLowerCase();
  if (/before|after|对比|改造|升级/.test(name)) return 'comparison';
  if (/screen|截图|ui|dashboard|界面|prototype/.test(name) || profile.category === 'screenshot') return 'evidence';
  if (/product|产品|设备|hero|detail|单品/.test(name)) return 'showcase';
  if (profile.category === 'vertical') return 'evidence';
  return 'gallery';
}

function detectIndustry(text = '') {
  const packHints = (INDUSTRY_PACK_LIBRARY.packs || []).reduce((acc, pack) => {
    acc[pack.id] = compactUnique([
      pack.labelZh,
      pack.labelEn,
      ...(pack.aliases || []),
      ...(pack.proofObjects || []),
      ...(pack.pageFamilies || [])
    ]);
    return acc;
  }, {});
  const hints = Object.assign({}, packHints, INDUSTRY_HINTS);
  const scores = Object.entries(hints).map(([industry, words]) => {
    const lower = String(text || '').toLowerCase();
    const hits = words.filter(w => lower.includes(String(w).toLowerCase()));
    return { industry, score: hits.length, hits };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  return scores;
}

function extractNumbers(text = '') {
  const matches = String(text || '').match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|万元|亿元|人|件|台|MW|MWh|分钟|min|天|月|年)?/g) || [];
  return [...new Set(matches)].slice(0, 80);
}

function conciseLines(text = '', max = 18) {
  return String(text || '')
    .split(/\r?\n/)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s.length >= 8)
    .filter(s => !/^[-*#>`\s]+$/.test(s))
    .slice(0, max);
}

function ingestMaterials(inputs = [], options = {}) {
  if (!inputs.length) usageError('no input materials provided');
  const root = options.root ? path.resolve(options.root) : process.cwd();
  const maxCharsPerSource = Number(options.maxCharsPerSource || 9000);
  const files = collectFiles(inputs);
  const sources = [];
  const images = [];
  let sourceSeq = 1;

  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    const kind = fileKind(file);
    const rel = path.relative(root, file);
    const id = `src-${String(sourceSeq++).padStart(3, '0')}`;
    if (kind === 'image') {
      const profile = imageQualityProfile(file);
      const dims = imageDimensions(file);
      const image = {
        id,
        kind: 'image',
        path: file,
        relativePath: rel,
        name: path.basename(file),
        extension: ext,
        dimensions: dims,
        qualityProfile: profile,
        suggestedRole: classifyImageRole(file, profile)
      };
      images.push(image);
      sources.push(image);
      return;
    }

    let extracted = { text: '', method: kind };
    if (kind === 'text') extracted = { text: fs.readFileSync(file, 'utf8'), method: 'plain-text' };
    else if (kind === 'office') extracted = extractOfficeText(file);
    else if (kind === 'pdf') extracted = extractPdfText(file);

    const sanitized = sanitizeMaterialText(extracted.text || '');
    const text = sanitized.cleanText.slice(0, maxCharsPerSource);
    sources.push({
      id,
      kind,
      path: file,
      relativePath: rel,
      name: path.basename(file),
      extension: ext,
      extractionMethod: extracted.method,
      rawCharCount: sanitized.rawText.length,
      charCount: text.length,
      materialHygiene: sanitized.hygiene,
      text,
      chunks: splitChunks(text),
      candidateFacts: conciseLines(text),
      numbers: extractNumbers(text)
    });
  });

  const allText = sources.map(s => s.text || '').join('\n\n');
  const industryCandidates = detectIndustry(allText);
  return {
    version: 'material-bundle/v1',
    generatedAt: new Date().toISOString(),
    root,
    sourceCount: sources.length,
    sources,
    images,
    textSummary: {
      charCount: allText.length,
      industryCandidates,
      numbers: extractNumbers(allText).slice(0, 40),
      candidateFacts: conciseLines(allText, 30)
    },
    modelContract: {
      expectedExtractionVersion: 'material-extraction/v1',
      materialHygiene: 'source text has been filtered for previous-deck production notes; removed samples are metadata, not source facts',
      nextStep: 'For complex or externally delivered materials, run scripts/material_orchestration_prompt.js for source-audit and story-architecture, run scripts/material_clarification_gate.js before extraction when inputs are missing, then continue extraction and critic stages; scripts/material_model_prompt.js is only a tiny-material compatibility path'
    }
  };
}

function textBlob(value = '') {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textBlob).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${k} ${textBlob(v)}`)
      .filter(Boolean)
      .join(' ');
  }
  return String(value || '');
}

function compactUnique(values = []) {
  const out = [];
  const seen = new Set();
  values.flatMap(v => Array.isArray(v) ? v : [v]).forEach(value => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    out.push(text);
  });
  return out;
}

function hasAny(text = '', patterns = []) {
  const value = String(text || '');
  return patterns.some(re => re.test(value));
}

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

function sourceInventoryValues(sourceAudit = {}, field) {
  return (sourceAudit.source_inventory || [])
    .flatMap(src => Array.isArray(src && src[field]) ? src[field] : [])
    .filter(Boolean);
}

function modelClarificationCandidates(storyPlan = {}) {
  const raw = storyPlan.clarification_candidates || storyPlan.clarificationCandidates || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => ({
    id: item.id || `model_candidate_${String(i + 1).padStart(2, '0')}`,
    priority: item.priority || 'recommended',
    category: item.category || 'story-architecture',
    question: item.question || item.missing_input || item.missingInput || `请补充：${item.title || item.label || `信息 ${i + 1}`}`,
    why: item.why || item.reason || textBlob(item.affects) || '',
    affects: Array.isArray(item.affects) ? item.affects : compactUnique([item.section, item.slide, item.proof_object]),
    options: item.options,
    fallbackChoice: item.fallback_strategy || item.fallbackChoice || 'conservative',
    source: 'story-architecture'
  }));
}

function looksExternalUse(storyPlan = {}, sourceAudit = {}, bundle = {}) {
  const text = textBlob({
    pptType: storyPlan.ppt_type,
    audience: storyPlan.audience,
    decisionGoal: storyPlan.decision_goal,
    risks: storyPlan.external_delivery_risks,
    auditRisks: sourceAudit.global_risks,
    sourceText: (bundle.sources || []).map(s => s.text || s.name || '').join('\n')
  });
  return hasAny(text, [/对外|外发|客户|销售|投标|招商|展会|官网|宣传|公司介绍|企业介绍|能力介绍|采购|合作/i]);
}

function hasActualContact(bundle = {}, storyPlan = {}) {
  const text = textBlob({
    contacts: storyPlan.contacts,
    sourceText: (bundle.sources || []).map(s => s.text || '').join('\n')
  });
  return hasAny(text, [
    /[\w.+-]+@[\w.-]+\.\w+/i,
    /(?:电话|手机|Tel|Phone)[:：]?\s*[+\d][\d\s-]{5,}/i,
    /(?:https?:\/\/|www\.)[^\s，。；]+/i,
    /(?:官网|地址|联系人)[:：]\s*[^，。；\n]{3,}/i
  ]);
}

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

function extractionSchema() {
  const industryOptions = INDUSTRY_ID_OPTIONS.join(' | ');
  return {
    version: 'material-extraction/v1',
    document: {
      title: 'deck title from materials',
      subtitle: 'one-sentence value proposition',
      ppt_type: 'solution | report | company-intro | investor | training | review',
      industry: industryOptions,
      language: 'target visible language, e.g. zh-CN for Chinese decks',
      organization: 'only if explicit in materials',
      audience: 'target audience',
      date: 'only if explicit in materials',
      requested_slide_count: 'optional user requested page count, e.g. 8 | 12 | 20',
      contacts: ['contact person, phone, email, website, address, or QR code only if explicit in materials'],
      decision_goal: 'what the deck should help decide'
    },
    visible_language_policy: {
      language: 'zh-CN',
      localize_non_essential_microcopy: true,
      preserve_terms: ['brand names, product names, URLs, emails, stock tickers, standard acronyms such as API/OEE/IRR/SKU']
    },
    clarifications: [
      { id: 'contact_block', choice: 'provide | omit | conservative', value: 'user supplied fact or chosen fallback', effect: 'how this answer changes deck planning' }
    ],
    facts: [
      { id: 'fact-001', text: 'verifiable fact from source', source_ids: ['src-001'], source_pages: { 'src-001': 12 }, source_excerpts: { 'src-001': 'short original excerpt' }, confidence: 0.9 }
    ],
    evidence: [
      { id: 'ev-001', type: 'metric | image | screenshot | quote | table | case | risk | process | sku | texture | efficacy | channel | member | repurchase | social | packaging | review', title: 'evidence label', summary: 'what it proves', source_ids: ['src-001'], page: 12, excerpt: 'short original excerpt', asset_source_id: 'src-002', provenance: 'real-source-evidence | model-generated-illustration | user-supplied | public-source', authorization_status: 'cleared | internal-only | needs authorization | unknown | blocked' }
    ],
    deck_art_direction: {
      tone: 'premium-industrial-editorial | executive-boardroom | calm-clinical | capital-governance | product-platform',
      palette: 'recommended palette id, e.g. factory-steel-amber',
      semantic_color_roles: {
        brand: 'brand or industry identity color role',
        evidence: 'proof, caption, source, image evidence role',
        risk: 'problem, constraint, compliance role',
        action: 'next-step, path, decision role',
        data: 'metric, chart, value signal role',
        neutral: 'background, text, rule role'
      },
      layout_diversity_rules: ['avoid repeating the same card/grid composition across adjacent body slides'],
      rhythm_map: [
        {
          slideId: 'claim-001',
          themeIntent: 'industry-opening | navigation-map | diagnosis | risk-warning | case-evidence | system-architecture | value-signal | operating-path | company-proof | closing-anchor',
          accentRole: 'brand | evidence | risk | action | data | neutral',
          backgroundTone: 'dark-stage | tinted-paper | accent-wash',
          layoutEnergy: 'hero | calm | structured | high-contrast | editorial-dense',
          visualDensity: 'balanced | dense | metric-led | image-led',
          rhythmTransition: 'start | continue | turning-point | proof-anchor | structure-shift | return-to-anchor'
        }
      ]
    },
    claim_spine: [
      {
        id: 'claim-001',
        narrative_role: 'setup | diagnosis | evidence | proof | solution | operating-model | governance | decision',
        claim: 'slide-title-grade assertion',
        support: 'short supporting sentence',
        proof_object: 'downtime-pareto | valuation-sensitivity | quality-handoff | member-cohort-ladder | channel-efficiency-matrix | monthly-pulse-trend | waterfall-bridge | dispatch-map | adoption-funnel | service-blueprint | platform-capability-map | production-topology | finance-bridge | portfolio-table | risk-matrix | responsibility-loop | lookbook | case-comparison | metric-board | report-board',
        evidence_ids: ['ev-001'],
        source_ids: ['src-001'],
        source_pages: { 'src-001': 12 },
        source_excerpts: { 'src-001': 'short original text excerpt supporting this claim' },
        business_logic: {
          current_state: 'what is happening now',
          impact: 'business/customer/operating consequence',
          cause: 'why it happens or what drives it',
          action: 'what will be changed or executed',
          metric: 'how success will be measured'
        },
        data_component: 'comparison | funnel | root-cause-matrix | journey-breakpoint | before-after | heatmap | milestone | scorecard | scatter-bubble | trend-line | waterfall-bridge | progress-tracker',
        layoutVariant: 'recommended page-family variant from reference_recipe_plan',
        componentHints: ['renderer components such as metric-strip, caption-bar, source-note'],
        componentPlan: {
          components: [
            { id: 'hero-image | kpi-strip | caption-bar | commentary-panel | proof-gallery | risk-matrix | value-chain | product-matrix | source-note', required: true, role: 'what this component proves' }
          ]
        },
        referenceRecipeIds: ['reference recipe ids used for this page'],
        asset_requirements: [
          { role: 'evidence | product | site | screenshot | background', required: true, provenance: 'source id or user-supplied asset needed' }
        ],
        source_note: 'short visible source/provenance note when required',
        theme_intent: 'page-level theme intent from deck_art_direction.rhythm_map',
        accent_role: 'semantic accent role for the page',
        layout_energy: 'hero | calm | structured | high-contrast | editorial-dense',
        visual_density: 'balanced | dense | metric-led | image-led',
        rhythm_transition: 'continue | turning-point | proof-anchor | structure-shift',
        bullets: ['short point'],
        metrics: [{ label: 'metric name', value: '64%', note: 'source context' }],
        visuals: [{ source_id: 'src-002', role: 'evidence', caption: 'why this image matters', provenance: 'screenshot/image provenance', authorization_status: 'cleared | internal-only | needs authorization | unknown | blocked' }],
        data: {},
        confidence: 0.85
      }
    ],
    asset_rights: 'user-owned | public with attribution | needs authorization | unknown',
    commercial_risks: ['customer-name authorization, military/project desensitization, certificate validity, image source, font/license risk'],
    missing_info: ['facts that should be requested from user, not invented']
  };
}

function bundleForPrompt(bundle = {}) {
  return {
    version: bundle.version,
    sourceCount: bundle.sourceCount,
    textSummary: bundle.textSummary,
    sources: (bundle.sources || []).map(src => {
      if (src.kind === 'image') {
        return {
          id: src.id,
          kind: src.kind,
          name: src.name,
          relativePath: src.relativePath,
          suggestedRole: src.suggestedRole,
          dimensions: src.dimensions,
          qualityProfile: src.qualityProfile
        };
      }
      return {
        id: src.id,
        kind: src.kind,
        name: src.name,
        relativePath: src.relativePath,
        extractionMethod: src.extractionMethod,
        materialHygiene: src.materialHygiene,
        candidateFacts: src.candidateFacts,
        numbers: src.numbers,
        chunks: (src.chunks || []).slice(0, 10)
      };
    })
  };
}

function referenceContextForPrompt(bundle = {}, options = {}) {
  const industry = options.industry ||
    (options.storyPlan && options.storyPlan.industry) ||
    ((bundle.textSummary && bundle.textSummary.industryCandidates && bundle.textSummary.industryCandidates[0] || {}).industry) ||
    'general-operations';
  const ids = new Set(industryMatchIds(industry));
  const pack = industryPackFor(industry);
  const benchmarks = industryBenchmarksFor(industry).slice(0, 5);
  const recipes = (REFERENCE_RECIPE_LIBRARY.recipes || [])
    .filter(recipe => (recipe.industryFit || []).some(id => ids.has(id)))
    .sort((a, b) => ((b.scores && b.scores.overall) || 0) - ((a.scores && a.scores.overall) || 0))
    .slice(0, Number(options.limit || 12))
    .map(recipe => ({
      id: recipe.id,
      sourceKind: recipe.source && recipe.source.kind,
      materialType: recipe.designSyntax && recipe.designSyntax.materialType,
      pageRole: recipe.designSyntax && recipe.designSyntax.pageRole,
      renderType: recipe.renderType,
      layoutVariant: recipe.layoutVariant,
      themeIntent: recipe.themeIntent,
      proofObject: recipe.proofObject,
      mainVisualMethod: recipe.designSyntax && recipe.designSyntax.mainVisualMethod,
      informationDensity: recipe.designSyntax && recipe.designSyntax.informationDensity,
      componentHints: (recipe.componentHints || []).slice(0, 8),
      forbiddenPoints: recipe.designSyntax && recipe.designSyntax.forbiddenPoints,
      score: recipe.scores && recipe.scores.overall
    }));
  return {
    version: 'reference-context/v1',
    industry,
    matchIndustryIds: [...ids],
    industryPack: pack ? {
      id: pack.id,
      labelZh: pack.labelZh,
      recommendedOutline: pack.recommendedOutline,
      proofObjects: pack.proofObjects,
      proofObjectCatalog: pack.proofObjectCatalog,
      reportStructures: pack.reportStructures,
      componentRules: pack.componentRules,
      visualGrammar: pack.visualGrammar,
      visualTone: pack.visualTone,
      paletteIntent: pack.paletteIntent,
      pageFamilies: pack.pageFamilies,
      forbiddenTemplates: pack.forbiddenTemplates,
      clarificationQuestions: pack.clarificationQuestions
    } : null,
    benchmarkMaterials: benchmarks,
    recipeLibraryCoverage: REFERENCE_RECIPE_LIBRARY.coverage || {},
    recommendedReferenceRecipes: recipes
  };
}

function buildModelPrompt(bundle = {}) {
  const payload = bundleForPrompt(bundle);
  const referenceContext = referenceContextForPrompt(bundle);
  return [
    '# Material To Deck Plan Extraction',
    '',
    '你是高端商用 PPT 的材料理解器。请只基于材料提取事实、证据、论点链、行业语义和图片用途，输出 JSON，不要写解释。',
    '',
    '硬规则：',
    '- 不编造材料中没有的客户、收入、指标、案例、日期或授权信息。',
    '- 每个 fact/evidence/claim/metric 都要带 source_ids，并必须写 source_pages/source_excerpts；QA 会检查页码和原文摘录，不接受只有 source id。',
    '- 图片 evidence 用 asset_source_id 指向图片 source，并写 provenance 与 authorization_status；授权不明不能作为正式外发证据。',
    '- 如果用户或材料指定页数，写入 document.requested_slide_count；材料少时不要硬凑，缺少证据就写 missing_info。',
    '- claim 必须是可直接作为 PPT 页标题的判断句，不是主题词。',
    '- proof_object 应优先选择行业专用对象；不确定时用 report-board 或 metric-board。',
    '- 每页必须有一个 proof_object，并写 componentHints/componentPlan：例如 hero-image + kpi-strip + caption-bar + commentary-panel。',
    '- 区分真实证据和模型生成示意图：真实数据/截图/图片写 source_ids 和 provenance；生成图只能标为 model-generated-illustration，不能冒充真实 proof。',
    '- 每个诊断、数据、方案、价值页都要尽量填写 business_logic：现状/影响/原因/动作/指标；没有材料依据的字段留空，不要编造。',
    '- 数据页不能只摆漂亮数字，必须说明数字对应的业务判断；优先选择 comparison、funnel、root-cause-matrix、journey-breakpoint、before-after、heatmap、milestone、scorecard、scatter-bubble、trend-line、waterfall-bridge、progress-tracker 等 data_component。',
    '- 必须输出 deck_art_direction：整套 deck 的 tone、palette、semantic_color_roles、layout_diversity_rules 和 rhythm_map。',
    '- 每个 claim 尽量写 theme_intent、accent_role、layout_energy、visual_density、rhythm_transition；这些字段只表达设计意图，不写坐标。',
    '- missing_info 只写交付说明需要用户补充的事实，不要放进可见 PPT。',
    '- 忽略 materialHygiene.removedSample 中的内容；它们是上一版生成稿/制作备注/QA 备注污染，不是企业事实。',
    '- claim/support/bullets/note 必须是客户可见的正式文案，不要写“材料显示、材料中、原材料、企业 PDF、PDF 简介口径、该页用于、正式交付前建议、图册页优先、适合某类材料、模型抽取”等制作备注。',
    '- 如果目标是中文 PPT，document.language 必须写 zh-CN，visible_language_policy.localize_non_essential_microcopy 必须为 true；除品牌名、产品名、URL、邮箱、股票代码和 API/OEE/IRR/SKU 等标准缩写外，所有可见标题、标签、caption、目录、结尾和组件微文案都使用中文。',
    '- 客户名称、logo、军工项目、现场照片、证书、专利数量和敏感参数如果材料没有明确公开/授权信息，写入 commercial_risks 或 missing_info，不要包装成已确认事实。',
    '- 如果材料里有电话、邮箱、官网、地址、二维码说明，放入 document.contacts；没有就留空，不要编造。',
    '',
    '请严格返回符合以下 schema 的 JSON：',
    '',
    '```json',
    JSON.stringify(extractionSchema(), null, 2),
    '```',
    '',
    '材料包：',
    '',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
    '',
    '行业包与 reference recipe 检索上下文：',
    '',
    '```json',
    JSON.stringify(referenceContext, null, 2),
    '```'
  ].join('\n');
}

function sourceById(bundle = {}) {
  return new Map((bundle.sources || []).map(s => [s.id, s]));
}

function evidenceById(extraction = {}) {
  return new Map((extraction.evidence || []).map(e => [e.id, e]));
}

function textItems(values = [], fallback = []) {
  const arr = Array.isArray(values) && values.length ? values : fallback;
  return arr.filter(Boolean).slice(0, 5).map(v => {
    if (typeof v === 'string') return { title: v, body: '' };
    return { title: v.title || v.label || v.name || '要点', body: v.body || v.summary || v.note || '' };
  });
}

function metricsFromClaim(claim = {}) {
  if (Array.isArray(claim.metrics) && claim.metrics.length) return claim.metrics.slice(0, 5);
  const text = [claim.claim, claim.support, ...(claim.bullets || [])].join(' ');
  const nums = extractNumbers(text)
    .filter(value => {
      const raw = String(value || '').trim();
      if (/^(19|20)\d{2}$/.test(raw)) return false;
      if (/^[1-9]$/.test(raw)) return false;
      return true;
    })
    .slice(0, 4);
  return nums.map((value, i) => ({ label: ['核心指标', '变化幅度', '目标进度', '补充读数'][i] || '指标', value, note: claim.support || '' }));
}

function attachMetricSourceTrace(metric = {}, sourceTrace = {}) {
  if (metric.sourceTrace || metric.source_trace) return metric;
  const textSource = (sourceTrace.sources || []).find(entry => entry && entry.kind !== 'image');
  if (!textSource) return metric;
  return Object.assign({}, metric, {
    sourceId: metric.sourceId || metric.source_id || textSource.id,
    sourcePage: metric.sourcePage || metric.source_page || textSource.page || textSource.pageRef || textSource.pageNumber,
    sourceExcerpt: metric.sourceExcerpt || metric.source_excerpt || textSource.excerpt,
    sourceTrace: {
      version: 'metric-source-trace/v1',
      sourceIds: [metric.sourceId || metric.source_id || textSource.id].filter(Boolean),
      sources: [{
        id: metric.sourceId || metric.source_id || textSource.id,
        page: metric.sourcePage || metric.source_page || textSource.page || textSource.pageRef || textSource.pageNumber,
        excerpt: metric.sourceExcerpt || metric.source_excerpt || textSource.excerpt,
        provenance: 'metric-source-excerpt'
      }]
    }
  });
}

function businessLogicFromClaim(claim = {}) {
  const raw = claim.business_logic || claim.businessLogic || claim.diagnostic_chain || claim.diagnosticChain || {};
  const logic = {
    currentState: raw.current_state || raw.currentState || raw.status || raw.problem || raw.current || '',
    impact: raw.impact || raw.business_impact || raw.consequence || '',
    cause: raw.cause || raw.root_cause || raw.driver || raw.reason || '',
    action: raw.action || raw.operating_action || raw.response || raw.next_action || '',
    metric: raw.metric || raw.measure || raw.kpi || raw.result_metric || raw.expected_result || ''
  };
  Object.keys(logic).forEach(k => { if (logic[k]) logic[k] = String(logic[k]).trim(); });
  return Object.values(logic).some(Boolean) ? logic : null;
}

function dataComponentForClaim(claim = {}) {
  const explicit = String(claim.data_component || claim.dataComponent || '').trim();
  if (explicit) return explicit;
  const proof = String(claim.proof_object || '').toLowerCase();
  if (/channel|media|efficiency|scatter|bubble|roas|roi/.test(proof)) return 'scatter-bubble';
  if (/monthly|pulse|trend|月度|趋势/.test(proof)) return 'trend-line';
  if (/waterfall|bridge|target|目标桥|目标差额/.test(proof)) return 'waterfall-bridge';
  if (/pareto|root|cause|downtime/.test(proof)) return 'root-cause-matrix';
  if (/funnel|adoption/.test(proof)) return 'funnel';
  if (/journey|handoff|service/.test(proof)) return 'journey-breakpoint';
  if (/comparison|before|after/.test(proof)) return 'before-after';
  if (/milestone|timeline|loop/.test(proof)) return 'milestone';
  if (/scorecard|metric|board/.test(proof)) return 'scorecard';
  return '';
}

function agendaTitleForClaim(claim = {}) {
  if (claim.agenda_title || claim.short_title) return claim.agenda_title || claim.short_title;
  const text = String(claim.claim || claim.title || '');
  const pairs = [
    [/brand icon|operating engine|90-country|ART\/BEAUTY\/SCIENCE/i, 'Brand operating role'],
    [/product story|SKU|ingredient|Power Fermented|Camellia|30 years/i, 'Product proof'],
    [/award|awards|consumer-facing proof/i, 'Award evidence'],
    [/Group results|profit recovery|top-line pressure|net sales|core operating/i, 'Group results'],
    [/second-half|2H|regional|forecast|SHISEIDO 2H/i, 'Recovery signal'],
    [/LISA|campaign|Instagram|TikTok|consumer engagement/i, 'Campaign engagement'],
    [/Packaging|container-weight|refill|plastic|sustainability/i, 'Packaging proof'],
    [/risk agenda|claim discipline|image-rights|volatility/i, 'Risk controls'],
    [/2026 priorities|brand equity|hero franchises|regional execution/i, '2026 priorities'],
    [/照片|图片|车间|现场证据|制造证据|证据/, '现场证据'],
    [/核心价值|完整产线|制造基础|厂区|车间|加工中心/, '制造基础'],
    [/产品谱系|工艺段|控制段|产品|输送节点/, '产品谱系'],
    [/荣誉|资质|知识产权|专精特新|高新/, '资质背书'],
    [/项目清单|客户|应用场景|合作/, '客户项目'],
    [/军工|重载|复杂工艺|喷涂/, '高要求案例'],
    [/闭环|交付|安装|调试|维护/, '交付闭环'],
    [/下一步|评审|决策/, '合作评审']
  ];
  const hit = pairs.find(([re]) => re.test(text));
  if (hit) return hit[1];
  return text.replace(/[，。；：,.].*$/, '').slice(0, 12) || '核心议题';
}

function imagesForClaim(claim = {}, extraction = {}, bundle = {}) {
  const sources = sourceById(bundle);
  const evMap = evidenceById(extraction);
  const refs = [];
  (claim.visuals || []).forEach(v => {
    if (v.source_id) refs.push({ sourceId: v.source_id, caption: v.caption, role: v.role });
  });
  (claim.evidence_ids || []).forEach(id => {
    const ev = evMap.get(id);
    if (ev && ev.asset_source_id) refs.push({ sourceId: ev.asset_source_id, caption: ev.summary || ev.title, role: ev.type });
  });
  const unique = [];
  const seen = new Set();
  refs.forEach(ref => {
    const src = sources.get(ref.sourceId);
    if (!src || src.kind !== 'image' || seen.has(src.id)) return;
    seen.add(src.id);
    unique.push({ path: src.path, caption: ref.caption || src.name, role: ref.role || src.suggestedRole || 'evidence' });
  });
  return unique;
}

function chartFieldForProof(proof = '') {
  const p = String(proof || '').toLowerCase();
  if (p.includes('downtime') || p.includes('pareto')) return 'downtimePareto';
  if (p.includes('valuation') || p.includes('sensitivity')) return 'valuationSensitivity';
  if (p.includes('quality') || p.includes('handoff')) return 'qualityHandoff';
  if (p.includes('member') || p.includes('cohort') || p.includes('rfm')) return 'memberCohorts';
  if (p.includes('channel') || p.includes('media') || p.includes('efficiency') || p.includes('scatter') || p.includes('bubble') || p.includes('roas') || p.includes('roi')) return 'channelEfficiency';
  if (p.includes('monthly') || p.includes('pulse') || p.includes('trend')) return 'monthlyPulse';
  if (p.includes('waterfall') || p.includes('target-bridge') || p.includes('target bridge')) return 'waterfallBridge';
  if (p.includes('dispatch') || p.includes('site')) return 'dispatchMap';
  if (p.includes('adoption') || p.includes('funnel') || p.includes('activation')) return 'adoptionFunnel';
  return '';
}

function tableRowsFromClaim(claim = {}) {
  if (Array.isArray(claim.rows)) return claim.rows;
  if (Array.isArray(claim.risks)) return claim.risks.map(r => [r.title || r.risk || '风险', r.level || '中', r.action || r.mitigation || r.body || '建立跟踪机制']);
  return (claim.bullets || []).slice(0, 5).map((b, i) => [`事项 ${i + 1}`, '中', b]);
}

function contactListFromDoc(doc = {}) {
  const raw = doc.contacts || doc.contact || doc.contact_info || doc.website || doc.phone || doc.email || '';
  const values = Array.isArray(raw) ? raw : String(raw || '').split(/[｜|；;，,\n]/);
  return values.map(v => String(v || '').trim()).filter(Boolean).slice(0, 4);
}

function factText(value) {
  return typeof value === 'string' ? value : (value && (value.text || value.summary || value.title || value.body)) || '';
}

function externalUseCaveatText(value = '') {
  return /正式外发|外发版|授权边界|授权|待补充|补充|缺少|缺口|不明确|不能写成事实|核验|确认联系人|证书编号|客户案例/i.test(String(value || ''));
}

function finitePositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function requestedSlideCountFrom(extraction = {}, options = {}) {
  const doc = extraction.document || {};
  return finitePositiveNumber(
    options.targetSlides ||
    options.requestedSlideCount ||
    doc.targetSlides ||
    doc.target_slides ||
    doc.requestedSlideCount ||
    doc.requested_slide_count ||
    extraction.targetSlides ||
    extraction.target_slides ||
    extraction.requestedSlideCount ||
    extraction.requested_slide_count
  );
}

function materialDensityProfile(extraction = {}, bundle = {}) {
  const claims = Array.isArray(extraction.claim_spine) ? extraction.claim_spine : [];
  const evidence = Array.isArray(extraction.evidence) ? extraction.evidence : [];
  const facts = Array.isArray(extraction.facts) ? extraction.facts : [];
  const imageCount = Array.isArray(bundle.images) ? bundle.images.length : 0;
  const numberCount = ((bundle.textSummary && bundle.textSummary.numbers) || []).length;
  const sourceCount = Array.isArray(bundle.sources) ? bundle.sources.length : 0;
  const textChars = Number((bundle.textSummary && bundle.textSummary.charCount) || 0);
  const score =
    claims.length * 1.9 +
    evidence.length * 1.3 +
    facts.length * 0.8 +
    imageCount * 1.4 +
    Math.min(12, numberCount) * 0.45 +
    Math.min(8, sourceCount) * 0.6 +
    Math.min(12, Math.floor(textChars / 900)) * 0.45;
  const density = score >= 34 ? 'high' : (score >= 18 ? 'medium' : 'low');
  return {
    version: 'material-density/v1',
    density,
    score: Number(score.toFixed(1)),
    claimCount: claims.length,
    evidenceCount: evidence.length,
    factCount: facts.length,
    imageCount,
    numberCount,
    sourceCount,
    textChars
  };
}

function targetSlideContract(extraction = {}, bundle = {}, options = {}, context = {}) {
  const requested = requestedSlideCountFrom(extraction, options);
  const density = materialDensityProfile(extraction, bundle);
  const claimCount = Number(context.claimCount || ((extraction.claim_spine || []).length));
  const baseSlides = Number(context.baseSlides || 3);
  const minSlides = Math.max(baseSlides + 1, context.companyIntro ? 5 : 4);
  const availableSlides = Math.max(baseSlides, baseSlides + claimCount);
  const maxByDensity = density.density === 'high' ? 20 : (density.density === 'medium' ? 12 : 8);
  const recommended = Math.max(minSlides, Math.min(maxByDensity, availableSlides));
  const legacyMaxBody = finitePositiveNumber(options.maxSlides);
  const resolved = requested
    ? Math.max(minSlides, Math.min(20, Math.round(requested)))
    : (legacyMaxBody ? Math.min(maxByDensity, baseSlides + legacyMaxBody) : recommended);
  const bodyLimit = Math.max(0, resolved - baseSlides);
  const enoughMaterial = claimCount >= bodyLimit;
  return {
    version: 'target-slides/v1',
    requested: requested || null,
    resolved,
    targetSlides: resolved,
    baseSlides,
    bodyLimit,
    availableSlides,
    density,
    enoughMaterial,
    policy: enoughMaterial
      ? 'respect-requested-count'
      : 'do-not-hard-fill-without-evidence',
    adjustmentReason: enoughMaterial
      ? ''
      : `only ${claimCount} claim slides are available for ${bodyLimit} requested body slots`
  };
}

function sourceSummariesById(bundle = {}, ids = []) {
  const sources = sourceById(bundle);
  return compactUnique(ids).map(id => {
    const src = sources.get(id);
    return src ? {
      id: src.id,
      kind: src.kind,
      name: src.name,
      relativePath: src.relativePath,
      suggestedRole: src.suggestedRole || undefined,
      page: src.page || src.pageNumber || undefined,
      excerpt: (src.candidateFacts && src.candidateFacts[0]) || (src.chunks && src.chunks[0] && src.chunks[0].text && src.chunks[0].text.slice(0, 240)) || undefined,
      provenance: src.kind === 'image' ? 'ingested-image-asset' : `ingested-${src.kind || 'source'}`,
      authorizationStatus: src.authorizationStatus || src.assetRights || 'unknown'
    } : { id };
  });
}

function firstTextExcerpt(values = [], max = 260) {
  const text = values
    .map(v => String(v || '').replace(/\s+/g, ' ').trim())
    .find(Boolean) || '';
  return text.slice(0, max);
}

function pageRefForSource(source = {}, claim = {}, evidence = []) {
  const explicit = claim.page || claim.pageNumber || claim.source_page || claim.sourcePage || claim.page_ref || claim.pageRef;
  if (explicit) return explicit;
  const sourcePages = claim.source_pages || claim.sourcePages || {};
  if (sourcePages && typeof sourcePages === 'object' && sourcePages[source.id]) return sourcePages[source.id];
  const ev = evidence.find(item => (item.source_ids || item.sourceIds || []).includes(source.id));
  return ev && (ev.page || ev.pageNumber || ev.source_page || ev.sourcePage || ev.page_ref || ev.pageRef);
}

function excerptForSource(source = {}, claim = {}, evidence = []) {
  const explicit = claim.excerpt || claim.source_excerpt || claim.sourceExcerpt || claim.original_excerpt || claim.originalExcerpt;
  if (explicit) return firstTextExcerpt([explicit]);
  const sourceExcerpts = claim.source_excerpts || claim.sourceExcerpts || {};
  if (sourceExcerpts && typeof sourceExcerpts === 'object' && sourceExcerpts[source.id]) return firstTextExcerpt([sourceExcerpts[source.id]]);
  const ev = evidence.find(item => (item.source_ids || item.sourceIds || []).includes(source.id));
  return firstTextExcerpt([
    ev && (ev.excerpt || ev.source_excerpt || ev.original_excerpt || ev.summary || ev.title),
    claim.support,
    claim.summary,
    source.candidateFacts && source.candidateFacts[0],
    source.chunks && source.chunks[0] && source.chunks[0].text
  ]);
}

function assetAuthorizationForSource(source = {}, claim = {}, evidence = []) {
  const ev = evidence.find(item =>
    item.asset_source_id === source.id ||
    item.assetSourceId === source.id ||
    (item.source_ids || item.sourceIds || []).includes(source.id)
  ) || {};
  return ev.authorization_status || ev.authorizationStatus ||
    ev.asset_rights || ev.assetRights ||
    source.authorizationStatus || source.assetRights ||
    claim.asset_rights || claim.assetRights ||
    'unknown';
}

function sourceTraceForClaim(claim = {}, extraction = {}, bundle = {}) {
  const sources = sourceById(bundle);
  const evMap = evidenceById(extraction);
  const evidenceIds = compactUnique(claim.evidence_ids || claim.evidenceIds || []);
  const evidence = evidenceIds.map(id => evMap.get(id)).filter(Boolean);
  const sourceIds = compactUnique([
    ...(claim.source_ids || claim.sourceIds || []),
    ...evidence.flatMap(ev => ev.source_ids || ev.sourceIds || []),
    ...evidence.map(ev => ev.asset_source_id || ev.assetSourceId).filter(Boolean)
  ]);
  const evidenceReferencesSource = (ev = {}, id = '') => {
    const refs = compactUnique([
      ev.asset_source_id,
      ev.assetSourceId,
      ...(ev.source_ids || ev.sourceIds || [])
    ].filter(Boolean));
    return refs.includes(id);
  };
  const sourceEntries = sourceIds.map(id => {
    const src = sources.get(id) || { id, kind: 'unknown' };
    const isImage = src.kind === 'image' || evidence.some(ev =>
      evidenceReferencesSource(ev, id) &&
      ((ev.asset_source_id || ev.assetSourceId) === id || /image|screenshot|photo|visual/i.test(String(ev.type || '')))
    );
    const page = pageRefForSource(src, claim, evidence);
    const excerpt = excerptForSource(src, claim, evidence);
    return {
      id,
      kind: src.kind || 'unknown',
      name: src.name || '',
      relativePath: src.relativePath || '',
      page: page || undefined,
      excerpt: excerpt || undefined,
      provenance: isImage ? 'image-provenance' : 'text-source-excerpt',
      assetProvenance: isImage ? (src.relativePath || src.path || id) : undefined,
      authorizationStatus: assetAuthorizationForSource(src, claim, evidence)
    };
  });
  const imageProvenance = sourceEntries
    .filter(entry => entry.kind === 'image' || entry.assetProvenance)
    .map(entry => ({
      sourceId: entry.id,
      file: entry.relativePath || entry.name,
      provenance: entry.assetProvenance || entry.provenance,
      authorizationStatus: entry.authorizationStatus
    }));
  const authorizationStatuses = compactUnique(sourceEntries.map(entry => entry.authorizationStatus).filter(Boolean));
  return {
    version: 'source-trace/v2',
    claimId: claim.id || '',
    evidenceIds,
    sourceIds,
    sources: sourceEntries,
    imageProvenance,
    assetAuthorizationStatus: authorizationStatuses.includes('blocked') || authorizationStatuses.includes('needs authorization')
      ? 'blocked'
      : (authorizationStatuses.includes('unknown') ? 'unknown' : (authorizationStatuses[0] || 'unknown')),
    confidence: claim.confidence
  };
}

function proofObjectForClaim(claim = {}, extraction = {}, bundle = {}) {
  const evMap = evidenceById(extraction);
  const evidenceIds = compactUnique(claim.evidence_ids || claim.evidenceIds || []);
  const sourceIds = compactUnique(claim.source_ids || claim.sourceIds || []);
  const evidence = evidenceIds.map(id => evMap.get(id)).filter(Boolean);
  const evidenceTypes = compactUnique(evidence.map(ev => ev.type || 'evidence'));
  const visuals = Array.isArray(claim.visuals) ? claim.visuals : [];
  const assetRequirements = Array.isArray(claim.asset_requirements || claim.assetRequirements)
    ? (claim.asset_requirements || claim.assetRequirements)
    : [];
  const generatedSignals = [
    ...visuals.map(v => `${v.mode || ''} ${v.provenance || ''} ${v.role || ''}`),
    ...assetRequirements.map(v => `${v.provenance || ''} ${v.role || ''}`)
  ].join(' ');
  const hasRealEvidence = Boolean(sourceIds.length || evidence.some(ev => Array.isArray(ev.source_ids) && ev.source_ids.length));
  const hasBoundAssetEvidence = evidence.some(ev => ev.asset_source_id) || visuals.some(v => v.source_id);
  const generatedIllustration = /generated|synthetic|model|示意|生成/i.test(generatedSignals);
  const provenance = generatedIllustration && !hasBoundAssetEvidence
    ? 'model-generated-illustration'
    : (hasRealEvidence ? (hasBoundAssetEvidence ? 'real-asset-evidence' : 'source-derived-evidence') : 'unproven');
  return {
    version: 'proof-object/v1',
    id: claim.proof_object || claim.proofObject || 'report-board',
    kind: evidenceTypes[0] || claim.data_component || claim.dataComponent || 'source-summary',
    claimId: claim.id || '',
    evidenceIds,
    sourceIds,
    sources: sourceSummariesById(bundle, sourceIds),
    sourceTrace: sourceTraceForClaim(claim, extraction, bundle),
    evidenceTypes,
    provenance,
    evidenceMode: generatedIllustration ? 'synthetic-illustration' : 'real-evidence',
    factual: hasRealEvidence && !generatedIllustration,
    generatedIllustration,
    explanation: claim.source_note || claim.sourceNote || (evidence[0] && (evidence[0].summary || evidence[0].title)) || claim.support || '',
    sourceNote: claim.source_note || claim.sourceNote || claim.provenance_note || claim.provenanceNote || ''
  };
}

function claimSpineContract(claims = [], extraction = {}, bundle = {}) {
  return claims.map((claim, i) => ({
    index: i + 1,
    id: claim.id || `claim-${String(i + 1).padStart(3, '0')}`,
    narrativeRole: claim.narrative_role || claim.narrativeRole || '',
    claim: claim.claim || claim.title || '',
    support: claim.support || claim.summary || '',
    proofObject: proofObjectForClaim(claim, extraction, bundle),
    sourceTrace: sourceTraceForClaim(claim, extraction, bundle),
    sourceIds: compactUnique(claim.source_ids || claim.sourceIds || []),
    evidenceIds: compactUnique(claim.evidence_ids || claim.evidenceIds || []),
    confidence: claim.confidence
  }));
}

function claimVisibleText(claim = {}) {
  return [
    claim.claim,
    claim.title,
    claim.support,
    claim.summary,
    claim.note,
    claim.proof_object,
    claim.narrative_role,
    ...(Array.isArray(claim.bullets) ? claim.bullets : [])
  ].filter(Boolean).join(' ');
}

function shouldSuppressCompanyIntroClaim(claim = {}) {
  const proof = String(claim.proof_object || '').toLowerCase();
  const role = String(claim.narrative_role || '').toLowerCase();
  const text = claimVisibleText(claim);
  if (role === 'governance' || proof.includes('risk') || proof.includes('responsibility')) {
    return externalUseCaveatText(text);
  }
  if (role === 'decision') return true;
  return false;
}

function hasUsableCustomerCase(extraction = {}) {
  const text = [
    ...(extraction.facts || []).map(v => factText(v)),
    ...(extraction.evidence || []).map(v => factText(v)),
    ...(extraction.claim_spine || []).map(v => claimVisibleText(v))
  ].join(' ');
  return /客户|案例|项目|交付|业绩/.test(text) && !externalUseCaveatText(text);
}

function hasUsableCertificate(extraction = {}) {
  const text = [
    ...(extraction.facts || []).map(v => factText(v)),
    ...(extraction.evidence || []).map(v => factText(v)),
    ...(extraction.claim_spine || []).map(v => claimVisibleText(v))
  ].join(' ');
  return /资质|证书|认证|专利|荣誉|高新|专精特新/.test(text) && !externalUseCaveatText(text);
}

function companyIntroTocItems(extraction = {}, contacts = []) {
  const items = ['公司概况', '产品与工艺', '制造与交付能力'];
  const hasImages = Array.isArray(extraction.images) && extraction.images.length;
  if (hasUsableCustomerCase(extraction)) items.push('项目案例');
  else if (hasImages || (extraction.claim_spine || []).some(c => /case-gallery|case-evidence|evidence/i.test(String(c.proof_object || '')))) items.push('产品与现场图像');
  if (hasUsableCertificate(extraction)) items.push('资质荣誉');
  items.push(contacts.length ? '联系方式' : '致谢');
  return [...new Set(items)].slice(0, 6);
}

function manufacturingServiceScopeSlideFromClaim(claim = {}) {
  const bullets = textItems(claim.bullets, ['非标输送设备', '涂装设备', '控制系统', '现场安装调试']).map(item => item.title).filter(Boolean);
  const bodyByTitle = {
    '非标输送设备': '围绕生产线转运、节拍衔接和现场布置进行定制化设计与制造。',
    '涂装设备': '承接涂装工艺相关设备配置、制造装配与现场配合。',
    '控制系统': '配合输送和涂装设备完成控制系统集成、联调与运行交付。',
    '现场安装调试': '围绕安装、调试、验收配合与后续服务形成交付闭环。',
    '现场安调服务': '围绕安装、调试、验收配合与后续服务形成交付闭环。',
    '输送系统': '围绕生产线转运、节拍衔接和现场布置进行定制化设计与制造。'
  };
  return {
    type: 'report-board',
    title: '服务范围覆盖输送、涂装、控制与现场安调',
    subtitle: '按产品对象和交付动作组织能力，便于客户判断适配场景。',
    claim: '按产品对象和交付动作组织能力，便于客户判断适配场景。',
    label: 'SERVICE SCOPE',
    coreTitle: '从产品到现场交付',
    coreBody: '围绕产品对象、控制集成与现场服务形成可交付能力。',
    summary: '产品类型、控制集成和现场服务共同构成项目交付范围。',
    sections: bullets.slice(0, 4).map(title => ({
      title,
      body: bodyByTitle[title] || '围绕该能力项形成设计、制造、安装或调试服务。'
    }))
  };
}

function slideFromCompanyIntroClaim(claim = {}, extraction = {}, bundle = {}, industry = '') {
  const proof = String(claim.proof_object || '').toLowerCase();
  if (industry === 'manufacturing-operations' && proof.includes('report-board') && externalUseCaveatText(claimVisibleText(claim))) {
    return manufacturingServiceScopeSlideFromClaim(claim);
  }
  return slideFromClaim(claim, extraction, bundle);
}

function materialHygieneSummary(bundle = {}) {
  const sources = bundle.sources || [];
  const removedLineCount = sources.reduce((sum, src) => sum + Number((src.materialHygiene || {}).removedLineCount || 0), 0);
  const removedSample = sources.flatMap(src => ((src.materialHygiene || {}).removedSample || []).map(item => ({
    sourceId: src.id,
    sourceName: src.name,
    lineNumber: item.lineNumber,
    text: item.text,
    reasons: item.reasons
  }))).slice(0, 10);
  return { removedLineCount, removedSample };
}

function companyIntroDuplicateReason(slide = {}, profileSlide = {}) {
  const overlap = slideContentOverlap(profileSlide, slide);
  if (overlap.sharedNumbers.length >= 2) {
    return `reuses company-profile metrics: ${overlap.sharedNumbers.join(', ')}`;
  }
  if (overlap.score >= 0.46 && /基础|规模|厂区|车间|加工|概况|简介|成立|始建/i.test([slide.title, slide.subtitle, slide.claim].filter(Boolean).join(' '))) {
    return `overlaps company profile text (${overlap.sharedTokens.slice(0, 6).join(', ')})`;
  }
  return '';
}

function filterCompanyIntroDuplicateSlides(slides = [], profileSlide = {}) {
  const removed = [];
  const kept = slides.filter(slide => {
    const reason = companyIntroDuplicateReason(slide, profileSlide);
    if (!reason) return true;
    removed.push({ title: slide.title || '', type: slide.type || '', reason });
    return false;
  });
  return { slides: kept, removed };
}

function imageCaptionCards(bundle = {}, max = 3) {
  return (bundle.images || []).slice(0, max).map((img, i) => ({
    title: img.caption || img.name || `现场图片 ${i + 1}`,
    body: img.suggestedRole ? `图片角色：${img.suggestedRole}` : '企业现场或产品图片'
  }));
}

function applyCompanyIntroRhythm(slides = []) {
  let galleryIndex = 0;
  return slides.map(slide => {
    const imageCount = Array.isArray(slide.images) ? slide.images.length : 0;
    if (imageCount >= 2) {
      galleryIndex += 1;
      if (!slide.layoutVariant && galleryIndex % 2 === 1) {
        return Object.assign({}, slide, { layoutVariant: 'case-hero' });
      }
    }
    return slide;
  });
}

function isCompanyProfileMetricClaim(claim = {}) {
  if (!Array.isArray(claim.metrics) || !claim.metrics.length) return false;
  const text = claimVisibleText(claim);
  const profileSignal = /公司|企业|成立|始建|厂区|厂房|车间|加工中心|面积|员工|团队|产能|资质|专利|认证|规模|制造基础|长期制造|company profile|foundation|facility|workshop|capacity/i.test(text);
  const operatingProblemSignal = /OEE|MTTR|MTBF|停机|停線|故障|等待备件|换型|维修|告警|缺陷|downtime|maintenance|fault|incident|root cause/i.test(text);
  return profileSignal && !operatingProblemSignal && !externalUseCaveatText(text);
}

function slideFromClaim(claim = {}, extraction = {}, bundle = {}) {
  const proof = String(claim.proof_object || '').toLowerCase();
  const title = claim.claim || claim.title || '核心判断';
  const subtitle = claim.support || claim.summary || '';
  const images = imagesForClaim(claim, extraction, bundle);
  const metrics = metricsFromClaim(claim);
  const sourceTrace = sourceTraceForClaim(claim, extraction, bundle);
  const slide = {
    type: 'content',
    title,
    subtitle,
    claim: subtitle,
    proofObject: claim.proof_object || claim.proofObject || '',
    proof: proofObjectForClaim(claim, extraction, bundle),
    note: cleanPublicNote(claim.note || ''),
    sourceTrace
  };
  if (metrics.length) slide.metrics = metrics.map(metric => attachMetricSourceTrace(metric, sourceTrace));
  if (claim.theme_intent || claim.themeIntent) slide.themeIntent = claim.theme_intent || claim.themeIntent;
  if (claim.accent_role || claim.accentRole) slide.accentRole = claim.accent_role || claim.accentRole;
  if (claim.layout_energy || claim.layoutEnergy) slide.layoutEnergy = claim.layout_energy || claim.layoutEnergy;
  if (claim.visual_density || claim.visualDensity) slide.visualDensity = claim.visual_density || claim.visualDensity;
  if (claim.rhythm_transition || claim.rhythmTransition) slide.rhythmTransition = claim.rhythm_transition || claim.rhythmTransition;
  if (claim.reference_recipe_id || claim.referenceRecipeId) slide.referenceRecipeId = claim.reference_recipe_id || claim.referenceRecipeId;
  if (Array.isArray(claim.reference_recipe_ids || claim.referenceRecipeIds)) {
    slide.referenceRecipeIds = claim.reference_recipe_ids || claim.referenceRecipeIds;
    slide.referenceRecipeId = slide.referenceRecipeId || slide.referenceRecipeIds[0];
  }
  if (claim.reference_category_id || claim.referenceCategoryId) slide.referenceCategoryId = claim.reference_category_id || claim.referenceCategoryId;
  if (Array.isArray(claim.component_hints || claim.componentHints)) slide.componentHints = claim.component_hints || claim.componentHints;
  if (Array.isArray(claim.component_suggestions || claim.componentSuggestions)) slide.componentSuggestions = claim.component_suggestions || claim.componentSuggestions;
  if (!slide.componentHints && slide.componentSuggestions) slide.componentHints = slide.componentSuggestions;
  if (claim.componentPlan || claim.component_plan) slide.componentPlan = claim.componentPlan || claim.component_plan;
  if (Array.isArray(claim.asset_requirements || claim.assetRequirements)) slide.assetRequirements = claim.asset_requirements || claim.assetRequirements;
  if (claim.source_note || claim.sourceNote || claim.provenance_note || claim.provenanceNote) {
    slide.sourceNote = claim.source_note || claim.sourceNote || claim.provenance_note || claim.provenanceNote;
  }
  const businessLogic = businessLogicFromClaim(claim);
  if (businessLogic) slide.businessLogic = businessLogic;
  const dataComponent = dataComponentForClaim(claim);
  if (dataComponent) slide.dataComponent = dataComponent;
  if (claim.layoutVariant || claim.variant) {
    slide.layoutVariant = claim.layoutVariant || claim.variant;
    slide.variant = claim.layoutVariant || claim.variant;
  }
  else if (/financial-kpi-snapshot|chart-grid-with-commentary|quarterly-results-summary|guidance-and-risk-board|value-creation-process-map|materiality-matrix-board|sustainability-proof-spread|governance-table-editorial|culture-cover-with-soft-geometry|mission-statement-stage|people-proof-mosaic|value-principle-cards|beauty-brand-editorial-cover|brand-world-and-business-proof|consumer-proof-photo-grid|product-evidence-story|airy-concept-opening|single-object-concept-map|executive-proof-board|premium-closing-anchor/.test(proof)) {
    slide.variant = proof;
  }

  const chartField = chartFieldForProof(proof);
  if (chartField) {
    slide[chartField] = claim.data && Object.keys(claim.data).length ? claim.data : metrics.map(m => ({ title: m.label, value: parseFloat(String(m.value).replace(/[^\d.-]/g, '')) || 0, body: m.note || '', unit: /%|％/.test(String(m.value)) ? '%' : '' }));
    slide.coreTitle = title.length > 18 ? String(proof).replace(/-/g, ' ').toUpperCase() : title;
    slide.coreBody = subtitle || '把关键行业指标转化为可核验的判断依据。';
    return slide;
  }
  if (proof.includes('finance-bridge') || proof.includes('return-bridge')) {
    slide.bridge = Array.isArray(claim.bridge) ? claim.bridge : metrics.map((m, i) => ({ label: m.label, value: parseFloat(String(m.value).replace(/[^\d.-]/g, '')) || (i === 0 ? 10 : 3), note: m.note }));
    return slide;
  }
  if (proof === 'report-board' || proof.includes('report-board')) {
    slide.type = 'report-board';
    slide.label = claim.label || 'EVIDENCE BOARD';
    slide.coreTitle = claim.coreTitle || claim.core_title || '材料证据';
    slide.coreBody = claim.coreBody || claim.core_body || subtitle;
    slide.summary = claim.summary || subtitle;
    slide.decision = claim.decision || '';
    slide.note = cleanPublicNote(claim.note || '');
    slide.sections = Array.isArray(claim.sections) && claim.sections.length
      ? claim.sections
      : textItems(claim.cards || claim.bullets, [subtitle || title]).map((it, i) => Object.assign({}, it, {
        body: it.body || claim.support || subtitle || ['适配场景', '制造证据', '交付边界', '外发口径'][i] || '证据说明'
      }));
    return slide;
  }
  if (proof.includes('portfolio')) {
    slide.portfolio = Array.isArray(claim.portfolio) ? claim.portfolio : textItems(claim.bullets, ['重点项目', '观察项目', '退出项目']).map((it, i) => ({ name: it.title, theme: it.body || '投后动作', weight: i === 0 ? 35 : 20, irr: metrics[i] ? metrics[i].value : '—', dpi: '—', risk: i === 0 ? '低' : '中', action: it.body || '维持观察' }));
    return slide;
  }
  if (proof.includes('architecture') || proof.includes('blueprint') || proof.includes('capability-map') || proof.includes('topology') || proof.includes('service-blueprint')) {
    if (proof.includes('service-blueprint')) {
      slide.serviceBlueprint = claim.data || {};
      slide.variant = 'service-blueprint';
    }
    if (proof.includes('platform')) {
      slide.platformCapabilities = textItems(claim.bullets);
      slide.variant = 'platform-capability-map';
    }
    if (proof.includes('production')) {
      slide.productionLine = claim.data || {};
      slide.variant = 'production-topology';
    }
    if (proof.includes('production') && !Array.isArray(claim.layers)) {
      const products = textItems(claim.bullets, ['非标输送设备', '涂装设备', '控制系统', '现场安装调试']).map(it => it.title).filter(Boolean);
      slide.layers = [
        { name:'产品与工艺对象', title:'产品与工艺对象', items:products.slice(0, 5) },
        { name:'制造交付动作', title:'制造交付动作', items:['需求确认', '加工制造', '控制联调', '现场安装'] },
        { name:'证据与交付资料', title:'证据与交付资料', items:['图纸参数', '设备铭牌', '调试记录', '项目验收', '服务反馈'] }
      ];
    } else {
      slide.layers = Array.isArray(claim.layers) ? claim.layers : textItems(claim.bullets, ['数据层', '业务层', '管理层']).map(it => ({ name: it.title, title: it.title, items: it.body ? [it.body] : [it.title].filter(Boolean) }));
    }
    return slide;
  }
  if (proof.includes('risk') || proof.includes('governance') || proof.includes('responsibility') || claim.narrative_role === 'governance') {
    slide.headers = ['风险/责任项', '等级/角色', '应对动作'];
    slide.rows = tableRowsFromClaim(claim);
    if (proof.includes('matrix')) slide.matrix = claim.matrix || { x: '影响程度', y: '发生可能性' };
    if (proof.includes('responsibility')) {
      slide.variant = 'responsibility-loop';
      slide.responsibilities = Array.isArray(claim.responsibilities) && claim.responsibilities.length
        ? claim.responsibilities
        : textItems(claim.bullets).map((it, i) => ({ title: it.title, owner: ['业务', '技术', '管理层'][i] || '负责人', body: it.body }));
    }
    return slide;
  }
  if (proof.includes('loop') || proof.includes('timeline') || proof.includes('process') || claim.narrative_role === 'operating-model') {
    slide.phases = Array.isArray(claim.phases) ? claim.phases : textItems(claim.bullets, ['发现问题', '处置动作', '复盘优化']).map(it => ({ title: it.title, body: it.body || subtitle }));
    if (proof.includes('flywheel') || proof.includes('闭环')) slide.loop = true;
    return slide;
  }
  if (images.length >= 2 || /case|lookbook|evidence|proof|gallery|photo|mosaic|product.*story|brand-world/.test(proof)) {
    slide.images = images.map(x => x.path);
    const fallbackCards = textItems(claim.bullets, [subtitle || title]);
    slide.cards = images.length
      ? images.map((x, i) => ({ title: x.caption || `证据 ${i + 1}`, body: (claim.bullets || [subtitle])[i] || subtitle || '材料证据' }))
      : fallbackCards;
    return slide;
  }
  if (metrics.length >= 2 || proof.includes('metric') || claim.narrative_role === 'proof') {
    slide.metrics = metrics;
    const metricText = metrics.map(m => `${m.label || ''} ${m.value || ''} ${m.note || ''}`).join(' ');
    if (proof.includes('metric-board') && !/OEE|MTTR|MTBF|停机|稼动/i.test(metricText)) {
      slide.variant = 'fact-metrics';
    }
    return slide;
  }
  slide.cards = textItems(claim.bullets, [subtitle || title]);
  return slide;
}

function validateExtraction(extraction = {}) {
  const errors = [];
  if (extraction.version !== 'material-extraction/v1') errors.push('extraction.version must be material-extraction/v1');
  if (!extraction.document || typeof extraction.document !== 'object') errors.push('extraction.document is required');
  if (!Array.isArray(extraction.claim_spine) || extraction.claim_spine.length < 2) errors.push('extraction.claim_spine must contain at least two claims');
  (extraction.claim_spine || []).forEach((claim, i) => {
    if (!claim.claim) errors.push(`claim_spine[${i}].claim is required`);
    if (!Array.isArray(claim.source_ids) || !claim.source_ids.length) errors.push(`claim_spine[${i}].source_ids is required`);
    const visibleCopy = [
      claim.claim,
      claim.support,
      claim.summary,
      claim.note,
      ...(Array.isArray(claim.bullets) ? claim.bullets : [])
    ].filter(Boolean).join(' ');
    if (hasBadVisibleCopy(visibleCopy)) errors.push(`claim_spine[${i}] contains production-note wording that would leak into visible slides`);
  });
  return errors;
}

function compileDeckPlan(extraction = {}, bundle = {}, options = {}) {
  const errors = validateExtraction(extraction);
  if (errors.length) usageError(`invalid material extraction:\n- ${errors.join('\n- ')}`);
  const doc = extraction.document || {};
  const industry = doc.industry || ((bundle.textSummary && bundle.textSummary.industryCandidates && bundle.textSummary.industryCandidates[0] || {}).industry) || 'general-operations';
  const claims = extraction.claim_spine || [];
  const bodyClaims = claims.filter(c => !['cover', 'orientation'].includes(c.narrative_role));
  const title = doc.title || options.title || '材料整理汇报';
  const subtitle = doc.subtitle || doc.decision_goal || '围绕事实、证据与下一步行动形成清晰汇报';
  const companyIntro = doc.ppt_type === 'company-intro';
  const language = doc.language || doc.target_language || doc.output_language || extraction.language || inferDeckLanguage({
    title,
    subtitle,
    document: doc,
    claim_spine: claims
  });
  const zhDeck = /^zh/i.test(String(language || ''));
  const coverMetricClaim = companyIntro
    ? bodyClaims.find(isCompanyProfileMetricClaim)
    : bodyClaims.find(c => Array.isArray(c.metrics) && c.metrics.length);
  const contacts = contactListFromDoc(doc);
  const displayTitle = companyIntro && doc.organization ? doc.organization : title;
  const firstImage = ((bundle.images || []).find(Boolean) || {}).path;
  const materialImages = (bundle.images || []).map(img => img.path).filter(Boolean);
  const presentationClaims = companyIntro
    ? bodyClaims.filter(c => !shouldSuppressCompanyIntroClaim(c))
    : bodyClaims;
  const nonDecisionClaims = presentationClaims.filter(c => c.narrative_role !== 'decision');
  const baseSlideCount = companyIntro ? 4 : 3;
  const targetContract = targetSlideContract(extraction, bundle, options, {
    companyIntro,
    baseSlides: baseSlideCount,
    claimCount: nonDecisionClaims.length
  });
  const introDescription = (extraction.facts || []).map(factText).filter(Boolean).slice(0, 2).join('；') ||
    '围绕装备制造、输送系统和现场交付形成综合服务能力。';
  const companyTocItems = companyIntroTocItems(Object.assign({}, extraction, { images: bundle.images || [] }), contacts);
  const slides = [
    {
      type: 'auto',
      title: displayTitle,
      subtitle: companyIntro && title !== displayTitle ? title.replace(displayTitle, '').replace(/^[\\s｜|/·-]+/, '') || subtitle : subtitle,
      visual: firstImage ? { mode: 'photo', role: companyIntro ? 'showcase' : 'cover', image: firstImage } : undefined
    }
  ];
  if (companyIntro) {
    slides.push({
      type: 'toc-clean',
      title: '目录',
      label: '目录',
      navigationLabel: '章节目录',
      subtitle: companyTocItems.includes('项目案例') || companyTocItems.includes('资质荣誉')
        ? '从公司概况、产品能力到项目案例与资质荣誉'
        : '从公司概况、产品工艺到制造交付与现场图像',
      items: companyTocItems
    });
    const profileSlide = {
      type: industry === 'manufacturing-operations' ? 'company-profile-spread' : 'profile-proof',
      title: '公司介绍',
      subtitle: '以长期制造基础、厂区车间和产品经验建立合作信任。',
      company: doc.organization || displayTitle,
      description: introDescription,
      metrics: coverMetricClaim ? coverMetricClaim.metrics.slice(0, 4) : [],
      images: materialImages.slice(0, 3),
      cards: imageCaptionCards(bundle, 3),
      visual: firstImage ? { mode: 'photo', role: 'evidence', image: firstImage, caption: '企业现场或产品图片' } : undefined
    };
    slides.push(profileSlide);
  } else {
    slides.push({
      type: 'chapter-divider',
      title: '汇报路径',
      claim: bodyClaims.length
        ? (zhDeck
            ? `本报告沿着${bodyClaims.slice(0, 4).map(c => agendaTitleForClaim(c)).join('、')}展开证据路径。`
            : `This report follows ${bodyClaims.slice(0, 4).map(c => agendaTitleForClaim(c)).join(', ')} as the evidence path.`)
        : (zhDeck ? '本报告先梳理有来源支撑的判断，再收束到决策路径。' : 'This report follows source-backed claims before closing on the decision path.'),
      chapter: '01',
      label: industry === 'manufacturing-operations' ? (zhDeck ? '能力证据路径' : 'CAPABILITY EVIDENCE PATH') : undefined,
      bottomLabel: industry === 'manufacturing-operations' ? (zhDeck ? '证据路径' : 'EVIDENCE PATH') : undefined,
      subtitle: undefined,
      items: bodyClaims.slice(0, 5).map(c => ({ title: agendaTitleForClaim(c), body: c.support || c.proof_object || '' }))
    });
  }
  const bodySlides = presentationClaims
    .filter(c => c.narrative_role !== 'decision')
    .slice(0, targetContract.bodyLimit)
    .map(c => companyIntro ? slideFromCompanyIntroClaim(c, extraction, bundle, industry) : slideFromClaim(c, extraction, bundle));
  let dedupeReport = [];
  if (companyIntro) {
    const profileSlide = slides.find(s => s.type === 'company-profile-spread' || s.type === 'profile-proof') || {};
    const filtered = filterCompanyIntroDuplicateSlides(bodySlides, profileSlide);
    dedupeReport = filtered.removed;
    slides.push(...applyCompanyIntroRhythm(filtered.slides));
  } else {
    slides.push(...bodySlides);
  }
  const decision = bodyClaims.find(c => c.narrative_role === 'decision') || claims.find(c => c.narrative_role === 'decision');
  slides.push({
    type: 'closing',
    title: companyIntro ? '谢谢观看' : (decision ? decision.claim : '下一步行动'),
    subtitle: companyIntro ? (doc.organization || displayTitle) : (decision ? decision.support || '' : doc.decision_goal || '确认范围、事实口径和评审节奏。'),
    proofObject: companyIntro ? undefined : (decision ? (decision.proof_object || decision.proofObject || 'premium-closing-anchor') : 'premium-closing-anchor'),
    proof: companyIntro || !decision ? undefined : proofObjectForClaim(decision, extraction, bundle),
    closingVariant: companyIntro ? 'company-thanks' : undefined,
    label: companyIntro ? '致谢' : undefined,
    showMeta: companyIntro ? false : undefined,
    contacts: companyIntro ? contacts : (contacts.length ? contacts : undefined),
    actions: companyIntro
      ? (contacts.length ? undefined : [
          { title: '目标场景确认', body: '对齐行业、工艺段和产线边界。' },
          { title: '重点案例核验', body: '筛选可公开展示的项目证据。' },
          { title: '技术方案评审', body: '进入参数、交付范围和排期讨论。' }
        ])
      : (decision ? textItems(decision.bullets, ['确认范围', '补齐事实', '进入评审']) : [{ title: '确认范围', body: '对齐受众与决策目标。' }, { title: '补齐事实', body: '补充缺失数据与素材授权。' }, { title: '进入评审', body: '生成 PPTX 并完成 QA。' }]),
    visual: firstImage && companyIntro ? { mode: 'photo', role: 'closing', image: firstImage } : undefined,
    sourceTrace: decision ? sourceTraceForClaim(decision, extraction, bundle) : undefined
  });

  const plan = {
    style: options.style || 'premium-commercial-keynote',
    industry,
    requestedSlideCount: targetContract.requested,
    targetSlides: Object.assign({}, targetContract, { actual: slides.length }),
    claimSpine: claimSpineContract(claims, extraction, bundle),
    deckArtDirection: extraction.deck_art_direction || extraction.deckArtDirection || {},
    palette: (extraction.deck_art_direction && extraction.deck_art_direction.palette) || (extraction.deckArtDirection && extraction.deckArtDirection.palette) || undefined,
    visualMode: 'auto',
    visualIntent: (bundle.images || []).length >= 3 ? 'case-led' : 'strategy',
    title: displayTitle,
    subtitle,
    coverInsight: subtitle,
    organization: doc.organization || undefined,
    audience: companyIntro ? undefined : doc.audience || undefined,
    date: companyIntro ? undefined : doc.date || undefined,
    language,
    visibleLanguagePolicy: extraction.visible_language_policy || extraction.visibleLanguagePolicy || doc.visible_language_policy || doc.visibleLanguagePolicy || undefined,
    showMeta: companyIntro ? false : undefined,
    coverKicker: companyIntro ? false : undefined,
    footer: companyIntro ? (doc.organization || displayTitle) : title,
    coverMetrics: coverMetricClaim ? coverMetricClaim.metrics.slice(0, 5) : undefined,
    coverTags: industry === 'manufacturing-operations' ? ['工艺', '输送', '控制', '交付'] : undefined,
    materialIntelligence: {
      bundleVersion: bundle.version,
      extractionVersion: extraction.version,
      decisionGoal: doc.decision_goal || '',
      pptType: doc.ppt_type || '',
      missingInfo: extraction.missing_info || [],
      commercialRisks: extraction.commercial_risks || [],
      assetRights: extraction.asset_rights || '',
      clarifications: extraction.clarifications || [],
      claimSpine: claimSpineContract(claims, extraction, bundle),
      targetSlides: Object.assign({}, targetContract, { actual: slides.length }),
      deckArtDirection: extraction.deck_art_direction || extraction.deckArtDirection || {},
      referenceContext: referenceContextForPrompt(bundle, { industry }),
      materialHygiene: materialHygieneSummary(bundle),
      dedupedSlides: dedupeReport,
      facts: extraction.facts || [],
      evidence: extraction.evidence || []
    },
    contacts,
    commercialReview: {
      readyForExternalUse: false,
      openRisks: [
        ...(extraction.commercial_risks || []),
        ...(contacts.length ? [] : ['缺少可外发展示的联系人/官网/地址/二维码']),
        ...((extraction.asset_rights && !/用户自有|public|公开|授权/i.test(extraction.asset_rights)) ? [`素材授权状态：${extraction.asset_rights}`] : [])
      ]
    },
    slides
  };
  const normalizedPlan = normalizeDeckPlan(plan);
  normalizedPlan.language = normalizedPlan.language || language || inferDeckLanguage(normalizedPlan);
  normalizedPlan.visibleLanguagePolicy = languagePolicyFor(normalizedPlan);
  normalizedPlan.assetAuthorizationGate = assetAuthorizationGate(normalizedPlan, normalizedPlan);
  return normalizedPlan;
}

module.exports = {
  applyClarificationAnswers,
  buildClarificationGate,
  buildModelPrompt,
  bundleForPrompt,
  compileDeckPlan,
  detectIndustry,
  extractionSchema,
  ingestMaterials,
  readJson,
  referenceContextForPrompt,
  validateExtraction,
  writeJson
};
