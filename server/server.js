const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { createHash, randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const Application = require('./models/Application');
const Job = require('./models/Job');
const User = require('./models/User');

dotenv.config();

const scrypt = promisify(scryptCallback);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vetrelief';
const MAX_AVATAR_BYTES = 1024 * 1024;
const MAX_RESUME_BYTES = 2 * 1024 * 1024;
const app = express();

const jobs = [
  {
    id: 1,
    title: 'Relief Veterinarian',
    clinic: 'Green Valley Animal Hospital',
    location: 'Bengaluru, India',
    type: 'Full Time',
    pay: '₹1,500 - ₹2,500 / hour',
    schedule: 'Flexible schedule',
    tags: ['Surgery', 'Urgent Care', 'Emergency'],
    description:
      'Provide emergency coverage, routine surgical support, and patient assessments while helping the clinic maintain continuity of care during short-term staffing gaps.',
    requirements: ['Licensed DVM', 'Surgery experience', 'Strong emergency care skills'],
  },
  {
    id: 2,
    title: 'Surgical Vet Tech',
    clinic: 'Paws & Claws Specialty Center',
    location: 'Hyderabad, India',
    type: 'Contract',
    pay: '₹500 - ₹800 / hour',
    schedule: 'Weekend coverage',
    tags: ['Surgery', 'Monitoring', 'Anesthesia'],
    description:
      'Assist with surgical prep, anesthesia monitoring, and post-op recovery tasks for a busy specialty clinic with fast-paced procedural volume.',
    requirements: ['VTNE or equivalent', 'Surgery prep experience', 'Monitoring expertise'],
  },
  {
    id: 3,
    title: 'Locum DVM',
    clinic: 'Harbor Animal Care',
    location: 'Mumbai, India',
    type: 'Temporary',
    pay: '₹1,200 - ₹2,000 / hour',
    schedule: '2-4 week assignment',
    tags: ['Preventive Care', 'Diagnostics', 'Dentistry'],
    description:
      'Support a high-volume general practice clinic with preventive care, diagnostics, and teeth cleaning services during a temporary staffing need.',
    requirements: ['Valid veterinary license', 'Client communication', 'General practice experience'],
  },
  {
    id: 4,
    title: 'Relief Veterinary Technician',
    clinic: 'Northside Pet Clinic',
    location: 'Jaipur, India',
    type: 'Part Time',
    pay: '₹400 - ₹700 / hour',
    schedule: 'Evenings',
    tags: ['Client Care', 'Lab', 'Imaging'],
    description:
      'Deliver patient check-ins, lab support, and imaging coordination while helping maintain a steady evening care workflow for clients and staff.',
    requirements: ['Veterinary technician license', 'Lab handling', 'Imaging confidence'],
  },
];

const applications = [];
const users = [];

const toList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatINRCompensation = (value) => {
  const amount = String(value || 'Competitive').trim().replace(/\$/g, '₹');
  if (amount.startsWith('₹')) return amount;
  return `₹${amount}`;
};

const sanitizeBusinessDetails = (value = {}) => ({
  businessName: String(value.businessName || '').trim(),
  contactName: String(value.contactName || '').trim(),
  contactEmail: String(value.contactEmail || '').trim().toLowerCase(),
  phone: String(value.phone || '').trim(),
  website: String(value.website || '').trim(),
  address: String(value.address || '').trim(),
  registrationNumber: String(value.registrationNumber || '').trim(),
});

const toPublicUser = (user) => ({
  id: user._id || user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  businessDetails: user.businessDetails || sanitizeBusinessDetails(),
  avatarData: user.avatarData || '',
  phone: user.phone || '',
  location: user.location || '',
  qualifications: user.qualifications || '',
  resumeName: user.resumeName || '',
  resumeData: user.resumeData || '',
});

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
};

const verifyPassword = async (password, passwordHash) => {
  const [salt, storedKey] = String(passwordHash).split(':');
  if (!salt || !storedKey) return false;

  const expectedKey = Buffer.from(storedKey, 'hex');
  if (expectedKey.length !== 64 || expectedKey.toString('hex') !== storedKey) return false;

  const suppliedKey = await scrypt(password, salt, expectedKey.length);
  return timingSafeEqual(expectedKey, suppliedKey);
};

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/', (req, res) => {
  res.json({
    message: 'VetRelief backend is running successfully.',
    status: 'ok',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is healthy.' });
});

