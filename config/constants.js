module.exports = {
  ROLES: {
    ADMIN: 'Admin',
    FINANCE_OFFICER: 'Finance Officer',
    DEPARTMENT_HEAD: 'Department Head'
  },
  ALERT_TYPES: {
    UNDER_UTILIZATION: 'Under-utilization',
    OVERSPENDING: 'Overspending',
    SPIKE: 'Spike'
  },
  SEVERITY: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High'
  },
  DEFAULT_THRESHOLDS: {
    underUtilizationPercent: Number(process.env.UNDER_UTILIZATION_THRESHOLD) || 40,
    timeElapsedPercent: Number(process.env.TIME_ELAPSED_THRESHOLD) || 70,
    spikeMultiplier: Number(process.env.SPIKE_MULTIPLIER) || 3
  }
};
