const mongoose = require('mongoose');
const { ALERT_TYPES, SEVERITY } = require('../config/constants');

const alertSchema = new mongoose.Schema(
  {
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    budget: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
    alertType: { type: String, enum: Object.values(ALERT_TYPES), required: true },
    severity: { type: String, enum: Object.values(SEVERITY), required: true },
    message: { type: String, required: true },
    metrics: {
      utilizationPercent: Number,
      timeElapsedPercent: Number,
      triggerAmount: Number
    },
    isResolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

alertSchema.index({ department: 1, createdAt: -1 });
alertSchema.index({ isResolved: 1 });

module.exports = mongoose.model('Alert', alertSchema);
