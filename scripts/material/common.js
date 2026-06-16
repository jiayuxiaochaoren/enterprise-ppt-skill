const fs = require('fs');
const path = require('path');
const { INDUSTRY_PACK_LIBRARY } = require('../design-system');

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
  /\bdowntime-pareto\b/i,
  /\bresponsibility-loop\b/i,
  /\bpermission-governance\b/i,
  /\bproof object\b/i,
  /\bpage family\b/i,
  /\blayout variant\b/i,
  /\bDOWNTIME PARETO\b/i,
  /\bRESPONSIBILITY LOOP\b/i,
  /脱敏模拟(?:数据|材料)?/,
  /不代表真实/,
  /外发前需替换/,
  /真实授权数据/,
  /仅用于[^，。；\n]{0,24}(?:测试|生成|演示)/,
  /PPT[^，。；\n]{0,12}测试/,
  /图表[^，。；\n]{0,12}测试/,
  /经营分析[^，。；\n]{0,12}测试/,
  /生成[^，。；\n]{0,12}测试/,
  /(?:simulated|dummy|test)\s+data/i,
  /not\s+real/i,
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

module.exports = {
  BAD_VISIBLE_COPY_PATTERNS,
  INDUSTRY_HINTS,
  INDUSTRY_ID_OPTIONS,
  MATERIAL_CONTAMINATION_PATTERNS,
  cleanPublicNote,
  classifyMaterialLine,
  compactUnique,
  conciseLines,
  ensureDirFor,
  extractNumbers,
  hasAny,
  hasBadVisibleCopy,
  readJson,
  sanitizeMaterialText,
  textBlob,
  usageError,
  writeJson
};
