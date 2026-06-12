function defaultServiceBlueprintSteps() {
  return [
    { title:'预约', patient:'线上预约/资料确认', frontstage:'客服确认需求', backstage:'排班与号源协调', evidence:'等待时长' },
    { title:'到院', patient:'导诊/签到', frontstage:'导诊台分流', backstage:'诊室与检查资源联动', evidence:'排队状态' },
    { title:'检查', patient:'完成检查项目', frontstage:'医护解释流程', backstage:'检查排程与结果同步', evidence:'异常反馈' },
    { title:'随访', patient:'接收结果和建议', frontstage:'客服回访', backstage:'质控复盘和整改', evidence:'满意度' }
  ];
}

function serviceBlueprintColumns(s = {}) {
  const raw = s.serviceBlueprint || s.touchpoints || s.journeyMap || s.phases || [];
  const steps = (Array.isArray(raw) ? raw : []).slice(0,4).map(v => typeof v === 'string' ? { title:v } : v);
  const fallback = defaultServiceBlueprintSteps();
  const cols = (steps.length ? steps : fallback).slice(0,4).map((step,i)=>Object.assign({}, fallback[i] || {}, step));
  return {
    cols,
    fallback
  };
}

module.exports = {
  defaultServiceBlueprintSteps,
  serviceBlueprintColumns
};