app.get('/api/jobs', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const savedJobs = await Job.find().sort({ createdAt: -1 }).lean();
      return res.json({ jobs: savedJobs });
    }

    return res.json({ jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error.message);
    return res.status(500).json({ message: 'Unable to fetch jobs.' });
  }
});

app.get('/api/applications', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const savedApplications = await Application.find()
        .select('name role jobTitle status createdAt')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      return res.json({ applications: savedApplications });
    }

    return res.json({
      applications: applications.slice(0, 50).map(({ name, role, jobTitle, status, createdAt }) => ({
        name, role, jobTitle, status, createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching applications:', error.message);
    return res.status(500).json({ message: 'Unable to fetch applications.' });
  }
});

app.post('/api/jobs', async (req, res) => {
  const { title, clinic, location, type, pay, schedule, tags, description, requirements, businessDetails, recruiterEmail } = req.body;

  if (!title || !clinic) {
    return res.status(400).json({ message: 'Job title and clinic name are required.' });
  }

  const newJob = {
    id: jobs.length ? jobs[0].id + 1 : 1,
    title,
    clinic,
    location: location || 'Remote / Flexible',
    type: type || 'Full Time',
    pay: formatINRCompensation(pay),
    schedule: schedule || 'Flexible schedule',
    tags: toList(tags),
    description: description || 'New veterinary staffing opportunity.',
    requirements: toList(requirements),
    recruiterEmail: String(recruiterEmail || '').trim().toLowerCase(),
    businessDetails: sanitizeBusinessDetails(businessDetails),
  };

  if (mongoose.connection.readyState === 1) {
    try {
      const createdJob = await Job.create({
        title: newJob.title,
        clinic: newJob.clinic,
        location: newJob.location,
        type: newJob.type,
        pay: newJob.pay,
        schedule: newJob.schedule,
        tags: newJob.tags,
        description: newJob.description,
        requirements: newJob.requirements,
        recruiterEmail: newJob.recruiterEmail,
        businessDetails: newJob.businessDetails,
      });

      return res.status(201).json({ message: 'Job posted successfully.', job: createdJob.toObject(), jobs: await Job.find().sort({ createdAt: -1 }).lean() });
    } catch (error) {
      console.error('Error creating job in MongoDB:', error.message);
      return res.status(500).json({ message: 'Unable to save the job.' });
    }
  }

  jobs.unshift(newJob);
  return res.status(201).json({ message: 'Job posted successfully.', job: newJob, jobs });
});

app.delete('/api/jobs/:jobId', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) {
    return res.status(400).json({ message: 'Account email and password are required to delete a job.' });
  }

  try {
    const user = mongoose.connection.readyState === 1
      ? await User.findOne({ email })
      : users.find((item) => item.email.toLowerCase() === email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Account email or password is incorrect.' });
    }

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.isValidObjectId(req.params.jobId)) {
        return res.status(404).json({ message: 'Job post not found for this account.' });
      }
      const result = await Job.deleteOne({ _id: req.params.jobId, recruiterEmail: email });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Job post not found for this account.' });
      }
    } else {
      const index = jobs.findIndex((job) => String(job.id) === req.params.jobId && job.recruiterEmail === email);
      if (index < 0) return res.status(404).json({ message: 'Job post not found for this account.' });
      jobs.splice(index, 1);
    }

    return res.json({ message: 'Job post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting job post:', error.message);
    return res.status(500).json({ message: 'Unable to delete the job post.' });
  }
});

