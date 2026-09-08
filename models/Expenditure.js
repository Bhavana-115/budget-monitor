const mongoose = require('mongoose');

const expenditureSchema = new mongoose.Schema(
  {
    budget: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    amountSpent: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: [
        'Salaries',
        'Infrastructure',
        'Equipment',
        'Travel',
        'Maintenance',
        'Consultancy',
        'Utilities',
        'Miscellaneous'
      ]
    },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, trim: true },
    supportingDocument: { type: String }, // file path/URL of uploaded proof
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

expenditureSchema.index({ budget: 1, date: -1 });
expenditureSchema.index({ department: 1, date: -1 });

module.exports = mongoose.model('Expenditure', expenditureSchema);
