#!/usr/bin/env node
/*
Generate cross-industry stress-test decks for the premium-commercial-ppt skill.

The goal is regression coverage, not a one-off showcase: each plan leaves most
slides as `content` so the router must pick the right page family from signals.
*/
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { normalizeDeckPlan } = require('./design-system');

const ROOT = path.resolve(__dirname, '..');
const OUT_ROOT = path.join(ROOT, 'out', 'industry-stress-v8');
fs.rmSync(OUT_ROOT, { recursive: true, force: true });

function rel(p) {
  return path.relative(ROOT, p);
}

function runNode(script, args, opts = {}) {
  const out = cp.execFileSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: opts.timeout || 120000
  });
  return out.trim();
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}
function writeBinary(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

function existing(paths) {
  return paths.filter(p => fs.existsSync(path.join(ROOT, p)));
}

function routeSummary(slides = []) {
  return slides.reduce((acc, slide) => {
    const key = slide.layoutVariant ? `${slide.type}:${slide.layoutVariant}` : slide.type;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

const retailGallery = existing([
  'out/reference-library-v5/assets/retail-boutique-1.jpg',
  'out/reference-library-v5/assets/retail-boutique-2.jpg',
  'out/reference-library-v5/assets/retail-boutique-3.jpg'
]);

const stressAssetDir = path.join(OUT_ROOT, 'assets');

function pngScene(bg, accent, secondary, motif='dashboard', size={}) {
  const zlib = require('zlib');
  const width = size.w || 1200;
  const height = size.h || 800;
  const px = Buffer.alloc(width * height * 3);
  const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const bgRgb = hex(bg);
  for (let i=0; i<px.length; i+=3) { px[i]=bgRgb[0]; px[i+1]=bgRgb[1]; px[i+2]=bgRgb[2]; }
  const blend = (x,y,color,alpha=1) => {
    if (x<0 || y<0 || x>=width || y>=height) return;
    const [r,g,b] = hex(color);
    const i = (Math.floor(y)*width + Math.floor(x))*3;
    px[i] = Math.round(px[i]*(1-alpha)+r*alpha);
    px[i+1] = Math.round(px[i+1]*(1-alpha)+g*alpha);
    px[i+2] = Math.round(px[i+2]*(1-alpha)+b*alpha);
  };
  const rect = (x,y,w,h,color,alpha=1) => {
    for (let yy=Math.max(0,Math.floor(y)); yy<Math.min(height,Math.floor(y+h)); yy++) {
      for (let xx=Math.max(0,Math.floor(x)); xx<Math.min(width,Math.floor(x+w)); xx++) blend(xx,yy,color,alpha);
    }
  };
  const circle = (cx,cy,r,color,alpha=1) => {
    const r2 = r*r;
    for (let yy=Math.max(0,Math.floor(cy-r)); yy<Math.min(height,Math.floor(cy+r)); yy++) {
      for (let xx=Math.max(0,Math.floor(cx-r)); xx<Math.min(width,Math.floor(cx+r)); xx++) {
        const dx=xx-cx, dy=yy-cy;
        if (dx*dx+dy*dy <= r2) blend(xx,yy,color,alpha);
      }
    }
  };
  const line = (x1,y1,x2,y2,color,alpha=1,thick=8) => {
    const steps = Math.max(Math.abs(x2-x1), Math.abs(y2-y1));
    for (let i=0; i<=steps; i++) {
      const t = i/Math.max(1,steps);
      circle(x1+(x2-x1)*t, y1+(y2-y1)*t, thick/2, color, alpha);
    }
  };
  const strokeRect = (x,y,w,h,color,alpha=1,thick=4) => {
    rect(x,y,w,thick,color,alpha);
    rect(x,y+h-thick,w,thick,color,alpha);
    rect(x,y,thick,h,color,alpha);
    rect(x+w-thick,y,thick,h,color,alpha);
  };
  const card = (x,y,w,h,alpha=0.86) => {
    rect(x,y,w,h,'#FFFFFF',alpha);
    strokeRect(x,y,w,h,'#D7E0EA',0.72,3);
  };
  circle(920, 120, 260, accent, 0.10);
  circle(100, 720, 220, secondary, 0.12);
  if (motif === 'portfolio') {
    card(110,92,980,590,0.92);
    rect(110,92,980,72,'#0F172A',0.96);
    rect(150,206,210,300,'#0F172A',0.92);
    [0,1,2].forEach(i => {
      card(410+i*195,206,160,86,0.86);
      rect(436+i*195,242,72,12,accent,i===0?0.90:0.58);
      rect(436+i*195,270,94,10,'#94A3B8',0.35);
    });
    [0,1,2,3,4].forEach(i => {
      const h = [172,120,148,88,198][i];
      rect(430+i*92,560-h,48,h,i===3?'#EF4444':accent,i===3?0.72:0.58);
    });
    rect(840,214,190,252,'#EEF4FB',0.92);
    [0,1,2,3].forEach(i => rect(870,252+i*42,120,10,i===2?secondary:accent,i===2?0.62:0.45));
  } else if (motif === 'deal') {
    card(112,94,440,590,0.88);
    card(620,132,420,510,0.84);
    rect(154,154,180,20,accent,0.42);
    [0,1,2,3].forEach(i => {
      rect(154,230+i*72,300,12,'#94A3B8',0.36);
      rect(154,256+i*72,210+i*28,10, i===1 ? secondary : accent, i===1 ? 0.45 : 0.35);
    });
    circle(780,310,92,accent,0.18);
    circle(780,310,48,secondary,0.28);
    [0,1,2].forEach(i => card(686+i*78,474,58,84,0.80));
  } else if (motif === 'clinic') {
    card(108,108,984,552,0.88);
    rect(108,108,984,68,'#12302F',0.95);
    ['#EAF4F0','#F4F8EF','#EAF5F6'].forEach((fill,i)=>rect(152,230+i*116,860,70,fill,0.92));
    [0,1,2,3].forEach(i => {
      const x = 210 + i*204;
      circle(x,264,24,i%2?secondary:accent,0.58);
      if (i<3) line(x+28,264,x+176,264,accent,0.30,6);
      rect(x-52,380,104,38,'#FFFFFF',0.86);
      strokeRect(x-52,380,104,38,i%2?secondary:accent,0.46,3);
      rect(x-38,488,146,12,i%2?secondary:accent,0.42);
    });
  } else if (motif === 'product') {
    card(104,94,992,604,0.92);
    rect(104,94,210,604,'#0F172A',0.96);
    rect(356,140,620,48,'#EEF4FF',0.95);
    [0,1,2].forEach(i => card(356+i*206,226,170,122,0.90));
    [0,1,2,3].forEach(i => rect(382,410+i*42,540,16,i%2?secondary:accent,i%2?0.34:0.42));
    rect(740,456,236,170,'#F1F5FF',0.92);
    [0,1,2,3,4].forEach(i => rect(176,174+i*70,82,12,i===0?accent:'#CBD5E1',i===0?0.86:0.36));
  } else if (motif === 'product-flow') {
    card(86,126,440,500,0.90);
    card(674,126,440,500,0.90);
    rect(86,126,440,62,'#0F172A',0.94);
    rect(674,126,440,62,'#0F172A',0.94);
    [0,1,2].forEach(i => rect(142,246+i*84,290,20,i===1?secondary:accent,i===1?0.45:0.36));
    [0,1,2].forEach(i => rect(730,246+i*84,290,20,i===2?secondary:accent,i===2?0.45:0.36));
    line(540,374,650,374,accent,0.62,10);
    circle(596,374,34,accent,0.18);
  } else if (motif === 'service') {
    card(116,118,948,530,0.86);
    circle(270,250,72,accent,0.18); circle(500,250,72,secondary,0.20); circle(730,250,72,accent,0.14);
    line(342,250,428,250,accent,0.42,8); line(572,250,658,250,accent,0.42,8);
    rect(160,430,760,74,'#FFFFFF',0.78);
    [0,1,2].forEach(i => rect(204+i*248,548,138,14,i%2?secondary:accent,0.42));
  } else if (motif === 'place') {
    rect(130,160,210,280,'#FFFFFF',0.74); rect(390,120,250,320,'#FFFFFF',0.62); rect(690,190,190,250,'#FFFFFF',0.70);
    line(120,488,900,488,accent,0.36,10);
  } else {
    rect(120,110,780,460,'#FFFFFF',0.76);
    rect(170,170,250,340,accent,0.14);
    rect(460,170,360,88,secondary,0.22);
    rect(460,294,300,88,accent,0.16);
    rect(460,418,240,88,secondary,0.18);
  }
  const rows = [];
  for (let y=0; y<height; y++) rows.push(Buffer.concat([Buffer.from([0]), px.subarray(y*width*3, (y+1)*width*3)]));
  const raw = Buffer.concat(rows);
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n=0; n<256; n++) {
      let c=n;
      for (let k=0; k<8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n]=c>>>0;
    }
    return table;
  })();
  const crc32 = b => {
    let c = 0xffffffff;
    for (const byte of b) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const t = Buffer.from(type);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t,data])));
    return Buffer.concat([len,t,data,crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4);
  ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function writeStressAssets() {
  const files = {
    healthcare: [
      ['healthcare-service-1.png', pngScene('#F3F8F4', '#2F6F73', '#8AA06A', 'clinic')],
      ['healthcare-service-2.png', pngScene('#F8FBF8', '#7EA36C', '#2F6F73', 'service')],
      ['healthcare-service-3.png', pngScene('#F1F7F6', '#2F6F73', '#A9B7A4', 'clinic')],
      ['healthcare-service-4.png', pngScene('#F6FAF8', '#577C6B', '#2F6F73', 'service')]
    ],
    saas: [
      ['saas-product-1.png', pngScene('#F7FAFD', '#3B82F6', '#22D3EE', 'product')],
      ['saas-product-2.png', pngScene('#F5F7FF', '#6366F1', '#06B6D4', 'product-flow')],
      ['saas-product-3.png', pngScene('#F8FAFC', '#0EA5E9', '#8B5CF6', 'product')],
      ['saas-product-4.png', pngScene('#F4F8FF', '#2563EB', '#14B8A6', 'product-flow')]
    ],
    finance: [
      ['finance-portfolio-1.png', pngScene('#F7FAFD', '#2F6FDB', '#1B9AAA', 'portfolio')],
      ['finance-portfolio-2.png', pngScene('#F8F9FB', '#2F6FDB', '#6B7280', 'deal')],
      ['finance-portfolio-3.png', pngScene('#F6F8FB', '#1B9AAA', '#2F6FDB', 'portfolio')],
      ['finance-portfolio-4.png', pngScene('#F9FAFB', '#3858A8', '#1B9AAA', 'deal')]
    ],
    park: [
      ['industrial-site-1.png', pngScene('#F7FAFD', '#2F6FDB', '#1B9AAA', 'place')],
      ['industrial-site-2.png', pngScene('#F8F9FB', '#64748B', '#2F6FDB', 'place')],
      ['industrial-site-3.png', pngScene('#F6F8FB', '#1B9AAA', '#64748B', 'place')],
      ['industrial-site-4.png', pngScene('#F7F9FB', '#0F766E', '#64748B', 'dashboard')]
    ],
    dirty: [
      ['dirty-vertical-1.png', pngScene('#F7FAFD', '#2F6FDB', '#1B9AAA', 'product', { w: 720, h: 1180 })],
      ['dirty-vertical-2.png', pngScene('#F8FBF8', '#2F6F73', '#8AA06A', 'clinic', { w: 680, h: 1120 })],
      ['dirty-screenshot-1.png', pngScene('#F8FAFC', '#0EA5E9', '#8B5CF6', 'product-flow', { w: 1440, h: 900 })],
      ['dirty-wide-1.png', pngScene('#F7F9FB', '#0F766E', '#64748B', 'place', { w: 1800, h: 620 })]
    ]
  };
  const refs = {};
  Object.entries(files).forEach(([key, list]) => {
    refs[key] = list.map(([name, image]) => {
      const file = path.join(stressAssetDir, name);
      if (Buffer.isBuffer(image)) writeBinary(file, image);
      else writeText(file, image);
      return rel(file);
    });
  });
  return refs;
}

const stressAssets = writeStressAssets();

function closing(title, subtitle, actions) {
  return {
    type: 'closing',
    title,
    subtitle,
    label: 'FINAL DECISION',
    actions
  };
}

const demos = [
  {
    slug: 'manufacturing-operations',
    densityProfile: 'text-heavy',
    required: ['制造', 'OEE', '设备'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'manufacturing-operations',
      documentType: 'business-plan',
      visualMode: 'auto',
      title: '离散制造设备运维升级方案',
      coverInsight: '以设备状态、工单闭环和 OEE 指标重构现场协同。',
      organization: '曜能数智科技有限公司',
      audience: '制造企业管理层 / 工厂厂长 / 设备负责人',
      date: '2026年5月',
      footer: '离散制造设备运维升级方案',
      slides: [
        { type: 'auto', title: '离散制造设备运维升级方案', subtitle: '以设备状态、工单闭环和 OEE 指标重构现场协同。' },
        { type: 'chapter-divider', chapter: '01', title: '从故障响应到设备经营', items: ['现场状态透明', '维修闭环可追踪', '产线效率可复盘'] },
        {
          type: 'content',
          title: '关键设备接入与现场产品包',
          subtitle: '产品页需要让设备对象看得清楚，而不是把图片当成背景压暗。',
          visual: { role: 'showcase', image: 'assets/media/manufacturing-modern-detail.jpg', caption: '设备对象用于展示接入范围与现场部署方式。' },
          product: { title: '设备运维接入包', body: '围绕关键设备、传感器和点检终端形成标准化接入单元。' },
          products: [
            { title: '设备接入', body: 'PLC 与传感器状态采集。' },
            { title: '点检终端', body: '班组移动巡检与异常上报。' },
            { title: '备件标签', body: '备件消耗与库存协同。' }
          ],
          note: '产品展示页用于检查 showcase 角色和 feature-strip 变体。'
        },
        {
          type: 'content',
          title: '移动点检终端单品页',
          subtitle: '单品 hero 要先让产品对象成立，再拆解卖点、场景和证据。',
          visual: { role: 'showcase', image: 'assets/media/manufacturing-modern-detail.jpg', caption: '用于巡检、异常上报和维修确认的现场终端对象。' },
          product: { title: '移动点检终端', body: '把设备状态、点检任务、异常照片和维修确认整合到班组手中。' },
          features: [
            { title: '现场录入', body: '扫码定位设备与工位。' },
            { title: '异常证据', body: '照片、语音和故障码同步留痕。' },
            { title: '工单联动', body: '点检异常直接生成维修任务。' }
          ],
          metrics: [
            { label: '点检覆盖', value: '96%' },
            { label: '异常上报', value: '3min' }
          ],
          tagline: '从“人找表”转为“现场即记录”。',
          note: '这页用于测试 product-showcase 的 hero-object 单品拆解。'
        },
        {
          type: 'content',
          title: '设备运维现状与升级目标',
          intro: '关键设备运行、点检、维修和备件记录分散，管理层难以及时判断停机影响和改善重点。',
          cards: [
            { title: '状态不可见', body: '设备运行、报警、点检和维修数据分散。' },
            { title: '响应不稳定', body: '报修、派工和验收依赖人工沟通。' },
            { title: '经验难沉淀', body: '故障原因与处置策略难复用。' },
            { title: '损失难量化', body: '停机、良率和产能影响缺少统一口径。' }
          ]
        },
        {
          type: 'content',
          title: 'OEE 与维修效率进入复盘区间',
          claim: '把设备健康、维修响应和产线节拍放在同一套指标体系下复盘。',
          note: 'OEE 是当前最明确的效率信号，建议优先追踪故障停机、维修响应和备件周转之间的贡献关系。',
          oeeComponents: [
            { label: '稼动率', value: '92%', body: '计划外停机和换线等待进入复盘。' },
            { label: '性能率', value: '84%', body: '瓶颈工位和节拍波动可被识别。' },
            { label: '良率', value: '97%', body: '返工、报废和质量异常绑定工单。' }
          ],
          metrics: [
            { label: 'OEE', value: '78%', delta: '提升 6 个百分点', note: '设备健康和异常处置效率改善。' },
            { label: '平均响应', value: '18min', delta: '缩短 32%', note: '派工规则和责任边界清晰。' },
            { label: '重复故障', value: '12%', delta: '下降 9%', note: '故障库与保养策略开始生效。' }
          ]
        },
        {
          type: 'content',
          title: '停机损失 Pareto',
          downtimePareto: [
            { title: '等待备件', value: 36, unit: '%', body: '库存与工单未绑定。' },
            { title: '传感器误报', value: 28, unit: '%', body: '告警质量不足。' },
            { title: '换型调试', value: 22, unit: '%', body: '节拍波动放大。' },
            { title: '巡检遗漏', value: 14, unit: '%', body: '点检覆盖不稳定。' }
          ],
          subtitle: '用停机 Pareto 把 OEE 损失拆成可以行动的维修优先级。'
        },
        {
          type: 'content',
          title: '设备运维能力架构',
          subtitle: '从设备接入、工单处置到指标复盘，形成现场运营底座。',
          layers: [
            { title: '设备与现场层', items: ['PLC', '传感器', '点检终端', '备件台账'] },
            { title: '业务应用层', items: ['设备健康', '告警分级', '维修工单', '保养计划', '备件协同'] },
            { title: '数据支撑层', items: ['设备库', '故障库', '工单库', '备件库', 'OEE 指标'] }
          ]
        },
        {
          type: 'content',
          title: '维修闭环路径',
          loop: true,
          phases: [
            { title: '发现', body: '设备状态和报警事件统一接入。' },
            { title: '派工', body: '按设备、班组和影响等级自动分派。' },
            { title: '处置', body: '维修过程、备件消耗和验收留痕。' },
            { title: '复盘', body: '按停机影响和重复故障更新策略。' }
          ],
          note: '先用关键产线建立闭环，再扩展到多车间协同。'
        },
        {
          type: 'content',
          title: '产线改造前后证据对比',
          subtitle: '对比页需要像证据一样呈现前后状态，而不是退回普通双栏。',
          before: { title: '改造前', body: '人工记录、异常追踪慢，停机影响难量化。', image: 'assets/media/manufacturing-historical-line.jpg' },
          after: { title: '改造后', body: '设备状态、工单和 OEE 进入统一复盘视图。', image: 'assets/media/manufacturing-modern-line.jpg' },
          metrics: [
            { label: '响应缩短', value: '32%' },
            { label: '重复故障', value: '-9%' },
            { label: '复盘周期', value: '周度' }
          ],
          note: '这页用于测试 case-gallery 的 case-comparison 变体。'
        },
        {
          type: 'content',
          title: '现场证据与产线图册',
          images: [
            'assets/media/manufacturing-modern-line.jpg',
            'assets/media/manufacturing-modern-detail.jpg',
            'assets/media/manufacturing-modern-band.jpg'
          ],
          cards: [
            { title: '产线节拍', body: '用产线现场作为效率改善证据。' },
            { title: '设备细节', body: '呈现关键设备与维护对象。' },
            { title: '现场协同', body: '展示班组与生产节奏关系。' }
          ]
        },
        closing('先把关键产线跑成可复盘闭环', '再扩展到多车间、多班组和多设备类型。', [
          { title: '产线', body: '选择首批关键设备和瓶颈工位' },
          { title: '数据', body: '统一故障、工单和 OEE 口径' },
          { title: '复盘', body: '建立周度设备效率复盘机制' }
        ])
      ]
    }
  },
  {
    slug: 'finance-investment',
    densityProfile: 'text-heavy',
    required: ['投资', '风险', '组合'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'finance-investment',
      documentType: 'investment-committee',
      visualMode: 'solid',
      title: '产业基金投资组合复盘报告',
      coverInsight: '以统一口径评估组合表现、风险暴露和后续资本配置。',
      organization: '曜能数智科技有限公司',
      audience: '投资委员会 / 管理合伙人',
      date: '2026年5月',
      footer: '产业基金投资组合复盘报告',
      slides: [
        { type: 'auto', title: '产业基金投资组合复盘报告', subtitle: '以统一口径评估组合表现、风险暴露和后续资本配置。', coverProofTitle: '核心判断', coverProof: '组合进入从规模扩张到质量复盘的阶段。' },
        {
          type: 'chapter-divider',
          chapter: '01',
          title: '组合质量与资本配置',
          subtitle: '投委会第二页应当像议题板，而不是所有行业都用同一张章节幕布。',
          items: [
            { title: '业绩表现', body: '统一 IRR、DPI 和估值修复口径。' },
            { title: '风险暴露', body: '识别现金回收、合规和退出压力。' },
            { title: '下一步配置', body: '形成加仓、维持、退出和处置清单。' }
          ]
        },
        {
          type: 'content',
          title: '管理团队与投后能力证明',
          company: '产业投资与投后管理团队',
          description: '覆盖产业研究、尽调建模、投后经营和退出管理的一体化投资支持。',
          metrics: [
            { label: '覆盖赛道', value: '6' },
            { label: '在管项目', value: '42' },
            { label: '投后复盘', value: '18轮' },
            { label: '退出案例', value: '9' }
          ],
          note: '证明页优先呈现投资团队的覆盖能力、项目经验和复盘机制。'
        },
        {
          type: 'content',
          title: '组合回报与现金回收进入分化期',
          claim: '头部项目贡献仍然集中，后续需要在回报质量和风险约束之间做配置选择。',
          note: 'DPI 与估值修复是当前最重要的复盘信号，建议同步追踪现金回收、后续融资和退出窗口。',
          metrics: [
            { label: '组合 IRR', value: '18.6%', delta: '提升 2.4 个百分点', note: '头部项目估值修复贡献明显。' },
            { label: 'DPI', value: '0.42x', delta: '提升 0.08x', note: '现金回收节奏开始改善。' },
            { label: '风险项目', value: '7项', delta: '减少 3项', note: '高风险项目进入专项处置。' },
            { label: '后续融资', value: '11项', delta: '新增 4项', note: '头部项目融资窗口重新打开。' }
          ]
        },
        {
          type: 'content',
          title: '组合回报归因桥',
          subtitle: '把 IRR 变化拆成估值修复、现金回收、减值压力和退出折现四类贡献。',
          bridge: [
            { label: '期初 IRR', value: '16.2%', kind: 'start', height: 1.48 },
            { label: '估值修复', value: '+1.6pt', kind: 'up', height: 0.88 },
            { label: '现金回收', value: '+0.9pt', kind: 'up', height: 0.62 },
            { label: '风险减值', value: '-0.7pt', kind: 'down', height: 0.54 },
            { label: '退出折现', value: '+0.6pt', kind: 'up', height: 0.46 },
            { label: '本期 IRR', value: '18.6%', kind: 'end', height: 1.86 }
          ],
          actions: [
            { title: '加仓头部', body: '估值修复明确' },
            { title: '推进退出', body: '现金回收改善' },
            { title: '专项处置', body: '减值压力暴露' },
            { title: '融资跟踪', body: '窗口重新打开' }
          ],
          decision: '归因不是解释过去，而是决定下一季度资金应该流向哪里。',
          note: '桥图用于回答“回报为什么变了”，避免只展示一个 IRR 结果。'
        },
        {
          type: 'content',
          title: '估值敏感性矩阵',
          valuationSensitivity: {
            rows: ['低增长', '基准增长', '高增长'],
            cols: ['保守退出', '基准退出', '乐观退出'],
            values: [[12, 16, 19], [15, 20, 24], [18, 23, 29]]
          },
          subtitle: '把增长和退出倍数放到同一张敏感性矩阵，提前暴露配置边界。'
        },
        {
          type: 'content',
          title: '组合分层与行动清单',
          subtitle: '按主题、权重、回收质量和风险等级决定加仓、维持、退出或专项处置。',
          portfolio: [
            { theme: '高端装备', weight: 28, irr: '24.1%', dpi: '0.52x', risk: '中', action: '加仓头部' },
            { theme: '新能源材料', weight: 22, irr: '19.4%', dpi: '0.46x', risk: '中', action: '维持跟踪' },
            { theme: '工业软件', weight: 18, irr: '21.8%', dpi: '0.31x', risk: '低', action: '资源协同' },
            { theme: '医疗器械', weight: 17, irr: '15.2%', dpi: '0.39x', risk: '中', action: '退出准备' },
            { theme: '消费科技', weight: 15, irr: '8.6%', dpi: '0.18x', risk: '高', action: '风险隔离' }
          ],
          summary: '组合不只看收益排序，还要看现金回收和风险占用。',
          note: '组合表用于把配置比例、回收质量、风险等级和下一步动作放在同一坐标。'
        },
        {
          type: 'content',
          title: '配置逻辑从分散下注转向主题集中',
          subtitle: '围绕市场假设、组合动作和结果信号形成投委会讨论框架。',
          drivers: ['产业景气度', '估值安全垫', '现金回收'],
          actions: ['加仓头部', '专项投后', '退出准备', '风险隔离'],
          outcomes: ['收益质量提升', '组合波动收敛', '退出窗口清晰'],
          note: '价值路径页用于说明投资判断如何从市场假设转化为资本配置动作。'
        },
        {
          type: 'content',
          title: '投后管理蓝图与治理分层',
          subtitle: '把项目数据、投后动作、风险控制和投委会决策放进同一套架构。',
          layers: [
            { title: '项目数据层', items: ['经营指标', '融资进展', '估值假设', '现金回收'] },
            { title: '投后动作层', items: ['经营复盘', '资源协同', '退出准备', '专项处置'] },
            { title: '风险控制层', items: ['风险分级', '合规材料', '审批留痕', '配置上限'] },
            { title: '决策委员会层', items: ['加仓清单', '维持清单', '退出清单', '风险观察清单'] }
          ],
          note: '金融行业更适合 blueprint-stack，而不是大面积图片或泛化卡片。'
        },
        {
          type: 'content',
          title: '配置前后决策口径对比',
          subtitle: '从项目数量导向转向组合质量导向。',
          columns: [
            { title: '调整前', items: ['赛道分散', '复盘依赖单项目材料', '风险处置滞后'] },
            { title: '调整后', items: ['主题集中配置', '组合指标统一复盘', '风险项目专项跟踪'] }
          ],
          note: '对比页用于呈现投资决策方式的变化，而不是简单罗列项目差异。'
        },
        {
          type: 'content',
          title: '组合风险与治理保障',
          matrix: true,
          claim: '把估值、现金流、合规和退出四类风险前置到投后节奏中。',
          rows: [
            ['估值修复不及预期', '中', '按季度更新估值假设和融资进展。'],
            ['现金回收滞后', '高', '建立退出窗口和回款专项跟踪。'],
            ['合规披露不足', '中', '统一项目材料和审批留痕。'],
            ['行业景气波动', '中', '对高波动赛道设置配置上限。']
          ],
          note: '以估值假设、回款节奏、合规材料和配置上限构成投后治理闭环。'
        },
        Object.assign(closing('把资本配置回到同一套决策口径', '用统一指标、风险约束和退出节奏支撑投委会判断。', [
          { title: '组合', body: '确认加仓、维持和退出清单' },
          { title: '风险', body: '锁定高优先级项目处置机制' },
          { title: '节奏', body: '建立季度投后复盘与投委会追踪' }
        ]), { decision: '确认下一季度资本配置、风险项目处置和退出准备优先级。' })
      ]
    }
  },
  {
    slug: 'healthcare-operations',
    densityProfile: 'text-heavy',
    required: ['医疗', '患者', '质量'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'healthcare-operations',
      documentType: 'business-plan',
      visualMode: 'solid',
      title: '医疗服务运营质量提升方案',
      coverInsight: '以患者旅程、资源调度和质量指标形成可追踪的服务闭环。',
      organization: '曜能数智科技有限公司',
      audience: '医院管理层 / 运营管理部门',
      date: '2026年5月',
      footer: '医疗服务运营质量提升方案',
      slides: [
        { type: 'auto', title: '医疗服务运营质量提升方案', subtitle: '以患者旅程、资源调度和质量指标形成可追踪的服务闭环。', coverProofTitle: '核心议题', coverProof: '把服务体验和质量治理放到同一张运营图。' },
        {
          type: 'chapter-divider',
          chapter: '01',
          title: '质量、安全与服务体验',
          subtitle: '医疗第二页更像服务路径，需要让读者先知道会沿哪些触点展开。',
          items: [
            { title: '患者旅程', body: '预约、到院、检查、随访。' },
            { title: '资源调度', body: '诊室、检查、护理协同。' },
            { title: '质量治理', body: '隐私、反馈和不良事件闭环。' }
          ]
        },
        {
          type: 'content',
          title: '服务运营现状与升级目标',
          intro: '预约、接诊、检查、随访和投诉反馈分散在不同系统和线下流程中，质量改善难以持续追踪。',
          cards: [
            { title: '旅程割裂', body: '患者触点分散，体验问题难闭环。' },
            { title: '资源错配', body: '诊室、检查和护理资源缺少统一视图。' },
            { title: '响应滞后', body: '异常反馈和投诉处理缺少节奏管理。' },
            { title: '质量难复盘', body: '服务指标与责任动作关联不足。' }
          ]
        },
        {
          type: 'content',
          title: '患者旅程服务蓝图',
          subtitle: '用服务蓝图解释患者触点、前台服务、后台协同和质量证据之间的关系。',
          coreTitle: '从触点到责任',
          coreBody: '医疗服务蓝图要同时看患者动作、医护协同和质量复盘。',
          serviceBlueprint: [
            { title: '预约', patient: '线上预约与资料确认', frontstage: '客服确认需求和注意事项', backstage: '号源、诊室和检查资源预留', evidence: '预约等待时长' },
            { title: '到院', patient: '签到、导诊、分诊', frontstage: '导诊台分流和提醒', backstage: '诊室状态与排班联动', evidence: '排队状态' },
            { title: '检查', patient: '完成检查和缴费', frontstage: '医护解释流程与风险', backstage: '检查排程与结果同步', evidence: '异常反馈' },
            { title: '随访', patient: '接收结果和建议', frontstage: '客服回访与答疑', backstage: '质控复盘和整改跟进', evidence: '满意度与投诉闭环' }
          ],
          note: '医疗行业的架构页需要更克制、更清晰，优先确保信息可读。'
        },
        {
          type: 'content',
          title: '患者体验与响应效率进入改善区间',
          claim: '服务触点被统一后，响应效率和满意度开始形成可复盘信号。',
          note: '患者满意度和等待时长应一起看，避免只优化单点体验而忽略资源压力。',
          metrics: [
            { label: '满意度', value: '91%', delta: '提升 7 个百分点', note: '服务触点和沟通节奏改善。' },
            { label: '平均等待', value: '24min', delta: '缩短 18%', note: '预约和检查资源协同改善。' },
            { label: '闭环率', value: '86%', delta: '提升 11%', note: '反馈处理责任更清晰。' }
          ]
        },
        {
          type: 'content',
          title: '患者旅程价值路径',
          subtitle: '从患者触点、资源调度和质量数据出发，形成服务改善闭环。',
          drivers: ['患者触点', '医护资源', '质量数据'],
          actions: ['预约协同', '检查排程', '反馈闭环', '质量复盘'],
          outcomes: ['等待时长下降', '服务满意度提升', '质量风险可追踪'],
          note: '价值路径页用于说明服务改善如何从触点治理转化为质量结果。'
        },
        {
          type: 'content',
          title: '质量交接证据图',
          qualityHandoff: [
            { from: '导诊台', to: '检查科室', title: '身份与检查项目', body: '避免重复问询和错检。' },
            { from: '检查科室', to: '医生工作站', title: '报告节点', body: '异常结果优先提醒。' },
            { from: '医生工作站', to: '随访中心', title: '处置建议', body: '进入随访与质控复盘。' },
            { from: '随访中心', to: '质控办', title: '整改证据', body: '沉淀投诉和整改闭环。' }
          ],
          subtitle: '用质量交接图检查每个角色交给下一个角色的材料是否完整。'
        },
        {
          type: 'content',
          title: '患者旅程闭环实施路径',
          layoutVariant: 'process-board',
          phases: [
            { title: '触点梳理', body: '确认预约、到院、检查、缴费、随访等关键触点。' },
            { title: '指标定义', body: '统一等待时长、满意度、投诉闭环和质量风险口径。' },
            { title: '资源协同', body: '把诊室、检查、护理和客服资源纳入统一排班视图。' },
            { title: '反馈处置', body: '按问题等级设定责任人、处理时限和复盘材料。' },
            { title: '质量复盘', body: '以月度节奏沉淀改善动作和下一轮优化重点。' }
          ],
          note: '流程板用于测试文案较多时的 process-board 变体。'
        },
        {
          type: 'content',
          title: '医护与患者声音',
          quote: '真正重要的是让每一次反馈都能进入下一次服务改善',
          attribution: '门诊运营负责人访谈摘录',
          items: [
            { title: '预约协同', body: '减少重复沟通。' },
            { title: '资源可见', body: '调度更有依据。' },
            { title: '质量复盘', body: '问题能够闭环。' }
          ]
        },
        {
          type: 'content',
          title: '质量风险与治理保障',
          claim: '把隐私、流程、资源和反馈风险前置到服务运营机制中。',
          responsibilities: [
            { title: '隐私权限', owner: '信息科', body: '定义数据访问、脱敏和授权边界。', cadence: '上线前确认' },
            { title: '跨科协同', owner: '运营办', body: '明确转诊、检查和护理交接责任。', cadence: '周度追踪' },
            { title: '反馈处置', owner: '客服中心', body: '把投诉、表扬和异常反馈纳入时限管理。', cadence: '日清周结' },
            { title: '质量复盘', owner: '质控办', body: '按月回看指标变化和整改证据。', cadence: '月度复盘' }
          ],
          rows: [
            ['患者隐私保护', '高', '明确数据权限和脱敏边界。'],
            ['跨科室协同不足', '中', '设定转诊和检查协同责任。'],
            ['资源排班波动', '中', '建立高峰时段调度预案。'],
            ['反馈闭环不完整', '中', '设置时限、责任人和复盘机制。']
          ],
          note: '以权限、协同、排班和反馈闭环构成医疗服务质量治理基础。'
        },
        closing('先让患者旅程进入可追踪闭环', '再把质量治理、资源调度和服务体验持续联动。', [
          { title: '旅程', body: '确认首批患者触点和关键场景' },
          { title: '质量', body: '统一满意度、等待和闭环指标' },
          { title: '治理', body: '建立月度质量复盘机制' }
        ])
      ]
    }
  },
  {
    slug: 'brand-retail',
    densityProfile: 'image-heavy',
    required: ['零售', '会员', '品牌'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'brand-retail',
      documentType: 'business-plan',
      visualMode: 'auto',
      visualIntent: 'image-rich',
      title: '高端零售品牌增长计划',
      coverInsight: '以产品组合、空间体验与会员运营构建可复盘增长闭环。',
      organization: '曜能数智科技有限公司',
      audience: '品牌管理层',
      date: '2026年5月',
      footer: '高端零售品牌增长计划',
      media: retailGallery.length ? {
        cover: retailGallery[0],
        detail: retailGallery[2] || retailGallery[0],
        gallery: retailGallery
      } : undefined,
      slides: [
        { type: 'auto', title: '高端零售品牌增长计划', subtitle: '以产品组合、空间体验与会员运营构建可复盘增长闭环。', visual: { role: 'showcase' } },
        {
          type: 'chapter-divider',
          chapter: '01',
          title: '增长机会与品牌证据',
          subtitle: '消费零售第二页可以更接近 editorial agenda，用图片建立品牌语境。',
          items: [
            { title: '市场与会员机会', body: '从用户场景看增长入口。' },
            { title: '品牌能力证明', body: '用空间、商品和案例建立信任。' },
            { title: '增长路径设计', body: '让内容、门店和会员形成循环。' }
          ]
        },
        {
          type: 'content',
          title: '公司简介与能力证明',
          company: '零售增长解决方案团队',
          description: '专注品牌增长、门店体验和会员运营的一体化方案设计。',
          tagline: '以可验证经验建立决策信任',
          metrics: [
            { label: '服务行业', value: '8+' },
            { label: '项目经验', value: '120+' },
            { label: '核心团队', value: '32人' },
            { label: '复购合作', value: '68%' }
          ]
        },
        {
          type: 'content',
          title: '产品组合与会员触达场景',
          subtitle: '图片多时先判断是产品展示还是图册证据，产品页要让商品和卖点各自清楚。',
          products: [
            { title: '核心系列', body: '承担品牌识别和高价值成交。', image: retailGallery[0] },
            { title: '搭配系列', body: '提升客单和组合购买。', image: retailGallery[1] },
            { title: '会员专属', body: '绑定复购权益和内容触达。', image: retailGallery[2] },
            { title: '门店陈列', body: '强化主题动线和现场记忆。', image: retailGallery[0] },
            { title: '内容素材', body: '支持小红书、社群和导购沟通。', image: retailGallery[1] }
          ],
          note: '这页用于测试 product-showcase 的 catalog-grid 变体。'
        },
        {
          type: 'content',
          title: '会员增长指标进入复盘区间',
          claim: '会员触达和产品组合已开始转化为可复盘的增长信号。',
          metrics: [
            { label: '复购率', value: '42%', delta: '提升 8 个百分点', note: '会员触达和新品组合贡献增长。' },
            { label: '客单价', value: '¥680', delta: '提升 12%', note: '高价值组合占比提升。' },
            { label: '门店转化', value: '31%', delta: '提升 5 个百分点', note: '体验动线优化后转化上升。' }
          ]
        },
        {
          type: 'content',
          title: '会员分层经营阶梯',
          memberCohorts: [
            { title: '新客', value: '31%', body: '首购转化和欢迎权益。' },
            { title: '活跃会员', value: '42%', body: '复购贡献和搭配推荐。' },
            { title: '高价值会员', value: '18%', body: '高客单组合和专属服务。' },
            { title: '沉睡会员', value: '9%', body: '召回任务和权益测试。' }
          ],
          subtitle: '用会员分层阶梯判断哪些人群进入触达、复购、召回和高价值经营。'
        },
        {
          type: 'content',
          title: '升级前后体验对比',
          subtitle: '围绕会员触达、陈列策略和经营复盘，形成可执行的体验升级路径。',
          columns: [
            { title: '升级前', items: ['商品陈列分散', '会员触达靠人工', '复盘依赖门店经验'] },
            { title: '升级后', items: ['主题化产品组合', '会员旅程自动触达', '指标驱动经营复盘'] }
          ]
        },
        {
          type: 'content',
          title: '客户声音：门店体验决定品牌记忆',
          quote: '门店不只是销售点，而是品牌记忆的现场',
          attribution: '区域运营负责人访谈摘录',
          items: [
            { title: '体验动线', body: '顾客更容易理解新品组合。' },
            { title: '会员触达', body: '复购提醒更自然。' },
            { title: '经营复盘', body: '门店能看到动作效果。' }
          ]
        },
        {
          type: 'content',
          title: '产品故事与门店 Lookbook',
          subtitle: '把商品、空间、搭配和会员触达放在同一组品牌故事里。',
          images: retailGallery,
          storyTitle: '从视觉偏好到复购理由',
          storyBody: 'lookbook 页要让产品和空间共同说明品牌价值，而不是只把照片排成三列。',
          cards: [
            { title: '产品体验', body: '以核心产品与陈列细节建立品牌识别。' },
            { title: '门店动线', body: '以空间路径提升浏览效率与停留质量。' },
            { title: '现场细节', body: '以统一视觉语言强化高端感知。' }
          ]
        },
        {
          type: 'content',
          title: '会员运营增长飞轮',
          subtitle: '把产品内容、门店体验和会员复购做成可累积的运营闭环。',
          flywheel: [
            { title: '产品故事', body: '新品主题和搭配场景形成内容入口。' },
            { title: '门店体验', body: '陈列、试用和导购动作承接兴趣。' },
            { title: '会员触达', body: '权益、内容和提醒形成二次互动。' },
            { title: '复购复盘', body: '用客单、复购和偏好更新下一轮组合。' }
          ],
          centerTitle: '会员复利',
          centerLabel: 'PRODUCT TO LOYALTY',
          note: '这页用于测试 timeline 的 flywheel / operating-loop 变体。'
        },
        {
          type: 'closing',
          closingVariant: 'thank-you',
          label: 'THANK YOU',
          title: '谢谢观看',
          subtitle: '期待一起把品牌增长闭环跑成长期经营能力。',
          note: '正式结束页用于测试 closing 的 thank-you / simple-end 变体。'
        }
      ]
    }
  }
];

demos.push(
  {
    slug: 'manufacturing-operations-image-heavy',
    densityProfile: 'image-heavy',
    required: ['制造', '现场', '设备'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'manufacturing-operations',
      documentType: 'case-led-proposal',
      visualIntent: 'image-rich',
      title: '制造现场证据型汇报',
      coverInsight: '以现场照片、设备对象和改造前后证据说明运维升级价值。',
      organization: '曜能数智科技有限公司',
      audience: '工厂管理层 / 设备负责人',
      date: '2026年5月',
      footer: '制造现场证据型汇报',
      media: {
        cover: 'assets/media/manufacturing-modern-line.jpg',
        detail: 'assets/media/manufacturing-modern-detail.jpg',
        gallery: [
          'assets/media/manufacturing-modern-line.jpg',
          'assets/media/manufacturing-modern-detail.jpg',
          'assets/media/manufacturing-modern-band.jpg'
        ]
      },
      slides: [
        { type:'auto', title:'制造现场证据型汇报', subtitle:'以现场照片、设备对象和改造前后证据说明运维升级价值。', visual:{ role:'showcase' } },
        { type:'chapter-divider', chapter:'01', title:'现场证据与运维路径', items:['设备对象', '前后对比', '图册证据'] },
        { type:'content', title:'关键设备对象展示', visual:{ role:'showcase', image:'assets/media/manufacturing-modern-detail.jpg', caption:'设备细节用于解释接入对象。' }, product:{ title:'关键设备接入单元', body:'围绕现场设备、传感器和点检终端形成接入对象。' }, features:[{title:'接入对象',body:'设备状态可被识别。'}, {title:'现场任务',body:'点检与维修联动。'}, {title:'复盘证据',body:'异常处置留痕。'}] },
        { type:'content', title:'现场停机损失 Pareto', subtitle:'即使是图片型汇报，也要把现场证据转成 OEE 损失和维修优先级。', downtimePareto:[{title:'等待备件',value:34,unit:'%'},{title:'故障定位',value:26,unit:'%'},{title:'换型调试',value:22,unit:'%'},{title:'巡检遗漏',value:18,unit:'%'}] },
        { type:'content', title:'产线改造前后证据', before:{ title:'改造前', body:'人工记录和异常追踪分散。', image:'assets/media/manufacturing-historical-line.jpg' }, after:{ title:'改造后', body:'设备状态和工单进入统一视图。', image:'assets/media/manufacturing-modern-line.jpg' }, metrics:[{label:'响应缩短',value:'32%'},{label:'复盘周期',value:'周度'}] },
        { type:'content', title:'现场证据图册', images:['assets/media/manufacturing-modern-line.jpg','assets/media/manufacturing-modern-detail.jpg','assets/media/manufacturing-modern-band.jpg'], cards:[{title:'产线节拍',body:'现场节奏可见。'},{title:'设备细节',body:'维护对象可见。'},{title:'协同现场',body:'班组动作可复盘。'}] },
        { type:'closing', title:'让现场证据进入经营复盘', subtitle:'先用一条产线跑通证据链，再扩展到多车间。', actions:[{title:'对象',body:'确认关键设备'},{title:'证据',body:'绑定现场图册'},{title:'复盘',body:'建立周度节奏'}] }
      ]
    }
  },
  {
    slug: 'finance-investment-image-heavy',
    densityProfile: 'image-heavy',
    required: ['投资', '案例', '组合'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'finance-investment',
      documentType: 'portfolio-review',
      visualIntent: 'image-rich',
      visualMode: 'hybrid',
      title: '产业基金投资组合案例版式测试',
      coverInsight: '用项目示意、经营快照和组合动作模拟投委会判断场景。',
      organization: '曜能数智科技有限公司',
      audience: '投资委员会',
      date: '2026年5月',
      footer: '产业基金投资组合案例版式测试',
      media: { cover: stressAssets.finance[0], detail: stressAssets.finance[1], gallery: stressAssets.finance },
      slides: [
        { type:'auto', title:'产业基金投资组合案例版式测试', subtitle:'用项目示意、经营快照和组合动作模拟投委会判断场景。' },
        { type:'chapter-divider', chapter:'01', title:'项目示意与配置动作', items:[{title:'项目示意',body:'经营快照和产品材料示意。'}, {title:'组合动作',body:'加仓、维持、退出。'}, {title:'风险复盘',body:'示意材料进入处置机制。'}] },
        { type:'content', title:'组合案例证据板', subtitle:'四类材料必须对应投委会判断对象，而不是平均摆成普通图册。', layoutVariant:'evidence-board', imageLayout:'mosaic-1-3', images:stressAssets.finance, cards:[{title:'经营快照',body:'收入、订单和产能兑现。'}, {title:'产品材料',body:'商业化节点和客户验证。'}, {title:'治理材料',body:'投后会议与整改动作。'}, {title:'资本动作',body:'加仓、维持、退出依据。'}] },
        { type:'content', title:'组合回报归因桥', subtitle:'把估值修复、DPI 回收和风险折损拆成可讨论的资本动作。', bridge:[{label:'期初 IRR',value:'16.8%',height:1.20,kind:'start'},{label:'现金回收',value:'+2.4pt',height:0.92,kind:'up'},{label:'估值修复',value:'+3.1pt',height:1.08,kind:'up'},{label:'风险折损',value:'-1.6pt',height:0.64,kind:'down'},{label:'期末 IRR',value:'20.7%',height:1.62,kind:'end'}], actions:[{title:'加仓头部',body:'验证订单'}, {title:'维持跟踪',body:'等待回款'}, {title:'隔离风险',body:'压降敞口'}, {title:'协同退出',body:'准备窗口'}] },
        { type:'content', title:'项目状态调整前后示意', before:{title:'调整前',body:'复盘依赖单项目材料。',image:stressAssets.finance[0]}, after:{title:'调整后',body:'材料、指标和风险统一进入投委会。',image:stressAssets.finance[1]}, metrics:[{label:'复盘项目',value:'18'},{label:'风险收敛',value:'-3'}] },
        { type:'content', title:'组合分层与行动清单', portfolio:[{theme:'高端装备',weight:28,irr:'24.1%',dpi:'0.52x',risk:'中',action:'加仓头部'},{theme:'新能源材料',weight:22,irr:'19.4%',dpi:'0.46x',risk:'中',action:'维持跟踪'},{theme:'工业软件',weight:18,irr:'21.8%',dpi:'0.31x',risk:'低',action:'资源协同'},{theme:'消费科技',weight:15,irr:'8.6%',dpi:'0.18x',risk:'高',action:'风险隔离'}] },
        Object.assign(closing('把项目示意转成配置动作', '用示意材料支撑投委会下一轮配置判断。', [{title:'项目',body:'确认材料清单'},{title:'风险',body:'更新处置节奏'},{title:'配置',body:'形成行动表'}]), { decision:'确认项目材料、风险项目和资本动作。' })
      ]
    }
  },
  {
    slug: 'healthcare-operations-image-heavy',
    densityProfile: 'image-heavy',
    required: ['医疗', '患者', '服务'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'healthcare-operations',
      documentType: 'service-blueprint',
      visualIntent: 'case-led',
      title: '医疗服务触点示意方案',
      coverInsight: '把患者旅程中的关键触点变成可检查、可复盘的服务蓝图示意。',
      organization: '曜能数智科技有限公司',
      audience: '医院管理层 / 运营管理部门',
      date: '2026年5月',
      footer: '医疗服务触点示意方案',
      media: { cover: stressAssets.healthcare[0], detail: stressAssets.healthcare[1], gallery: stressAssets.healthcare },
      slides: [
        { type:'auto', title:'医疗服务触点示意方案', subtitle:'把患者旅程中的关键触点变成可检查、可复盘的服务蓝图示意。' },
        { type:'chapter-divider', chapter:'01', title:'患者旅程触点链', items:[{title:'到院触点',body:'预约、导诊、检查。'}, {title:'协同节点',body:'医护、排班、资源。'}, {title:'反馈闭环',body:'投诉、随访、质控。'}] },
        { type:'content', title:'服务触点证据板', subtitle:'把图片对应到旅程触点、前台动作、后台资源和质量证据。', layoutVariant:'evidence-board', imageLayout:'mosaic-1-3', images:stressAssets.healthcare, cards:[{title:'预约导诊',body:'入口体验与分诊材料。'}, {title:'检查协同',body:'科室等待与排班材料。'}, {title:'随访反馈',body:'反馈问题进入时限。'}, {title:'质控复盘',body:'整改证据可追踪。'}] },
        { type:'content', title:'患者服务蓝图', subtitle:'医疗页要能把前台体验、后台资源和质量证据放入同一张服务蓝图。', serviceBlueprint:[{title:'预约',patient:'线上预约',frontstage:'入口登记',backstage:'号源调度',evidence:'预约记录'},{title:'到院',patient:'签到导诊',frontstage:'导诊分流',backstage:'资源排班',evidence:'等待时长'},{title:'检查',patient:'完成检查',frontstage:'检查引导',backstage:'科室协同',evidence:'报告节点'},{title:'反馈',patient:'随访反馈',frontstage:'问题受理',backstage:'质控复盘',evidence:'整改闭环'}] },
        { type:'content', title:'体验升级前后示意', before:{title:'升级前',body:'触点分散，反馈处理不稳定。',image:stressAssets.healthcare[0]}, after:{title:'升级后',body:'触点、责任和时限进入同一条服务链。',image:stressAssets.healthcare[1]}, metrics:[{label:'等待缩短',value:'18%'},{label:'闭环率',value:'86%'}] },
        { type:'content', title:'质量责任闭环', responsibilities:[{title:'隐私权限',owner:'信息科',body:'定义授权和脱敏边界。'}, {title:'资源调度',owner:'运营办',body:'确认高峰排班预案。'}, {title:'反馈处置',owner:'客服中心',body:'按时限推进处理。'}, {title:'质量复盘',owner:'质控办',body:'沉淀整改证据。'}] },
        closing('让患者触点进入可复盘服务链', '用触点图册和责任闭环支撑质量改善。', [{title:'触点',body:'确认首批旅程节点'},{title:'材料',body:'统一服务示意'},{title:'治理',body:'建立复盘节奏'}])
      ]
    }
  },
  {
    slug: 'brand-retail-text-heavy',
    densityProfile: 'text-heavy',
    required: ['零售', '会员', '增长'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'brand-retail',
      documentType: 'growth-plan',
      visualMode: 'solid',
      contentDensity: 'text-heavy',
      title: '零售品牌会员增长经营方案',
      coverInsight: '以产品组合、会员触达和门店复盘构建可持续增长机制。',
      organization: '曜能数智科技有限公司',
      audience: '品牌管理层',
      date: '2026年5月',
      footer: '零售品牌会员增长经营方案',
      slides: [
        { type:'auto', title:'零售品牌会员增长经营方案', subtitle:'以产品组合、会员触达和门店复盘构建可持续增长机制。' },
        { type:'chapter-divider', chapter:'01', title:'管理层汇报重点', subtitle:'本次审议围绕产品组合、会员触达和经营复盘展开。', items:[{title:'产品组合',body:'明确核心、搭配、会员专属。'}, {title:'触达节奏',body:'内容、权益、社群分层。'}, {title:'经营复盘',body:'客单、复购、转化归因。'}] },
        { type:'content', title:'增长机制信息板', claim:'文案较多时应自动进入报告型信息板，而不是泛化卡片。', cards:[{title:'用户分层',body:'根据新客、活跃会员和高价值会员设计差异化触达。'}, {title:'产品组合',body:'围绕核心系列、搭配系列和会员专属权益形成购买理由。'}, {title:'门店动作',body:'把陈列主题、导购话术和试用体验写进月度经营动作。'}, {title:'内容触达',body:'用新品故事、搭配建议和会员权益推动二次互动。'}, {title:'数据口径',body:'统一复购率、客单价、门店转化和触达响应的计算口径。'}, {title:'复盘节奏',body:'每月回看商品组合、会员触达和门店动作之间的贡献关系。'}, {title:'风险约束',body:'避免过度促销稀释品牌感和长期价格锚点。'}] },
        { type:'content', title:'会员增长指标', metrics:[{label:'复购率',value:'42%',delta:'提升 8 个百分点',note:'会员触达和产品组合贡献增长。'}, {label:'客单价',value:'¥680',delta:'提升 12%',note:'高价值组合占比提升。'}, {label:'门店转化',value:'31%',delta:'提升 5 个百分点',note:'体验动线优化后转化上升。'}] },
        { type:'content', title:'会员运营增长飞轮', flywheel:[{title:'产品故事',body:'新品主题形成入口。'}, {title:'门店体验',body:'导购动作承接兴趣。'}, {title:'会员触达',body:'权益推动二次互动。'}, {title:'经营复盘',body:'数据更新下一轮组合。'}], centerTitle:'会员复利' },
        { type:'closing', closingVariant:'simple-end', title:'正式结束', subtitle:'期待一起把品牌增长闭环跑成长期经营能力。' }
      ]
    }
  },
  {
    slug: 'energy-utility-text-heavy',
    densityProfile: 'text-heavy',
    required: ['能源', '电站', '告警'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'energy-utility',
      documentType: 'operations-plan',
      visualMode: 'solid',
      contentDensity: 'text-heavy',
      title: '新能源电站智能运维经营方案',
      coverInsight: '以站端接入、告警处置和收益复盘形成区域化运维闭环。',
      organization: '曜能数智科技有限公司',
      audience: '新能源运营管理层',
      date: '2026年5月',
      footer: '新能源电站智能运维经营方案',
      slides: [
        { type:'auto', title:'新能源电站智能运维经营方案', subtitle:'以站端接入、告警处置和收益复盘形成区域化运维闭环。' },
        { type:'toc-clean', title:'运维议题路径', items:['多站资产背景','集中运维升级','告警工单闭环','收益复盘机制','风险与保障'] },
        { type:'content', title:'多站运维问题信息板', claim:'电站数量扩张后，站端数据、告警、巡检和收益复盘需要统一进入区域运维节奏。', cards:[{title:'站端状态分散',body:'设备、逆变器、储能和气象数据分散在不同系统。'}, {title:'告警优先级不清',body:'同类告警频繁出现，处置优先级依赖人工经验。'}, {title:'巡检闭环不足',body:'现场巡检、远程诊断和工单验证缺少统一证据。'}, {title:'收益复盘滞后',body:'发电量、限电、储能策略和电价影响缺少复盘口径。'}, {title:'跨站调度困难',body:'区域运维人员难以按风险和收益进行资源配置。'}, {title:'责任边界模糊',body:'业主、运维商和设备方之间的处置责任需要结构化。'}, {title:'数据质量约束',body:'站端采集频率、缺失值和异常值需要治理机制。'}] },
        { type:'content', title:'告警处置指标', metrics:[{label:'告警闭环率',value:'91%',delta:'提升 14 个百分点',note:'高优先级告警进入工单节奏。'}, {label:'平均处置',value:'36min',delta:'缩短 21%',note:'区域调度规则更清晰。'}, {label:'收益偏差',value:'-4.8%',delta:'收窄 2.1pt',note:'复盘口径开始统一。'}] },
        { type:'content', title:'区域站点调度地图', subtitle:'把站点 SOC、负荷高峰、限电风险和处置时长放到同一张调度图。', dispatchMap:[{title:'A 站',value:'SOC 63%',body:'告警优先'}, {title:'B 站',value:'负荷高峰',body:'调度放电'}, {title:'C 站',value:'限电风险',body:'策略复盘'}, {title:'区域中心',value:'36min',body:'平均处置'}], centerTitle:'区域调度' },
        { type:'content', title:'站端到区域的数据拓扑', subtitle:'把设备侧、数据侧、调度侧和管理侧放入同一条实时数据流。', layers:[{title:'设备侧',items:['逆变器','PCS','BMS','电表']},{title:'数据侧',items:['协议适配','指标口径','历史曲线']},{title:'调度侧',items:['告警分级','工单处置','SOC 策略']},{title:'管理侧',items:['多站态势','收益波动','区域协同']}] },
        { type:'module-matrix', title:'负荷-储能-告警调度能力环', intro:'能源能力页要像运行闭环，而不是通用能力雷达。', cards:[{title:'负荷曲线',body:'识别发电、用电和储能波动。'}, {title:'储能策略',body:'按 SOC 和电价调整策略。'}, {title:'告警事件',body:'定位影响收益的异常。'}, {title:'工单闭环',body:'把远程诊断和现场处置串起来。'}] },
        { type:'content', title:'试点到区域的推广半径', phases:[{title:'首批站点',body:'接入 3-5 个收益影响最大的站点。'}, {title:'闭环验证',body:'验证告警、派工、复盘和收益口径。'}, {title:'区域推广',body:'扩展到同一区域多站协同调度。'}, {title:'经营复盘',body:'按月更新策略和责任证据。'}] },
        closing('先把区域告警跑成闭环', '再扩展到收益复盘和多站调度。', [{title:'站点',body:'确认首批接入清单'},{title:'告警',body:'统一分级规则'},{title:'复盘',body:'建立周度收益复盘'}])
      ]
    }
  },
  {
    slug: 'energy-utility-image-heavy',
    densityProfile: 'image-heavy',
    required: ['能源', '电站', '储能'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'energy-utility',
      documentType: 'site-evidence',
      visualIntent: 'image-rich',
      title: '新能源电站现场证据汇报',
      coverInsight: '以储能现场、站端细节和区域运维证据解释平台价值。',
      organization: '曜能数智科技有限公司',
      audience: '新能源运营管理层',
      date: '2026年5月',
      footer: '新能源电站现场证据汇报',
      media: { cover:'assets/media/energy-storage-cover.jpg', detail:'assets/media/energy-storage-detail.jpg', band:'assets/media/energy-storage-band.jpg', gallery:['assets/media/energy-storage-detail.jpg','assets/media/energy-storage-band.jpg','assets/media/energy-storage-cover.jpg','assets/media/energy-storage-source.jpg'] },
      slides: [
        { type:'auto', title:'新能源电站现场证据汇报', subtitle:'以储能现场、站端细节和区域运维证据解释平台价值。' },
        { type:'toc-clean', title:'现场证据路径', items:['站端现场','设备细节','告警闭环','区域复盘','下一步动作'] },
        { type:'content', title:'站端现场证据板', subtitle:'用站端、设备、区域和原始素材四类证据支撑运维判断。', layoutVariant:'evidence-board', imageLayout:'mosaic-1-3', images:['assets/media/energy-storage-detail.jpg','assets/media/energy-storage-band.jpg','assets/media/energy-storage-cover.jpg','assets/media/energy-storage-source.jpg'], cards:[{title:'储能现场',body:'站端资产和安全边界。'}, {title:'设备细节',body:'状态对象可检查。'}, {title:'区域视角',body:'多站调度可复盘。'}, {title:'原始素材',body:'保留现场证据来源。'}] },
        { type:'content', title:'站端接入前后对比', before:{title:'接入前',body:'告警、巡检和收益复盘分散。',image:'assets/media/energy-storage-band.jpg'}, after:{title:'接入后',body:'站端状态和工单闭环进入统一视图。',image:'assets/media/energy-storage-detail.jpg'}, metrics:[{label:'闭环率',value:'91%'},{label:'响应缩短',value:'21%'}] },
        { type:'content', title:'站端到区域的数据拓扑', subtitle:'能源证据页之后应进入站端数据、告警、工单和收益复盘的运行链路。', layers:[{title:'站端设备',items:['储能柜','PCS','BMS','电表']},{title:'数据接入',items:['采集频率','异常值','历史曲线']},{title:'运维调度',items:['告警分级','工单派发','现场验证']},{title:'经营复盘',items:['收益偏差','策略更新','区域协同']}] },
        { type:'content', title:'设备运维价值信号', metrics:[{label:'可用率',value:'98.2%',delta:'提升 1.1pt',note:'站端故障处置更及时。'}, {label:'告警闭环',value:'91%',delta:'提升 14 个百分点',note:'告警分级和派工联动。'}, {label:'收益偏差',value:'-4.8%',delta:'收窄 2.1pt',note:'调度策略复盘改善。'}] },
        { type:'closing', title:'让站端证据进入区域化经营', subtitle:'先跑通一批重点站点，再扩展多区域运维。', actions:[{title:'站端',body:'确认现场资产'},{title:'告警',body:'建立处置链'},{title:'收益',body:'形成复盘口径'}] }
      ]
    }
  },
  {
    slug: 'saas-technology-text-heavy',
    densityProfile: 'text-heavy',
    required: ['SaaS', '平台', '客户'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'saas-technology',
      documentType: 'product-platform',
      visualMode: 'solid',
      contentDensity: 'text-heavy',
      title: '企业 SaaS 平台增长方案',
      coverInsight: '以平台能力、客户采用和收入指标连接产品价值与商业增长。',
      organization: '曜能数智科技有限公司',
      audience: 'SaaS 公司管理层',
      date: '2026年5月',
      footer: '企业 SaaS 平台增长方案',
      slides: [
        { type:'auto', title:'企业 SaaS 平台增长方案', subtitle:'以平台能力、客户采用和收入指标连接产品价值与商业增长。' },
        { type:'chapter-divider', chapter:'01', title:'平台增长与客户采用', items:[{title:'平台能力',body:'模块、集成、数据。'}, {title:'客户采用',body:'激活、留存、扩展。'}, {title:'商业结果',body:'ARR、NRR、毛利。'}] },
        { type:'content', title:'客户采用信息板', claim:'SaaS 文案多时应转为报告型信息板，避免把客户、产品、收入拆成泛化卡片。', cards:[{title:'激活路径',body:'从账号创建、首个团队空间到核心动作完成，需要明确激活口径。'}, {title:'集成深度',body:'CRM、工单、数据仓库和身份系统的集成决定平台嵌入度。'}, {title:'使用频次',body:'周活跃团队、关键工作流执行次数和自动化任务量共同判断粘性。'}, {title:'扩展机会',body:'从单团队使用扩展到跨部门协同，需要识别权限、模板和数据治理需求。'}, {title:'客户健康',body:'把使用下降、集成断点、支持工单和续约风险放入同一套预警机制。'}, {title:'商业闭环',body:'将采用深度与 NRR、ARR 扩展和毛利改善关联，形成增长复盘。'}, {title:'治理要求',body:'安全、权限、审计和数据边界是企业客户采购的关键门槛。'}] },
        { type:'content', title:'平台能力地图', subtitle:'把核心工作流、自动化、数据事件、企业集成和治理能力放在同一张图里。', coreTitle:'核心工作流成立，平台才有复利', coreBody:'SaaS 能力页应把模块放回用户动作、数据事件和企业治理，不只是功能列表。', platformCapabilities:[{title:'任务空间',body:'承接跨部门协同。'}, {title:'自动化',body:'减少重复操作。'}, {title:'分析视图',body:'暴露价值信号。'}, {title:'治理日志',body:'满足企业审计。'}], layers:[{title:'入口层',items:['Web App','Admin Console','API']},{title:'业务层',items:['工作流','自动化','协同空间','模板库']},{title:'数据层',items:['客户数据','事件流','权限模型','审计日志']},{title:'集成层',items:['CRM','工单','SSO','数据仓库']}], metrics:[{label:'激活率',value:'64%'},{label:'集成客户',value:'72%'}] },
        { type:'content', title:'客户采用漏斗', subtitle:'用采用漏斗把注册、激活、集成和扩展收入放到同一个客户进阶链路。', adoptionFunnel:[{title:'注册团队',value:100,unit:'%'}, {title:'完成激活',value:64,unit:'%'}, {title:'完成集成',value:46,unit:'%'}, {title:'扩展席位',value:28,unit:'%'}] },
        { type:'content', title:'增长指标进入复盘区间', metrics:[{label:'NRR',value:'118%',delta:'提升 6 个百分点',note:'扩展收入和留存改善。'}, {label:'激活率',value:'64%',delta:'提升 11%',note:'首个核心工作流完成率上升。'}, {label:'集成客户',value:'72%',delta:'提升 9%',note:'系统嵌入度增强。'}] },
        closing('把产品采用转成收入增长', '先统一客户健康口径，再推动扩展收入复盘。', [{title:'采用',body:'锁定核心动作'},{title:'集成',body:'提升平台嵌入'},{title:'收入',body:'复盘 NRR 贡献'}])
      ]
    }
  },
  {
    slug: 'saas-technology-image-heavy',
    densityProfile: 'image-heavy',
    required: ['SaaS', '产品', '原型'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'saas-technology',
      documentType: 'product-demo',
      visualIntent: 'image-rich',
      title: '企业 SaaS 产品原型图册',
      coverInsight: '用界面原型、产品故事和客户工作流说明平台体验。',
      organization: '曜能数智科技有限公司',
      audience: 'SaaS 公司管理层',
      date: '2026年5月',
      footer: '企业 SaaS 产品原型图册',
      media: { cover: stressAssets.saas[0], detail: stressAssets.saas[1], gallery: stressAssets.saas },
      slides: [
        { type:'auto', title:'企业 SaaS 产品原型图册', subtitle:'用界面原型、产品故事和客户工作流说明平台体验。' },
        { type:'chapter-divider', chapter:'01', title:'产品原型与工作流示意', items:[{title:'界面原型',body:'看清核心对象。'}, {title:'工作流示意',body:'说明用户动作。'}, {title:'采用信号',body:'连接客户价值。'}] },
        { type:'content', title:'核心产品原型单品页', visual:{ role:'showcase', image:stressAssets.saas[0], caption:'界面原型用于展示核心工作流示意。' }, product:{ title:'企业协同工作台', body:'把任务、自动化、数据和审批集中到一个团队空间。' }, features:[{title:'任务空间',body:'承接跨部门协同。'}, {title:'自动化',body:'减少重复操作。'}, {title:'审计日志',body:'满足企业治理。'}], metrics:[{label:'激活率',value:'64%'},{label:'集成客户',value:'72%'}] },
        { type:'content', title:'界面状态证据板', subtitle:'四个界面状态分别对应对象、动作、自动化和价值信号。', layoutVariant:'evidence-board', imageLayout:'mosaic-1-3', images:stressAssets.saas, cards:[{title:'工作台对象',body:'核心对象和入口可见。'}, {title:'自动化路径',body:'流程动作可解释。'}, {title:'分析视图',body:'价值信号可复盘。'}, {title:'治理状态',body:'权限和审计可交付。'}] },
        { type:'content', title:'混合素材证据压力页', subtitle:'同时给竖图、截图、宽图和低清材料，验证证据页不会退回横排普通卡片。', layoutVariant:'evidence-board', images:stressAssets.dirty, allowDirtyAssets:true, cards:[{title:'竖版截图',body:'来自移动端或现场拍照。'}, {title:'低清材料',body:'保留证据但降低装饰。'}, {title:'界面截图',body:'用截图板呈现状态。'}, {title:'宽幅现场',body:'裁切进入主证据。'}] },
        { type:'content', title:'平台能力地图', subtitle:'产品图册之后应把界面状态放回平台能力、企业集成和客户采用链路。', coreTitle:'核心工作流成立，平台才有复利', coreBody:'SaaS 能力页应围绕用户动作、数据事件和企业治理组织。', platformCapabilities:[{title:'任务空间',body:'承接跨部门协同。'}, {title:'自动化',body:'减少重复操作。'}, {title:'分析视图',body:'暴露价值信号。'}, {title:'治理日志',body:'满足企业审计。'}], layers:[{title:'入口层',items:['Web App','Admin Console','API']},{title:'业务层',items:['工作流','自动化','模板']},{title:'数据层',items:['事件流','权限模型','审计日志']},{title:'集成层',items:['CRM','SSO','数据仓库']}], metrics:[{label:'激活率',value:'64%'},{label:'集成客户',value:'72%'}] },
        { type:'content', title:'采用漏斗验证客户进阶', subtitle:'产品图册不能只展示界面，还要把注册、激活、集成和扩展收入串成采用证据。', adoptionFunnel:[{title:'注册团队',value:100,unit:'%'}, {title:'完成激活',value:64,unit:'%'}, {title:'完成集成',value:46,unit:'%'}, {title:'扩展席位',value:28,unit:'%'}] },
        { type:'content', title:'采用前后体验示意', before:{title:'使用前',body:'团队流程分散在多个工具。',image:stressAssets.saas[1]}, after:{title:'使用后',body:'任务、数据和审批进入统一空间。',image:stressAssets.saas[2]}, metrics:[{label:'激活率',value:'64%'},{label:'协同效率',value:'+18%'}] },
        { type:'closing', closingVariant:'thank-you', title:'谢谢观看', subtitle:'期待一起把产品原型转化为客户采用和收入增长。' }
      ]
    }
  }
);

const manifest = {
  generatedAt: new Date().toISOString(),
  outputRoot: OUT_ROOT,
  demos: []
};

for (const demo of demos) {
  const dir = path.join(OUT_ROOT, demo.slug);
  const planPath = path.join(dir, `${demo.slug}-plan.json`);
  const pptxPath = path.join(dir, `${demo.slug}.pptx`);
  const previewDir = path.join(dir, 'preview');
  const qaPath = path.join(dir, `${demo.slug}-qa.json`);
  fs.mkdirSync(dir, { recursive: true });
  const planForRun = Object.assign({ showMeta: false }, demo.plan, { densityProfile: demo.densityProfile || demo.plan.densityProfile });
  writeJson(planPath, planForRun);
  const normalized = normalizeDeckPlan(planForRun);
  runNode('scripts/generate_pptx.js', [rel(planPath), rel(pptxPath)], { timeout: 120000 });
  runNode('scripts/validate_pptx.js', [
    rel(pptxPath),
    '--expect-slides', String(planForRun.slides.length),
    '--require', demo.required.join(','),
    '--preview-dir', rel(previewDir)
  ], { timeout: 120000 });
  const qaRaw = runNode('scripts/visual_qa.js', [
    rel(pptxPath),
    '--preview-dir', rel(previewDir),
    '--plan', rel(planPath),
    '--json'
  ], { timeout: 120000 });
  const qa = JSON.parse(qaRaw);
  writeJson(qaPath, qa);
  manifest.demos.push({
    slug: demo.slug,
    industry: planForRun.industry,
    densityProfile: demo.densityProfile || planForRun.densityProfile || '',
    plan: planPath,
    pptx: pptxPath,
    previewDir,
    qa: qaPath,
    slideCount: planForRun.slides.length,
    failCount: qa.fail_count,
    reviewCount: qa.review_count,
    routeSummary: routeSummary(normalized.slides),
    routedTypes: qa.slides.map((slide, i) => ({
      slide: i + 1,
      title: planForRun.slides[i].title,
      type: normalized.slides[i] && normalized.slides[i].type,
      variant: normalized.slides[i] && normalized.slides[i].layoutVariant,
      reason: normalized.slides[i] && normalized.slides[i].layoutRationale,
      recipe: normalized.slides[i] && normalized.slides[i].referenceRecipe && normalized.slides[i].referenceRecipe.id,
      textRuns: slide.textRuns,
      images: slide.images
    }))
  });
}

const manifestPath = path.join(OUT_ROOT, 'manifest.json');
writeJson(manifestPath, manifest);
console.log(JSON.stringify({
  success: true,
  manifest: manifestPath,
  demos: manifest.demos.map(d => ({
    slug: d.slug,
    industry: d.industry,
    densityProfile: d.densityProfile,
    pptx: d.pptx,
    failCount: d.failCount,
    reviewCount: d.reviewCount
  }))
}, null, 2));
