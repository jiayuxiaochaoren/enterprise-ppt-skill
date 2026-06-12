const { extractNumbers } = require('./common');
const { evidenceById, sourceById } = require('./source-trace');
const {
  sourceIdValues,
  toArray
} = require('../design/source-evidence');

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
  const hasMetricPage = entry => entry && (entry.page || entry.pageRef || entry.pageNumber || entry.sourcePage);
  const hasMetricExcerpt = entry => entry && (entry.excerpt || entry.sourceExcerpt || entry.source_excerpt || entry.originalExcerpt);
  const textSources = toArray(sourceTrace.sources).filter(entry => entry && entry.kind !== 'image');
  const textSource = textSources.find(entry => hasMetricPage(entry) && hasMetricExcerpt(entry)) || textSources[0];
  if (!textSource) return metric;
  const sourceIds = sourceIdValues(metric.sourceId, metric.source_id, textSource.id);
  const sourceId = sourceIds[0] || '';
  const page = metric.sourcePage || metric.source_page || textSource.page || textSource.pageRef || textSource.pageNumber || textSource.sourcePage;
  const excerpt = metric.sourceExcerpt || metric.source_excerpt || textSource.excerpt || textSource.sourceExcerpt || textSource.source_excerpt || textSource.originalExcerpt;
  return Object.assign({}, metric, {
    sourceId,
    sourcePage: page,
    sourceExcerpt: excerpt,
    sourceTrace: {
      version: 'metric-source-trace/v1',
      sourceIds,
      sources: [{
        id: sourceId,
        page,
        excerpt,
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
  const zh = /[\u3400-\u9fff]/.test(text);
  const pairs = [
    [/brand icon|operating engine|90-country|ART\/BEAUTY\/SCIENCE/i, 'Brand operating role'],
    [/product story|SKU|ingredient|Power Fermented|Camellia|30 years/i, zh ? 'SKU 组合' : 'Product proof'],
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
  toArray(claim.visuals).forEach(v => {
    sourceIdValues(v.source_id, v.sourceId, v.asset_source_id, v.assetSourceId).forEach(sourceId => {
      refs.push({ sourceId, caption: v.caption, role: v.role });
    });
  });
  sourceIdValues(claim.evidence_ids, claim.evidenceIds).forEach(id => {
    const ev = evMap.get(id);
    if (!ev) return;
    sourceIdValues(ev.asset_source_id, ev.assetSourceId).forEach(sourceId => {
      refs.push({ sourceId, caption: ev.summary || ev.title, role: ev.type });
    });
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

module.exports = {
  textItems,
  metricsFromClaim,
  attachMetricSourceTrace,
  businessLogicFromClaim,
  dataComponentForClaim,
  agendaTitleForClaim,
  imagesForClaim,
  chartFieldForProof,
  tableRowsFromClaim,
  contactListFromDoc,
  factText,
  externalUseCaveatText,
  claimVisibleText
};
