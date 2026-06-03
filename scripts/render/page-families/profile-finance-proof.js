const { createPageFamilyPrimitives } = require('./primitives');
const {
  createFinanceProfileCredentialsRenderer
} = require('./profile-finance-proof-credentials');
const {
  createFinanceProfileTrackRecordRenderer
} = require('./profile-finance-proof-track-record');

function createFinanceProfileProof(ctx = {}) {
  const { drawDarkPageHeader, drawFooter } = createPageFamilyPrimitives(ctx);
  const { drawFinanceProfileCredentials } = createFinanceProfileCredentialsRenderer(ctx);
  const { drawFinanceTrackRecordSignals } = createFinanceProfileTrackRecordRenderer(ctx);

  return function financeProfileProof(slide, plan, s, idx) {
    drawDarkPageHeader(slide, {
      kicker:'INVESTMENT PLATFORM PROOF',
      title:s.title || '管理团队与投后能力证明',
      titleW:6.3,
      titleH:0.38,
      subtitle:s.subtitle || s.claim,
      subtitleW:6.4,
      subtitleSize:10.2,
      idx
    });

    const left = { x:0.92, y:2.08, w:4.18, h:4.00 };
    drawFinanceProfileCredentials(slide, plan, s, left);
    const grid = { x:5.62, y:2.08, w:5.88, h:4.00 };
    drawFinanceTrackRecordSignals(slide, s, grid);
    drawFooter(slide, plan, { color:'64748B' });
  };
}

module.exports = {
  createFinanceProfileProof
};
