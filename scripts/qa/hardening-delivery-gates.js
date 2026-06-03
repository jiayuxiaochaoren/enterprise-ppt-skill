function deliveryGateStatus(row = {}) {
  if (row.commandAvailable && row.missingArtifacts.length === 0) return 'pass';
  if (row.commandAvailable || row.artifactCount > row.missingArtifacts.length) return 'partial';
  return 'missing';
}

function deliveryGateRows(gates = [], opts = {}) {
  const {
    commandLooksAvailable = () => false,
    exists = () => false
  } = opts;
  return gates.map(gate => {
    const artifacts = Array.isArray(gate.artifacts) ? gate.artifacts : [];
    const missingArtifacts = artifacts.filter(file => !exists(file));
    const commandAvailable = commandLooksAvailable(gate.command || '');
    const row = {
      id: gate.id || 'deliveryGate',
      required: gate.required !== false,
      command: gate.command || '',
      commandAvailable,
      artifactCount: artifacts.length,
      missingArtifacts,
      artifacts
    };
    row.status = deliveryGateStatus(row);
    row.ready = row.status === 'pass';
    return row;
  });
}

function deliveryGateTotals(rows = []) {
  return rows.reduce((totals, row) => {
    totals[row.status] = (totals[row.status] || 0) + 1;
    return totals;
  }, { pass: 0, partial: 0, missing: 0 });
}

module.exports = {
  deliveryGateRows,
  deliveryGateStatus,
  deliveryGateTotals
};
