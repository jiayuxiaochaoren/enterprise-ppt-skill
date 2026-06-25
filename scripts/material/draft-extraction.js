const path = require('path');
const { visualIndustryId } = require('../design-system');

const GENERIC_SOURCE_TITLE = /^(?:\d+[_-]?)?(?:企业|公司|品牌|项目|客户)?基础信息$/i;

function compactLine(text = '', max = 42) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function sourceExcerpt(source = {}) {
  return (source.candidateFacts && source.candidateFacts[0]) || String(source.text || '').slice(0, 140) || source.name || '';
}

function cleanDraftFact(text = '') {
  return String(text || '')
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function baseSourceName(source = {}) {
  return path.basename(source.name || '材料自动整理', path.extname(source.name || ''));
}

function sourceNameText(source = {}) {
  return String(source.name || '').trim();
}

function parseDelimitedField(line = '') {
  const match = String(line || '').match(/^\s*([^,，:：|]+?)\s*[,，:：|]\s*(.+?)\s*$/);
  if (!match) return null;
  return {
    key: String(match[1] || '').trim(),
    value: String(match[2] || '').trim()
  };
}

function organizationFromBundle(bundle = {}, primary = {}) {
  const lines = [
    ...((bundle.textSummary && bundle.textSummary.candidateFacts) || []),
    ...((primary.candidateFacts) || []),
    ...String(primary.text || '').split(/\r?\n/).slice(0, 24)
  ];
  for (const line of lines) {
    const parsed = parseDelimitedField(line);
    if (!parsed) continue;
    if (!/公司|企业|品牌|机构|单位|客户|项目/.test(parsed.key)) continue;
    if (!parsed.value || /^未知|n\/a|null$/i.test(parsed.value)) continue;
    return parsed.value;
  }
  return '';
}

function preferredDraftTitle(bundle = {}, primary = {}) {
  const sourceTitle = compactLine(baseSourceName(primary), 24) || '材料自动整理';
  const organization = compactLine(organizationFromBundle(bundle, primary), 24);
  if (organization) return organization;
  if (!GENERIC_SOURCE_TITLE.test(sourceTitle)) return sourceTitle;
  const heading = String(primary.text || '')
    .split(/\r?\n/)
    .map(line => String(line || '').replace(/^#+\s*/, '').trim())
    .find(line => line && line.length >= 3 && !GENERIC_SOURCE_TITLE.test(line));
  return compactLine(heading || sourceTitle, 24) || '材料自动整理';
}

function genericDraftSubtitle(industry = '') {
  if (industry === 'manufacturing-operations') {
    return '围绕经营底座、产品谱系、营收节奏、交付闭环与渠道效率形成经营复盘。';
  }
  return '围绕关键事实、经营证据与下一步动作形成汇报判断。';
}

function genericDraftDecisionGoal(industry = '') {
  if (industry === 'manufacturing-operations') {
    return '围绕交付底座、产品结构、营收节奏与渠道效率形成下一步经营判断。';
  }
  return '围绕事实口径、核心判断与下一步动作形成统一汇报。';
}

function tableSourceByName(bundle = {}, pattern) {
  return (bundle.sources || []).find(source =>
    Array.isArray(source.tables) &&
    source.tables.length &&
    pattern.test(sourceNameText(source))
  ) || null;
}

function firstTable(source = {}) {
  if (!source || typeof source !== 'object') return null;
  return Array.isArray(source.tables) && source.tables.length ? source.tables[0] : null;
}

function tableHeaderIndex(table = {}, pattern) {
  const headers = Array.isArray(table.headers) ? table.headers : [];
  return headers.findIndex(header => pattern.test(String(header || '')));
}

function tableCell(row = [], index = -1) {
  if (!Array.isArray(row) || index < 0 || index >= row.length) return '';
  return String(row[index] == null ? '' : row[index]).trim();
}

function numericValue(value, fallback = 0) {
  const n = Number(String(value == null ? '' : value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function formatWan(value = 0) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '';
  return `${n.toFixed(n >= 1000 ? 0 : 1).replace(/\.0$/, '')} 万元`;
}

function formatX(value = 0) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '';
  return `${n.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}x`;
}

function lineSourceRef(source = {}, excerpt = '') {
  const id = source && source.id ? source.id : 'src-001';
  const text = String(excerpt || sourceExcerpt(source) || '').trim();
  return {
    source_ids: [id],
    source_pages: { [id]: 1 },
    source_excerpts: { [id]: text || sourceNameText(source) || '材料摘录' }
  };
}

function basicInfoMap(source = {}) {
  const out = {};
  const lines = [
    ...((source.candidateFacts) || []),
    ...String(source.text || '').split(/\r?\n/)
  ];
  lines.forEach(line => {
    const parsed = parseDelimitedField(line);
    if (!parsed) return;
    out[parsed.key] = parsed.value;
  });
  return out;
}

function manufacturingFoundationClaim(source = {}, info = {}) {
  const organization = info['公司/品牌代号'] || info['公司'] || info['品牌'] || info['企业名称'] || '';
  const employees = info['员工规模'] || '';
  const projects = info['年度交付项目'] || '';
  const revenue = info['2025年模拟营收规模'] || info['营收规模'] || '';
  const growth = info['核心增长目标'] || '';
  const metrics = [
    employees ? { label:'团队规模', value:employees, note:'制造、交付与服务团队' } : null,
    projects ? { label:'年度交付项目', value:projects, note:'体现项目交付广度' } : null,
    revenue ? { label:'营收规模', value:revenue, note:'2025 经营体量' } : null,
    growth ? { label:'增长目标', value:growth, note:'下一阶段经营要求' } : null
  ].filter(Boolean);
  const supportParts = [
    organization ? `${organization}已形成制造业务主体` : '',
    employees ? `${employees}人团队` : '',
    projects ? `${projects}个年度交付项目` : '',
    revenue || growth
  ].filter(Boolean);
  const support = supportParts.join('，') || sourceExcerpt(source);
  return Object.assign({
    id: 'claim-001',
    narrative_role: 'diagnosis',
    claim: '经营底座已具备规模化交付基础',
    support,
    proof_object: 'metric-board',
    metrics,
    business_logic: {
      current_state: support,
      impact: '经营底座决定产线扩张、项目交付和后续服务能否被持续承接。',
      cause: '团队规模、交付项目与营收目标虽然存在，但尚未被整理为可汇报的统一口径。',
      action: '先把规模、交付能力和增长目标拉到同一页，作为后续判断的底座。',
      metric: '团队规模、年度交付项目、营收规模、增长目标'
    },
    display_copy: {
      title: '经营底座已具备规模化交付基础',
      subtitle: '把团队规模、交付能力和营收目标放到同一页，先确认制造增长底座。',
      core_title: '经营底座',
      core_body: '团队、项目交付和营收目标共同定义这家制造企业的扩张上限。'
    },
    confidence: 0.62
  }, lineSourceRef(source, support));
}

function manufacturingProductClaim(source = {}) {
  const table = firstTable(source);
  if (!table) return null;
  const categoryIdx = tableHeaderIndex(table, /一级分类/);
  const nameIdx = tableHeaderIndex(table, /产品\/服务名称|产品名称|服务名称/);
  const revenueIdx = tableHeaderIndex(table, /销售额/);
  const marginIdx = tableHeaderIndex(table, /毛利率/);
  const rows = Array.isArray(table.rows) ? table.rows : [];
  const byCategory = new Map();
  rows.forEach(row => {
    const category = tableCell(row, categoryIdx);
    if (!category) return;
    const current = byCategory.get(category) || { revenue:0, count:0, margin:0 };
    current.revenue += numericValue(tableCell(row, revenueIdx), 0);
    current.margin += numericValue(tableCell(row, marginIdx), 0);
    current.count += 1;
    byCategory.set(category, current);
  });
  const categories = Array.from(byCategory.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 4);
  if (!categories.length) return null;
  const topNames = rows
    .slice()
    .sort((a, b) => numericValue(tableCell(b, revenueIdx), 0) - numericValue(tableCell(a, revenueIdx), 0))
    .slice(0, 4)
    .map(row => tableCell(row, nameIdx))
    .filter(Boolean);
  const topCategory = categories[0][0];
  const supporting = categories.slice(1, 3).map(item => item[0]);
  const support = supporting.length
    ? `${topCategory}贡献规模最高，${supporting.join('、')}共同构成第二梯队。`
    : `${topCategory}是当前产品与服务组合中的核心承接项。`;
  return Object.assign({
    id: 'claim-002',
    narrative_role: 'solution',
    claim: '产品组合应由装配线、改造与维保共同托住利润质量',
    support,
    proof_object: 'production-topology',
    bullets: topNames.length ? topNames : categories.map(item => item[0]),
    business_logic: {
      current_state: `${topCategory}贡献规模最高，但产品与服务仍需要按交付动作归整。`,
      impact: '如果产品对象、制造动作和交付资料分散，客户很难快速判断适配范围。',
      cause: 'SKU、改造包、维保服务和软件能力还没有映射到同一张制造结构图。',
      action: '按产品对象、制造动作和交付资料重排产品组合表达。',
      metric: '分类销售额、毛利率、交付状态'
    },
    display_copy: {
      title: '产品组合应由装配线、改造与维保共同托住利润质量',
      subtitle: support,
      core_title: '产品与交付对象',
      core_body: '把高贡献产品、制造动作和交付资料放到同一张工业结构图里。'
    },
    confidence: 0.64
  }, lineSourceRef(source, topNames[0] || support));
}

function manufacturingMonthlyTrendClaim(source = {}) {
  const table = firstTable(source);
  if (!table) return null;
  const monthIdx = tableHeaderIndex(table, /月份|month/i);
  const revenueIdx = tableHeaderIndex(table, /营收/);
  const ordersIdx = tableHeaderIndex(table, /订单数|服务单数/);
  const rows = Array.isArray(table.rows) ? table.rows : [];
  const byMonth = new Map();
  rows.forEach(row => {
    const month = tableCell(row, monthIdx);
    if (!month) return;
    const current = byMonth.get(month) || { revenue:0, orders:0 };
    current.revenue += numericValue(tableCell(row, revenueIdx), 0);
    current.orders += numericValue(tableCell(row, ordersIdx), 0);
    byMonth.set(month, current);
  });
  const monthly = Array.from(byMonth.entries())
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .slice(-6)
    .map(([label, item]) => ({
      label,
      value: Number(item.revenue.toFixed(2)),
      note: `${Math.round(item.orders)} 单`
    }));
  if (monthly.length < 2) return null;
  const min = monthly.reduce((best, item) => item.value < best.value ? item : best, monthly[0]);
  const last = monthly[monthly.length - 1];
  const support = `${min.label}回落到 ${formatWan(min.value)}，随后恢复到 ${last.label}的 ${formatWan(last.value)}，节奏波动仍需重点渠道承接。`;
  return Object.assign({
    id: 'claim-003',
    narrative_role: 'evidence',
    claim: '月度营收有修复，但节奏波动仍需重点承接',
    support,
    proof_object: 'monthly-pulse-trend',
    data: monthly,
    business_logic: {
      current_state: `${min.label}出现低谷，${last.label}回到恢复区间。`,
      impact: '月度节奏波动会直接影响产能排班、现金计划和渠道预算分层。',
      cause: '订单承接和重点渠道节奏没有形成稳定的月度复盘口径。',
      action: '把低谷月份、恢复月份和订单承接动作绑定到月度经营节奏。',
      metric: '月度营收、订单数/服务单数'
    },
    display_copy: {
      title: '月度营收有修复，但节奏波动仍需重点承接',
      subtitle: support,
      core_title: '月度趋势',
      core_body: '把波峰、波谷和订单承接节奏放进同一张月度趋势图。'
    },
    confidence: 0.66
  }, lineSourceRef(source, support));
}

function manufacturingChannelClaim(source = {}) {
  const table = firstTable(source);
  if (!table) return null;
  const channelIdx = tableHeaderIndex(table, /渠道|业务线/);
  const regionIdx = tableHeaderIndex(table, /区域/);
  const spendIdx = tableHeaderIndex(table, /投入费用|费用/);
  const roasIdx = tableHeaderIndex(table, /ROI|ROAS/);
  const orderIdx = tableHeaderIndex(table, /成交|有效订单/);
  const statusIdx = tableHeaderIndex(table, /状态/);
  const items = (Array.isArray(table.rows) ? table.rows : [])
    .map(row => ({
      label: `${tableCell(row, channelIdx)}·${tableCell(row, regionIdx)}`.replace(/^·|·$/g, ''),
      x: numericValue(tableCell(row, spendIdx), NaN),
      y: numericValue(tableCell(row, roasIdx), NaN),
      value: formatX(numericValue(tableCell(row, roasIdx), NaN)),
      body: [tableCell(row, statusIdx), tableCell(row, orderIdx) ? `成交 ${tableCell(row, orderIdx)} 单` : ''].filter(Boolean).join('；')
    }))
    .filter(item => item.label && Number.isFinite(item.x) && Number.isFinite(item.y))
    .sort((a, b) => b.y - a.y)
    .slice(0, 6);
  if (items.length < 3) return null;
  const leaders = items.slice(0, 3).map(item => item.label);
  const support = `${leaders.join('、')}等样本 ROAS 更高，预算分配应按效率分层，而不是平均加码。`;
  return Object.assign({
    id: 'claim-004',
    narrative_role: 'evidence',
    claim: '渠道预算要按效率分层，而不是平均加码',
    support,
    proof_object: 'channel-efficiency-matrix',
    data: items,
    business_domain: 'operations',
    chain_stage: 'evidence',
    depth_domain: 'channel-economics',
    proof_intent: 'manufacturing channel economics',
    business_logic: {
      current_state: `${leaders[0]}等样本 ROAS 更高，但预算仍分散在不同区域和渠道。`,
      impact: '平均加码会稀释高效率样本，放大低效触点的预算浪费。',
      cause: '预算和签约回收没有按 ROI/ROAS 分层管理。',
      action: '优先保留高回收样本，再压缩低效区域和待优化触点。',
      metric: '投入费用、成交/有效订单、ROI/ROAS'
    },
    display_copy: {
      title: '渠道预算要按效率分层，而不是平均加码',
      subtitle: support,
      core_title: '效率样本',
      core_body: '先看高效率触点，再看高投入触点的转化承接和复购贡献。'
    },
    confidence: 0.67
  }, lineSourceRef(source, leaders[0] || support));
}

function manufacturingIssueRankingClaim(source = {}) {
  const table = firstTable(source);
  if (!table) return null;
  const concernIdx = tableHeaderIndex(table, /核心顾虑|顾虑|问题/);
  const segmentIdx = tableHeaderIndex(table, /客群标签|客户标签|客群/);
  const counts = new Map();
  const segmentSamples = new Map();
  (Array.isArray(table.rows) ? table.rows : []).forEach(row => {
    const concern = tableCell(row, concernIdx);
    if (!concern) return;
    counts.set(concern, (counts.get(concern) || 0) + 1);
    const segment = tableCell(row, segmentIdx);
    if (segment) {
      const bucket = segmentSamples.get(concern) || [];
      if (bucket.length < 2 && !bucket.includes(segment)) bucket.push(segment);
      segmentSamples.set(concern, bucket);
    }
  });
  const items = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, value]) => ({
      title,
      value,
      body: (segmentSamples.get(title) || []).join('、')
    }));
  if (!items.length) return null;
  const support = `${items.slice(0, 3).map(item => item.title).join('、')}出现频次最高，说明决策门槛仍集中在交付和回款承诺。`;
  return Object.assign({
    id: 'claim-005',
    narrative_role: 'evidence',
    claim: '客户顾虑集中在交付周期、回款节点与售后响应',
    support,
    proof_object: 'issue-frequency-ranking',
    data: items,
    metrics: items.slice(0, 3).map(item => ({
      label: item.title,
      value: String(item.value),
      note: item.body || '高频顾虑'
    })),
    business_logic: {
      current_state: `${items[0].title}、${items[1] ? items[1].title : '交付承诺'}等顾虑出现频次最高。`,
      impact: '这些顾虑会拖慢决策转化，也会抬高项目售前沟通成本。',
      cause: '客户缺少清晰案例、交付承诺和售后响应边界的可视证据。',
      action: '把高频顾虑重新映射到交付周期、认证、回款和售后响应承诺。',
      metric: '顾虑频次、客群标签、NPS/续费意向'
    },
    display_copy: {
      title: '客户顾虑集中在交付周期、回款节点与售后响应',
      subtitle: support,
      core_title: '高频顾虑排序',
      core_body: '客户声音应直接回到交付周期、认证、回款和售后响应这些真实决策门槛。'
    },
    confidence: 0.68
  }, lineSourceRef(source, items[0].title || support));
}

function manufacturingFunnelClaim(source = {}) {
  const table = firstTable(source);
  if (!table) return null;
  const spendIdx = tableHeaderIndex(table, /费用/);
  const exposureIdx = tableHeaderIndex(table, /曝光|触达/);
  const clickIdx = tableHeaderIndex(table, /点击|咨询|到店/);
  const leadIdx = tableHeaderIndex(table, /线索/);
  const dealIdx = tableHeaderIndex(table, /成交订单|签约/);
  const revenueIdx = tableHeaderIndex(table, /贡献营收|营收/);
  let spend = 0;
  let exposure = 0;
  let clicks = 0;
  let leads = 0;
  let deals = 0;
  let revenue = 0;
  (Array.isArray(table.rows) ? table.rows : []).forEach(row => {
    spend += numericValue(tableCell(row, spendIdx), 0);
    exposure += numericValue(tableCell(row, exposureIdx), 0);
    clicks += numericValue(tableCell(row, clickIdx), 0);
    leads += numericValue(tableCell(row, leadIdx), 0);
    deals += numericValue(tableCell(row, dealIdx), 0);
    revenue += numericValue(tableCell(row, revenueIdx), 0);
  });
  if (!(exposure && clicks && leads && deals)) return null;
  const roas = spend > 0 ? revenue / spend : 0;
  const support = `活动累计贡献营收 ${formatWan(revenue)}，整体 ROAS ${formatX(roas)}；从触达到签约仍有明显漏损。`;
  return Object.assign({
    id: 'claim-006',
    narrative_role: 'proof',
    claim: '营销活动有回收，但高质量线索转化仍是关键瓶颈',
    support,
    proof_object: 'adoption-funnel',
    data: {
      steps: [
        { label:'曝光/触达', value: exposure },
        { label:'点击/咨询', value: clicks },
        { label:'线索', value: leads },
        { label:'成交签约', value: deals }
      ]
    },
    business_logic: {
      current_state: `当前活动沉淀了 ${leads} 条线索和 ${deals} 个签约。`,
      impact: '如果中段转化漏损不受控，投放预算会很难稳定沉淀为高质量订单。',
      cause: '触达、咨询、线索和签约之间缺少统一复盘口径。',
      action: '把活动从曝光到签约拆成阶段漏斗，定位中段掉点。',
      metric: '曝光/触达、点击/咨询、线索、成交签约、ROAS'
    },
    display_copy: {
      title: '营销活动有回收，但高质量线索转化仍是关键瓶颈',
      subtitle: support,
      core_title: '阶段转化链路',
      core_body: '活动复盘不能只看花费回收，更要看从触达到成交的层层漏损。'
    },
    confidence: 0.67
  }, lineSourceRef(source, support));
}

function manufacturingLoopClaim(source = {}) {
  const support = '把需求确认、制造交付、现场验收和维保复盘串成同一条经营闭环，项目经验才能稳定沉淀和复用。';
  return Object.assign({
    id: 'claim-004',
    narrative_role: 'operating-model',
    claim: '制造交付要把项目、安装、验收和维保放进同一闭环',
    support,
    proof_object: 'maintenance-loop',
    bullets: ['需求确认', '制造交付', '现场验收', '维保复盘'],
    phases: [
      { title:'需求确认', body:'先锁定客户场景、工艺范围与验收边界，避免后段返工。' },
      { title:'制造交付', body:'把设计、制造、现场安装和资料包按同一节奏推进。' },
      { title:'现场验收', body:'以调试结果、验收清单和回款节点完成正式交接。' },
      { title:'维保复盘', body:'把售后问题、备件经验和交付偏差回流到下一轮方案。' }
    ],
    business_domain: 'operations',
    chain_stage: 'promise',
    depth_domain: 'operating-loop',
    proof_intent: 'manufacturing delivery loop',
    business_logic: {
      current_state: '项目交付、现场安装、验收和维保动作分散在不同团队与资料里。',
      impact: '没有闭环时，经验很难复用，项目风险也会后移到验收和售后阶段。',
      cause: '制造动作、交付资料和复盘节点没有被同一条运营路径串起来。',
      action: '用闭环页把对象、动作、交付资料和复盘节奏映射到同一路径。',
      metric: '交付周期、验收通过率、维保续约'
    },
    display_copy: {
      title: '制造交付要把项目、安装、验收和维保放进同一闭环',
      subtitle: '把需求、安装、验收和维保放进同一条经营路径，项目经验才能被持续复用。',
      core_title: '制造交付闭环',
      core_body: '从需求确认到维保复盘，经营动作必须和交付资料一一对应。'
    },
    confidence: 0.64
  }, lineSourceRef(source, support));
}

function manufacturingDraftClaims(bundle = {}, primary = {}) {
  const basicSource = tableSourceByName(bundle, /企业基础信息|基础信息/) || primary;
  const productSource = tableSourceByName(bundle, /产品服务|产品.*明细|服务明细/);
  const monthlySource = tableSourceByName(bundle, /月度经营|月度.*数据|经营数据/);
  const channelSource = tableSourceByName(bundle, /渠道区域|渠道.*数据|ROI|ROAS/);
  const surveySource = tableSourceByName(bundle, /调研|客户.*样本|消费者/);
  const activitySource = tableSourceByName(bundle, /营销活动|投放数据|活动投放/);
  const claims = [
    manufacturingFoundationClaim(basicSource, basicInfoMap(basicSource)),
    manufacturingProductClaim(productSource),
    manufacturingMonthlyTrendClaim(monthlySource),
    manufacturingLoopClaim(basicSource),
    manufacturingChannelClaim(channelSource),
    manufacturingIssueRankingClaim(surveySource),
    manufacturingFunnelClaim(activitySource)
  ].filter(Boolean);
  return claims.map((claim, index) => Object.assign({}, claim, {
    id: `claim-${String(index + 1).padStart(3, '0')}`
  }));
}

function buildDraftExtraction(bundle = {}, opts = {}) {
  const textSources = (bundle.sources || []).filter(source => source.kind !== 'image' && String(source.text || '').trim());
  const primary = textSources[0] || (bundle.sources || [])[0] || { id: 'src-001', name: '材料' };
  const topIndustry = bundle.textSummary && bundle.textSummary.industryCandidates && bundle.textSummary.industryCandidates[0];
  const industry = topIndustry && Number(topIndustry.score || 0) >= 2
    ? (visualIndustryId(topIndustry.industry) || topIndustry.industry)
    : 'general-operations';
  const facts = (bundle.textSummary && bundle.textSummary.candidateFacts || [])
    .map(cleanDraftFact)
    .filter(Boolean)
    .slice(0, 6)
    .map((line, i) => ({
      id: `fact-${String(i + 1).padStart(3, '0')}`,
      text: line,
      source_ids: [primary.id],
      source_pages: { [primary.id]: 1 },
      source_excerpts: { [primary.id]: line },
      confidence: 0.6
    }));
  while (facts.length < 2) {
    const fallback = sourceExcerpt(primary) || `材料事实 ${facts.length + 1}`;
    facts.push({
      id: `fact-${String(facts.length + 1).padStart(3, '0')}`,
      text: fallback,
      source_ids: [primary.id],
      source_pages: { [primary.id]: 1 },
      source_excerpts: { [primary.id]: fallback },
      confidence: 0.45
    });
  }
  const organization = organizationFromBundle(bundle, primary);
  const title = preferredDraftTitle(bundle, primary);
  const sourceIds = [primary.id].filter(Boolean);
  const claimLines = facts.slice(0, 4).map(fact => fact.text);
  const specializedClaims = industry === 'manufacturing-operations'
    ? manufacturingDraftClaims(bundle, primary)
    : [];
  const claims = specializedClaims.length >= 4
    ? specializedClaims
    : claimLines.map((line, i) => ({
      id: `claim-${String(i + 1).padStart(3, '0')}`,
      narrative_role: ['diagnosis', 'evidence', 'solution', 'operating-model'][i] || 'evidence',
      claim: compactLine(line, 30),
      support: line,
      proof_object: i === 0 ? 'diagnosis-board' : (i === 1 ? 'value-signal' : 'process-map'),
      source_ids: sourceIds,
      source_pages: { [primary.id]: 1 },
      source_excerpts: { [primary.id]: line },
      confidence: 0.55
    }));
  claims.push({
    id: `claim-${String(claims.length + 1).padStart(3, '0')}`,
    narrative_role: 'decision',
    claim: '下一步确认事实口径与交付边界',
    support: '建议统一经营口径，并补齐重点客户样本、交付资料和关键联系人信息。',
    proof_object: 'decision-summary',
    source_ids: sourceIds,
    source_pages: { [primary.id]: 1 },
    source_excerpts: { [primary.id]: sourceExcerpt(primary) },
    bullets: ['统一经营口径', '补齐重点样本与资料', '进入正式设计评审'],
    confidence: 0.5
  });
  return {
    version: 'material-extraction/v1',
    document: {
      title,
      subtitle: genericDraftSubtitle(industry),
      ppt_type: 'draft',
      industry,
      organization: organization || undefined,
      decision_goal: genericDraftDecisionGoal(industry),
      targetSlides: opts.targetSlides
    },
    facts,
    evidence: claims.filter(claim => claim.narrative_role !== 'decision').slice(0, 6).map((claim, i) => ({
      id: `ev-${String(i + 1).padStart(3, '0')}`,
      type: 'text',
      title: compactLine(claim.claim || claim.support || `证据 ${i + 1}`, 22),
      summary: claim.support || claim.claim || '',
      source_ids: claim.source_ids,
      excerpt: (claim.source_excerpts && claim.source_excerpts[claim.source_ids[0]]) || claim.support || claim.claim || ''
    })),
    claim_spine: claims,
    missing_info: [
      '该 deck 由 --auto-draft 生成，只能作为内部草案；正式交付需补齐模型抽取、事实复核和素材授权。'
    ],
    commercial_risks: [
      '自动草案未经过人工 source audit / model critic，不建议直接外发。'
    ],
    asset_rights: 'unknown'
  };
}

module.exports = {
  buildDraftExtraction,
  cleanDraftFact,
  compactLine,
  sourceExcerpt
};
