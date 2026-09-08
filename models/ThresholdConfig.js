const mongoose = require('mongoose');
const { DEFAULT_THRESHOLDS } = require('../config/constants');

// Singleton-style document holding the currently active detection thresholds.
// Admins can update this via the API instead of editing environment variables.
const thresholdConfigSchema = new mongoose.Schema(
  {
    underUtilizationPercent: {
      type: Number,
      default: DEFAULT_THRESHOLDS.underUtilizationPercent
    },
    timeElapsedPercent: {
      type: Number,
      default: DEFAULT_THRESHOLDS.timeElapsedPercent
    },
    spikeMultiplier: {
      type: Number,
      default: DEFAULT_THRESHOLDS.spikeMultiplier
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

thresholdConfigSchema.statics.getActive = async function getActive() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('ThresholdConfig', thresholdConfigSchema);
