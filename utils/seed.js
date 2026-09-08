require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const { ROLES } = require('../config/constants');

const run = async () => {
  await connectDB();

  const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
  if (existingAdmin) {
    console.log('An admin user already exists:', existingAdmin.email);
    process.exit(0);
  }

  const departments = await Department.insertMany([
    { name: 'Finance Department', code: 'FIN', description: 'Central finance and treasury' },
    { name: 'Public Works Department', code: 'PWD', description: 'Infrastructure and works' },
    { name: 'Health Department', code: 'HLTH', description: 'Public health services' }
  ]);
  console.log(`Created ${departments.length} sample departments.`);

  const admin = await User.create({
    name: 'System Administrator',
    email: 'admin@budgetmonitor.gov',
    password: 'ChangeMe123!',
    role: ROLES.ADMIN
  });

  console.log('Created initial admin user:');
  console.log(`  email: ${admin.email}`);
  console.log('  password: ChangeMe123!  (change this immediately after first login)');

  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