app.post('/api/apply', async (req, res) => {
  const { name, email, phone, location, qualifications, resumeName, resumeData, role, jobTitle, message } = req.body;

  if (!name || !email || !phone || !jobTitle || !resumeName || !resumeData) {
    return res.status(400).json({ message: 'Name, email, phone, job title, and a PDF resume are required.' });
  }

  const resumeMatch = String(resumeData).match(/^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!resumeMatch) return res.status(400).json({ message: 'Resume must be a PDF file.' });
  const resumeBuffer = Buffer.from(resumeMatch[1], 'base64');
  if (resumeBuffer.length > MAX_RESUME_BYTES || !resumeBuffer.toString('utf8', 0, 5).startsWith('%PDF-')) {
    return res.status(400).json({ message: 'Resume must be a valid PDF under 2 MB.' });
  }

  const applicationData = {
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    location: String(location || '').trim(),
    qualifications: String(qualifications || '').trim(),
    resumeName: String(resumeName).split(/[\\/]/).pop().slice(0, 255),
    resumeData: String(resumeData),
    role: role || 'Veterinarian',
    jobTitle: String(jobTitle).trim(),
    message: message || '',
    status: 'New Application',
  };

  if (!applicationData.name || !applicationData.email || !applicationData.phone || !applicationData.jobTitle) {
  return res.status(400).json({ message: 'Name, email, phone, and job title are required.' });
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const application = await Application.create(applicationData);
      const total = await Application.countDocuments();
      return res.status(201).json({
        message: 'Application submitted successfully.',
        application: {
          id: application._id,
          name: application.name,
          role: application.role,
          jobTitle: application.jobTitle,
          status: application.status,
          createdAt: application.createdAt,
        },
        total,
      });
    } catch (error) {
      console.error('Error creating application in MongoDB:', error.message);
      return res.status(500).json({ message: 'Unable to save the application.' });
    }
  }

  const application = {
    id: applications.length ? applications[0].id + 1 : 1,
    ...applicationData,
    createdAt: new Date().toISOString(),
  };
  applications.unshift(application);
  return res.status(201).json({
    message: 'Application submitted successfully.',
    application: {
      id: application.id,
      name: application.name,
      role: application.role,
      jobTitle: application.jobTitle,
      status: application.status,
      createdAt: application.createdAt,
    },
    total: applications.length,
  });
});

app.post('/api/auth/signup', async (req, res) => {
  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ message: 'An account already exists with this email.' });
      }

      const user = await User.create({
        fullName,
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
        role: role || 'Veterinarian',
      });

      return res.status(201).json({
        message: 'Account created successfully.',
        user: toPublicUser(user),
      });
    } catch (error) {
      console.error('Error creating user in MongoDB:', error.message);
      return res.status(500).json({ message: 'Unable to create account.' });
    }
  }

  const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ message: 'An account already exists with this email.' });
  }

  const user = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    fullName,
    email,
    passwordHash: await hashPassword(password),
    role: role || 'Veterinarian',
  };

  users.push(user);

  return res.status(201).json({
    message: 'Account created successfully.',
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findOne({ email: String(email).toLowerCase() });
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      return res.json({
        message: 'Login successful.',
        user: toPublicUser(user),
      });
    } catch (error) {
      console.error('Error logging in user:', error.message);
      return res.status(500).json({ message: 'Unable to log in.' });
    }
  }

  const user = users.find((item) => item.email.toLowerCase() === String(email).toLowerCase());

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  return res.json({ message: 'Login successful.', user: toPublicUser(user) });
});

app.put('/api/profile', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const currentPassword = req.body.currentPassword;
  const fullName = String(req.body.fullName || '').trim();
  const avatarData = String(req.body.avatarData || '');
  const resumeData = String(req.body.resumeData || '');
  const resumeName = String(req.body.resumeName || '').split(/[\\/]/).pop().slice(0, 255);

  if (avatarData) {
    const avatarMatch = avatarData.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!avatarMatch || Buffer.from(avatarMatch[2], 'base64').length > MAX_AVATAR_BYTES) {
      return res.status(400).json({ message: 'Profile photo must be a PNG, JPEG, or WebP image under 1 MB.' });
    }
  }

  if (resumeData) {
    const resumeMatch = resumeData.match(/^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!resumeMatch) return res.status(400).json({ message: 'Resume must be a PDF file.' });
    const resumeBuffer = Buffer.from(resumeMatch[1], 'base64');
    if (resumeBuffer.length > MAX_RESUME_BYTES || !resumeBuffer.toString('utf8', 0, 5).startsWith('%PDF-') || !resumeName) {
      return res.status(400).json({ message: 'Resume must be a valid PDF under 2 MB.' });
    }
  }

  if (!email || !currentPassword || !fullName) {
    return res.status(400).json({ message: 'Email, current password, and username are required.' });
  }

  try {
    const user = mongoose.connection.readyState === 1
      ? await User.findOne({ email })
      : users.find((item) => item.email.toLowerCase() === email);

    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.fullName = fullName;
    user.businessDetails = sanitizeBusinessDetails(req.body.businessDetails);
    user.avatarData = avatarData;
    user.phone = String(req.body.phone || '').trim();
    user.location = String(req.body.location || '').trim();
    user.qualifications = String(req.body.qualifications || '').trim();
    user.resumeName = resumeData ? resumeName : '';
    user.resumeData = resumeData;
    if (mongoose.connection.readyState === 1) await user.save();

    return res.json({ message: 'Profile updated successfully.', user: toPublicUser(user) });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    return res.status(500).json({ message: 'Unable to update profile.' });
  }
});

