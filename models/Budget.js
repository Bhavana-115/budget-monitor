const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    financialYear: { type: String, required: true, trim: true }, // e.g. "2025-2026"
    quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4', 'Annual'], default: 'Annual' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    projectName: { type: String, trim: true },
    allocatedAmount: { type: Number, required: true, min: 0 },
    allocationDate: { type: Date, required: true, default: Date.now },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Virtual: total spent, populated on demand via aggregation in the service layer,
// but exposed here for convenience when pre-computed and attached.
budgetSchema.virtual('utilizationPercent');

budgetSchema.index({ department: 1, financialYear: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
