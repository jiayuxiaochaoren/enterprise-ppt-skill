function qualityModeDescriptionIssues(qualityModes = {}, modes = {}, issue = () => ({})) {
  const modeDescriptions = qualityModes && typeof qualityModes === 'object' ? qualityModes : {};
  const computedModeIds = Object.keys(modes || {});
  const describedModeIds = Object.keys(modeDescriptions);
  const issues = [];
  computedModeIds.forEach(mode => {
    const description = modeDescriptions[mode] && modeDescriptions[mode].description;
    if (!description) {
      issues.push(issue('review', 'qualityModeDescriptionMissing', mode, `quality mode is missing a matrix description: ${mode}`));
    }
  });
  describedModeIds
    .filter(mode => !computedModeIds.includes(mode))
    .forEach(mode => {
      issues.push(issue('review', 'qualityModeDescriptionStale', mode, `quality mode description is not emitted by readiness audit: ${mode}`));
    });
  return issues;
}

module.exports = {
  qualityModeDescriptionIssues
};
