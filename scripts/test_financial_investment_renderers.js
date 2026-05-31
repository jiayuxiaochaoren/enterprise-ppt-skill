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
  bridge:[
    { label:'起始 IRR', value:'12%', kind:'start' },
    { label:'退出窗口', value:'+3%', kind:'up' },
    { label:'目标 IRR', value:'15%', kind:'end' }
  ],
  actions:[{ title:'加速退出', body:'锁定买方窗口' }]
}, 2);

renderers.portfolioTableSlide(slide, { industry:'finance-investment' }, {
  title:'组合分层',
  portfolio:[
    { theme:'A 项目', weight:40, irr:'18%', dpi:'0.4x', risk:'中', action:'维持观察' },
    { theme:'B 项目', weight:20, irr:'12%', dpi:'0.2x', risk:'高', action:'风险隔离' }
  ]
}, 3);

assert.ok(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'RETURN BRIDGE'));
assert.ok(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'PORTFOLIO ACTION TABLE'));
assert.ok(ops.some(op => op.name === 'addShape' && op.args[0] === 'ellipse'));
assert.ok(ops.filter(op => op.name === 'addText').length > 10);

console.log('financial investment renderers ok');
