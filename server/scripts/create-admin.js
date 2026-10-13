const { randomBytes, scrypt: scryptCallback } = require('node:crypto');
const { promisify } = require('node:util');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();
const scrypt = promisify(scryptCallback);

const main = async () => {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PASSWORD) throw new Error('Set MONGO_URI, ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD before running this script.');
  if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('ADMIN_EMAIL must be a valid email address.');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  if (await User.exists({ email })) throw new Error('An account already exists for ADMIN_EMAIL; this script will not promote or reset an existing account.');
  const salt = randomBytes(16).toString('hex');
  const passwordHash = `${salt}:${(await scrypt(ADMIN_PASSWORD, salt, 64)).toString('hex')}`;
  await User.create({ fullName: ADMIN_NAME.trim().slice(0, 100), email, passwordHash, role: 'Admin', isActive: true });
  process.stdout.write(`Administrator account created for ${email}. Remove ADMIN_PASSWORD from the environment now.\n`);
};

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});
