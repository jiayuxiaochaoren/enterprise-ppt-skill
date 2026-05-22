const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'out', 'connector-pages');
fs.mkdirSync(outDir, { recursive: true });

const plan = {
  title: '连接器版式验证',
  industry: 'manufacturing-operations',
  showMeta: false,
  slides: [
    {
      type: 'architecture',
      layoutVariant: 'production-topology',
      title: '设备运维能力架构',
      layers: [
        { title:'设备与现场层', items:['PLC', '传感器', '点检终端', '备件台账'] },
        { title:'业务应用层', items:['设备健康', '告警分级', '维修工单', '保养计划'] },
        { title:'数据支撑层', items:['设备库', '故障库', '工单库', '备件库', 'OEE 指标'] }
      ]
    },
    {
      type: 'timeline',
      layoutVariant: 'closed-loop',
      title: '维修闭环路径',
      phases: [
        { title:'发现', body:'统一接入。' },
        { title:'派工', body:'自动分派。' },
        { title:'处置', body:'维修留痕。' },
        { title:'复盘', body:'更新策略。' }
      ]
    },
    {
      type: 'case-gallery',
      layoutVariant: 'case-comparison',
      title: '试点产线证据对比',
      before: { title:'改造前', body:'记录分散。' },
      after: { title:'改造后', body:'指标统一。' }
    },
    {
      type: 'risk-table',
      layoutVariant: 'responsibility-loop',
      title: '实施风险与治理保障',
      responsibilities: [
        { title:'定责', owner:'设备部', body:'明确责任与边界。' },
        { title:'处置', owner:'生产部', body:'推进处置动作。' },
        { title:'留痕', owner:'信息化', body:'沉淀过程证据。' },
        { title:'复盘', owner:'管理层', body:'更新治理机制。' }
      ]
    }
  ]
};

const planPath = path.join(outDir, 'connector-pages-plan.json');
const pptxPath = path.join(outDir, 'connector-pages.pptx');
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

execFileSync('node', [path.join(repoRoot, 'scripts', 'generate_pptx.js'), planPath, pptxPath], {
  cwd: repoRoot,
  stdio: 'pipe'
});

execFileSync('node', [
  path.join(repoRoot, 'scripts', 'validate_pptx.js'),
  pptxPath,
  '--expect-slides', '4',
  '--require', '设备,闭环,对比,责任'
], {
  cwd: repoRoot,
  stdio: 'pipe'
});

const slideNames = execFileSync('unzip', ['-Z1', pptxPath], { encoding:'utf8' })
  .split(/\r?\n/)
  .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name));

assert.equal(slideNames.length, 4, 'connector deck should contain four slides');
console.log('connector page generation ok');