app.delete('/api/profile', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const currentPassword = req.body.currentPassword;

  if (!email || !currentPassword) {
    return res.status(400).json({ message: 'Email and current password are required.' });
  }

  try {
    const user = mongoose.connection.readyState === 1
      ? await User.findOne({ email })
      : users.find((item) => item.email.toLowerCase() === email);

    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    if (mongoose.connection.readyState === 1) {
      await Promise.all([
        User.deleteOne({ _id: user._id }),
        Application.deleteMany({ email }),
        Job.deleteMany({ recruiterEmail: email }),
      ]);
    } else {
      users.splice(users.indexOf(user), 1);
      for (let index = applications.length - 1; index >= 0; index -= 1) {
        if (applications[index].email.toLowerCase() === email) applications.splice(index, 1);
      }
      for (let index = jobs.length - 1; index >= 0; index -= 1) {
        if (jobs[index].recruiterEmail === email) jobs.splice(index, 1);
      }
    }

    return res.json({ message: 'Account and associated records were deleted.' });
  } catch (error) {
    console.error('Error deleting account:', error.message);
    return res.status(500).json({ message: 'Unable to delete account.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'Email address is required.' });

  const resetToken = randomBytes(32).toString('hex');
  const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
  const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  try {
    const user = mongoose.connection.readyState === 1
      ? await User.findOne({ email })
      : users.find((item) => item.email.toLowerCase() === email);

    if (user) {
      user.resetTokenHash = resetTokenHash;
      user.resetTokenExpiresAt = resetTokenExpiresAt;
      if (mongoose.connection.readyState === 1) await user.save();
    }

    const response = { message: 'If that account exists, reset instructions are ready.' };
    if (user && process.env.NODE_ENV !== 'production') response.resetToken = resetToken;
    return res.json(response);
  } catch (error) {
    console.error('Error requesting password reset:', error.message);
    return res.status(500).json({ message: 'Unable to request a password reset.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const resetToken = String(req.body.resetToken || '');
  const newPassword = String(req.body.newPassword || '');

  if (!email || !resetToken || newPassword.length < 8) {
    return res.status(400).json({ message: 'Email, reset code, and a password of at least 8 characters are required.' });
  }

  try {
    const user = mongoose.connection.readyState === 1
      ? await User.findOne({ email })
      : users.find((item) => item.email.toLowerCase() === email);
    const suppliedHash = createHash('sha256').update(resetToken).digest();
    const storedHash = user?.resetTokenHash ? Buffer.from(user.resetTokenHash, 'hex') : Buffer.alloc(0);
    const tokenMatches = storedHash.length === suppliedHash.length && timingSafeEqual(storedHash, suppliedHash);

    if (!user || !tokenMatches || !user.resetTokenExpiresAt || user.resetTokenExpiresAt <= new Date()) {
      return res.status(400).json({ message: 'Reset code is invalid or expired.' });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetTokenHash = '';
    user.resetTokenExpiresAt = null;
    if (mongoose.connection.readyState === 1) await user.save();

    return res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Error resetting password:', error.message);
    return res.status(500).json({ message: 'Unable to reset password.' });
  }
});

const seedDemoJobs = async () => {
  try {
    const count = await Job.countDocuments();
    const legacyCompensationJobs = await Job.find({
      $or: [{ pay: /\$/ }, { pay: { $not: /^\s*₹/ } }],
    });
    for (const job of legacyCompensationJobs) {
      job.pay = formatINRCompensation(job.pay);
      await job.save();
    }
    if (count > 0) return;

    await Job.insertMany(
      jobs.map((job) => ({
        title: job.title,
        clinic: job.clinic,
        location: job.location,
        type: job.type,
        pay: job.pay,
        schedule: job.schedule,
        tags: job.tags,
        description: job.description,
        requirements: job.requirements,
      })),
    );

    console.log('Seeded demo jobs into MongoDB.');
  } catch (error) {
    console.error('Seed failed:', error.message);
  }
};

const startServer = async () => {
  try {
    if (process.env.MONGO_URI || true) {
      try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
        console.log('MongoDB connected');
        await seedDemoJobs();
      } catch (dbError) {
        console.warn('MongoDB not available. Running without database connection.');
        console.warn(dbError.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server error:', error.message);
    process.exit(1);
  }
};

startServer();
