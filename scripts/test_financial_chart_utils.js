const assert = require('assert/strict');
const {
  chartBoxesOverlap,
  chartClamp,
  chartNumber,
  chooseChannelLabelBox,
  coerceChartItems,
  computeChannelMatrixBubbles,
  computeMonthlyTrendPoints,
  computeWaterfallBars,
  firstChartItems
} = require('./render/page-families/financial-chart-utils');

assert.deepEqual(coerceChartItems(['收入', '成本']), [{ title:'收入' }, { title:'成本' }]);
assert.deepEqual(coerceChartItems({ rows:[['Q1', '+12%', '预算内']] }), [{ title:'Q1', value:'+12%', body:'预算内' }]);
assert.equal(chartNumber('+252w'), 252);
assert.equal(chartNumber('-18.5%'), -18.5);
assert.equal(chartNumber('n/a', 7), 0);
assert.equal(chartClamp(12, 0, 10), 10);
assert.equal(chartBoxesOverlap({ x:0, y:0, w:1, h:1 }, { x:0.5, y:0.5, w:1, h:1 }), true);

const sourceItems = firstChartItems({
  bridge: { rows:[['Start', '100'], ['Lift', '+20']] }
}, ['waterfallBridge', 'bridge'], []);
assert.equal(sourceItems.length, 2);
assert.equal(sourceItems[1].title, 'Lift');

const waterfall = computeWaterfallBars([
  { label:'Start', value:'100', kind:'start' },
  { label:'Lift', value:'+20', kind:'up' },
  { label:'Drop', value:'-10', kind:'down' },
  { label:'Target', value:'130', kind:'end' }
], { baseY:4, topY:1 });
assert.deepEqual(waterfall.bars.map(bar => [bar.kind, bar.from, bar.to]), [
  ['start', 0, 100],
  ['up', 100, 120],
  ['down', 120, 110],
  ['end', 0, 130]
]);
assert.equal(waterfall.yForValue(waterfall.maxVal), 1);
assert.equal(waterfall.yForValue(waterfall.minVal), 4);

const trend = computeMonthlyTrendPoints([
  { label:'1月', value:'100' },
  { label:'2月', value:'80' },
  { label:'3月', value:'140' }
], { x:1, y:2, w:5, h:3 }, [100, 80, 140]);
assert.equal(trend.points.length, 3);
assert.ok(trend.points[2].y < trend.points[1].y, 'larger values should plot higher');
assert.equal(trend.baselineY, 5);

const chart = { x:0, y:0, w:10, h:5 };
const bubbles = computeChannelMatrixBubbles([
  { label:'私域CRM', x:22, y:82, size:64 },
  { label:'抖音', spend:84, roas:44, weight:46 }
], chart, ['A', 'B']);
assert.equal(bubbles.length, 2);
assert.equal(bubbles[0].color, 'A');
assert.ok(bubbles[0].x > 2 && bubbles[0].x < 3);
assert.ok(bubbles[0].y < 1.2);
const occupiedLabels = [];
const firstLabel = chooseChannelLabelBox(bubbles[0], { chart, bubbles, occupiedLabels });
occupiedLabels.push(firstLabel);
const secondLabel = chooseChannelLabelBox(bubbles[1], { chart, bubbles, occupiedLabels });
assert.equal(firstLabel.label, '私域CRM');
assert.equal(secondLabel.label, '抖音');
assert.ok(firstLabel.x >= chart.x + 0.08 && firstLabel.x + firstLabel.w <= chart.x + chart.w - 0.08);
assert.ok(secondLabel.y >= chart.y + 0.08 && secondLabel.y + secondLabel.h <= chart.y + chart.h - 0.08);
assert.equal(firstLabel.align, 'left');

const restaurantChart = { x:1.46, y:2.72, w:9.78, h:2.84 };
const restaurantBubbles = computeChannelMatrixBubbles([
  { label:'美团外卖', value:'6683万', x:78, y:64, size:88 },
  { label:'小程序自提', value:'6312万', x:42, y:70, size:78 },
  { label:'堂食', value:'5975万', x:46, y:52, size:70 },
  { label:'企业团餐', value:'5806万', x:58, y:46, size:68 },
  { label:'饿了么', value:'5489万', x:64, y:59, size:62 }
], restaurantChart, ['A', 'B', 'C', 'D', 'E']);
const restaurantLabels = [];
function labelAnchorDistance(point, labelBox) {
  const anchorX = labelBox.align === 'right'
    ? labelBox.x + labelBox.w
    : (labelBox.align === 'center' ? labelBox.x + labelBox.w / 2 : labelBox.x);
  return Math.max(0, Math.hypot(anchorX - point.x, (labelBox.y + labelBox.h / 2) - point.y) - point.r);
}
restaurantBubbles.forEach(point => {
  const labelBox = chooseChannelLabelBox(point, { chart:restaurantChart, bubbles:restaurantBubbles, occupiedLabels:restaurantLabels });
  restaurantLabels.push(labelBox);
  assert.ok(['left', 'right', 'center'].includes(labelBox.align), `${labelBox.label} should carry a text anchor`);
  assert.ok(labelAnchorDistance(point, labelBox) <= 0.24, `${labelBox.label} should stay visually attached to its bubble`);
});
const pickupLabel = restaurantLabels.find(labelBox => labelBox.label === '小程序自提');
const dineInLabel = restaurantLabels.find(labelBox => labelBox.label === '堂食');
assert.equal(pickupLabel.align, 'right', 'left-side channel labels should right-align toward their bubble');
assert.equal(dineInLabel.align, 'center', 'vertical channel labels should center-align over their bubble');

console.log('financial chart utils ok');
