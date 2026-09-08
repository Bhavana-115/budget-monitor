const AuditLog = require('../models/AuditLog');

// Fire-and-forget audit trail writer. Never throws to avoid breaking the main request.
const logAction = async ({ user, action, entityType, entityId, details, req }) => {
  try {
    await AuditLog.create({
      user,
      action,
      entityType,
      entityId,
      details,
      ipAddress: req ? req.ip : undefined
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = logAction;
