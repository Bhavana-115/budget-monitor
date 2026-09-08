const Budget = require('../models/Budget');
const Expenditure = require('../models/Expenditure');
const Alert = require('../models/Alert');
const ThresholdConfig = require('../models/ThresholdConfig');
const { ALERT_TYPES, SEVERITY } = require('../config/constants');

/**
 * Computes total spend and utilization percentage for a single budget.
 */
const getBudgetUtilization = async (budgetId) => {
  const budget = await Budget.findById(budgetId);
  if (!budget) return null;

  const result = await Expenditure.aggregate([
    { $match: { budget: budget._id } },
    { $group: { _id: null, totalSpent: { $sum: '$amountSpent' } } }
  ]);

  const totalSpent = result.length ? result[0].totalSpent : 0;
  const utilizationPercent = budget.allocatedAmount > 0
    ? Number(((totalSpent / budget.allocatedAmount) * 100).toFixed(2))
    : 0;

  const now = Date.now();
  const start = new Date(budget.periodStart).getTime();
  const end = new Date(budget.periodEnd).getTime();
  const totalDuration = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), totalDuration);
  const timeElapsedPercent = Number(((elapsed / totalDuration) * 100).toFixed(2));

  return {
    budget,
    totalSpent,
    remainingAmount: Number((budget.allocatedAmount - totalSpent).toFixed(2)),
    utilizationPercent,
    timeElapsedPercent
  };
};

/**
 * Returns utilization summaries for every active budget, optionally filtered by department.
 */
const getAllUtilizations = async (departmentId) => {
  const query = { isActive: true };
  if (departmentId) query.department = departmentId;

  const budgets = await Budget.find(query).populate('department', 'name code');
  const summaries = await Promise.all(
    budgets.map((b) => getBudgetUtilization(b._id))
  );
  return summaries.filter(Boolean);
};

/**
 * Rule-based anomaly detection. Runs three checks per budget:
 *  1. Under-utilization: spend is below threshold while a large share of the period has elapsed
 *  2. Overspending: spend exceeds the allocated amount
 *  3. Spike: a single transaction is disproportionately large relative to typical spend on that budget
 * Creates an Alert document for each detected condition (idempotent-ish: skips if an
 * unresolved alert of the same type already exists for the budget within the last 24h).
 */
const runAnomalyDetection = async (budgetId) => {
  const thresholds = await ThresholdConfig.getActive();
  const summary = await getBudgetUtilization(budgetId);
  if (!summary) return [];

  const { budget, utilizationPercent, timeElapsedPercent, totalSpent } = summary;
  const newAlerts = [];

  const alreadyAlerted = async (alertType) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return Alert.findOne({
      budget: budget._id,
      alertType,
      isResolved: false,
      createdAt: { $gte: since }
    });
  };

  // 1. Under-utilization
  if (
    timeElapsedPercent >= thresholds.timeElapsedPercent &&
    utilizationPercent < thresholds.underUtilizationPercent
  ) {
    if (!(await alreadyAlerted(ALERT_TYPES.UNDER_UTILIZATION))) {
      const alert = await Alert.create({
        department: budget.department,
        budget: budget._id,
        alertType: ALERT_TYPES.UNDER_UTILIZATION,
        severity: SEVERITY.MEDIUM,
        message: `Only ${utilizationPercent}% of the budget has been utilized while ${timeElapsedPercent}% of the period has elapsed.`,
        metrics: { utilizationPercent, timeElapsedPercent }
      });
      newAlerts.push(alert);
    }
  }

  // 2. Overspending
  if (utilizationPercent > 100) {
    if (!(await alreadyAlerted(ALERT_TYPES.OVERSPENDING))) {
      const alert = await Alert.create({
        department: budget.department,
        budget: budget._id,
        alertType: ALERT_TYPES.OVERSPENDING,
        severity: SEVERITY.HIGH,
        message: `Expenditure has exceeded the allocated budget. Utilization stands at ${utilizationPercent}%.`,
        metrics: { utilizationPercent, timeElapsedPercent, triggerAmount: totalSpent }
      });
      newAlerts.push(alert);
    }
  }

  return newAlerts;
};

/**
 * Detects an abnormal spending spike triggered by a single new expenditure transaction,
 * relative to the average of previous transactions on the same budget.
 */
const detectTransactionSpike = async (expenditure) => {
  const thresholds = await ThresholdConfig.getActive();

  const priorTransactions = await Expenditure.find({
    budget: expenditure.budget,
    _id: { $ne: expenditure._id }
  });

  if (priorTransactions.length < 3) return null; // not enough history to judge a spike

  const avg =
    priorTransactions.reduce((sum, t) => sum + t.amountSpent, 0) / priorTransactions.length;

  if (avg > 0 && expenditure.amountSpent >= avg * thresholds.spikeMultiplier) {
    const alert = await Alert.create({
      department: expenditure.department,
      budget: expenditure.budget,
      alertType: ALERT_TYPES.SPIKE,
      severity: SEVERITY.HIGH,
      message: `Transaction of ${expenditure.amountSpent} is ${(expenditure.amountSpent / avg).toFixed(
        1
      )}x the average transaction size (${avg.toFixed(2)}) for this budget.`,
      metrics: { triggerAmount: expenditure.amountSpent }
    });
    return alert;
  }

  return null;
};

/**
 * Runs anomaly detection across all active budgets. Intended to be called on a schedule
 * (see server.js) in addition to being triggered after each expenditure entry.
 */
const runFullSystemScan = async () => {
  const budgets = await Budget.find({ isActive: true });
  const results = [];
  for (const budget of budgets) {
    // eslint-disable-next-line no-await-in-loop
    const alerts = await runAnomalyDetection(budget._id);
    results.push(...alerts);
  }
  return results;
};

module.exports = {
  getBudgetUtilization,
  getAllUtilizations,
  runAnomalyDetection,
  detectTransactionSpike,
  runFullSystemScan
};
