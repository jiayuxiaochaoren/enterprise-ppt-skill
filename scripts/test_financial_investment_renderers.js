const assert = require('assert/strict');
const {
  createFinancialInvestmentRenderers
} = require('./render/page-families/financial-investment');

function createFakeCtx(ops) {
  const push = (name, args) => ops.push({ name, args });
  return {
    colors: () => ({
      text:'111111',
      muted:'777777',
      line:'DDDDDD',
      accent:'0066CC',
      risk:'CC3300',
      cyan:'00AACC',
      violet:'7755DD',
      ink:'0F172A',
      white:'FFFFFF',
      body:'333333',
      onAccent:'FFFFFF'
    }),
    lightCanvas: slide => push('lightCanvas', [slide]),
    sectionKicker: (...args) => push('sectionKicker', args),
    addText: (...args) => push('addText', args),
    addRect: (...args) => push('addRect', args),
    addLabel: (...args) => push('addLabel', args),
    addHairline: (...args) => push('addHairline', args),
    addNumber: (...args) => push('addNumber', args),
    PageNumber: (...args) => push('PageNumber', args),
    panelFill: () => 'F8FAFC',
    footerText: () => 'footer',
    itemTitle: (item, fallback) => item.title || fallback,
    itemBody: item => item.body || '',
    compactEvidenceCaption: (value, max = 18) => String(value || '').slice(0, max)
  };
}

const ops = [];
const slide = {
  addShape: (...args) => ops.push({ name:'addShape', args })
};
const renderers = createFinancialInvestmentRenderers(createFakeCtx(ops));

assert.equal(typeof renderers.financeBridgeSlide, 'function');
assert.equal(typeof renderers.portfolioTableSlide, 'function');

renderers.financeBridgeSlide(slide, { industry:'finance-investment' }, {
  title:'回报归因桥',
  subtitle:'回报来源拆解',
  bridge:[
    { label:'起始 IRR', value:'12%', kind:'start' },
    { label:'退出窗口', value:'+3%', kind:'up' },
    { label:'目标 IRR', value:'15%', kind:'end' }
  ],
  actions:[{ title:'加速退出', body:'锁定买方窗口' }]
}, 2);

renderers.portfolioTableSlide(slide, { industry:'finance-investment' }, {
  title:'组合分层',
  subtitle:'行动优先级',
  portfolio:[
    { theme:'A 项目', weight:40, irr:'18%', dpi:'0.4x', risk:'中', action:'维持观察' },
    { theme:'B 项目', weight:20, irr:'12%', dpi:'0.2x', risk:'高', action:'风险隔离' }
  ]
}, 3);

function assertNear(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 0.0001, `${label}: expected ${expected}, got ${actual}`);
}

function assertHeaderText(text, expected) {
  const op = ops.find(candidate => {
    if (candidate.name !== 'addText' || candidate.args[1] !== text) return false;
    const opts = candidate.args[2] || {};
    return Object.entries(expected).every(([key, value]) => opts[key] === value);
  });
  assert.ok(op, `expected header text ${text}`);
  const opts = op.args[2] || {};
  assertNear(opts.x, expected.x, `${text} x`);
  assertNear(opts.y, expected.y, `${text} y`);
  assertNear(opts.w, expected.w, `${text} width`);
  assertNear(opts.h, expected.h, `${text} height`);
  assertNear(opts.fontSize, expected.fontSize, `${text} font`);
  assert.equal(opts.color, expected.color);
  assert.equal(opts.fit, 'shrink');
  if (expected.bold != null) assert.equal(opts.bold, expected.bold);
}

function assertHeaderChrome() {
  assert.equal(ops.filter(op => op.name === 'lightCanvas').length, 2, 'expected two primitive light headers');
  assertHeaderText('回报归因桥', {
    x:0.84, y:1.06, w:5.8, h:0.36, fontSize:24, bold:true, color:'111111', fit:'shrink'
  });
  assertHeaderText('回报来源拆解', {
    x:0.86, y:1.54, w:6.9, h:0.20, fontSize:10.2, color:'777777', fit:'shrink'
  });
  assertHeaderText('组合分层', {
    x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:'111111', fit:'shrink'
  });
  assertHeaderText('行动优先级', {
    x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.2, color:'777777', fit:'shrink'
  });
  const bridgePage = ops.find(op => op.name === 'PageNumber' && op.args[1] === 2);
  assert.ok(bridgePage, 'expected bridge page to keep PageNumber chrome');
  const tablePage = ops.find(op => op.name === 'addNumber' && op.args[1] === '03');
  assert.ok(tablePage, 'expected table page number');
  const pageOpts = tablePage.args[2] || {};
  assertNear(pageOpts.x, 11.70, 'table page number x');
  assertNear(pageOpts.y, 0.66, 'table page number y');
  assertNear(pageOpts.w, 0.72, 'table page number width');
  assertNear(pageOpts.h, 0.22, 'table page number height');
  assertNear(pageOpts.fontSize, 13, 'table page number font');
  assert.equal(pageOpts.color, '0066CC');
  assert.equal(pageOpts.align, 'right');
}

function findRect(expected) {
  return ops.find(op => {
    if (op.name !== 'addRect') return false;
    return ['x', 'y', 'w', 'h'].every((key, i) => Math.abs(op.args[i + 1] - expected[key]) < 0.0001);
  });
}

function assertPortfolioTableShell() {
  assert.ok(findRect({ x:0.92, y:2.10, w:2.72, h:3.94 }), 'expected portfolio allocation summary panel');
  assert.ok(findRect({ x:3.94, y:2.10, w:7.84, h:3.94 }), 'expected portfolio action table panel');
  assert.ok(findRect({ x:8.40, y:3.04, w:0.54, h:0.24 }), 'expected first portfolio risk badge');
  assert.ok(findRect({ x:8.40, y:3.58, w:0.54, h:0.24 }), 'expected second portfolio risk badge');

  ['ALLOCATION VIEW'].forEach(label => {
    assert.ok(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected portfolio table label ${label}`
    );
  });

  ['主题', '权重', 'IRR', 'DPI', '风险', '动作', 'A 项目', '40%', '18%', '0.4x', '中', '维持观察', 'B 项目', '20%', '12%', '0.2x', '高', '风险隔离'].forEach(text => {
    assert.ok(
      ops.some(op => op.args.includes(text)),
      `expected portfolio table content ${text}`
    );
  });
}

assert.ok(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'RETURN BRIDGE'));
assert.ok(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'PORTFOLIO ACTION TABLE'));
assert.ok(ops.some(op => op.name === 'addShape' && op.args[0] === 'ellipse'));
assert.ok(ops.filter(op => op.name === 'addText').length > 10);
assertHeaderChrome();
assertPortfolioTableShell();
const footerOps = ops.filter(op => op.name === 'addText' && op.args[1] === 'footer');
assert.equal(footerOps.length, 2);
footerOps.forEach(op => {
  assert.equal(op.args[2].x, 0.82);
  assert.equal(op.args[2].y, 7.05);
  assert.equal(op.args[2].w, 7.8);
  assert.equal(op.args[2].h, 0.16);
  assert.equal(op.args[2].fontSize, 7.8);
  assert.equal(op.args[2].color, '777777');
});

console.log('financial investment renderers ok');
