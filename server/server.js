const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { createHash, createHmac, randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('crypto');
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
const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || process.env.MONGO_URI || randomBytes(32).toString('hex');
const AUTH_TOKEN_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
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

const createAuthToken = (user) => {
  const payload = Buffer.from(JSON.stringify({
    sub: String(user._id || user.id),
    exp: Math.floor(Date.now() / 1000) + AUTH_TOKEN_LIFETIME_SECONDS,
  })).toString('base64url');
  const signature = createHmac('sha256', AUTH_TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const authenticateUser = async (req, res, next) => {
  const authorization = String(req.headers.authorization || '');
  const match = authorization.match(/^Bearer\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);
  if (!match) return res.status(401).json({ message: 'Please sign in to continue.' });

  try {
    const [payload, suppliedSignature] = match[1].split('.');
    const expectedSignature = createHmac('sha256', AUTH_TOKEN_SECRET).update(payload).digest();
    const actualSignature = Buffer.from(suppliedSignature, 'base64url');
    if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) {
      return res.status(401).json({ message: 'Your sign-in has expired. Please sign in again.' });
    }

    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!claims.sub || !Number.isFinite(claims.exp) || claims.exp <= Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: 'Your sign-in has expired. Please sign in again.' });
    }

    let user;
    if (mongoose.connection.readyState === 1) {
      if (!mongoose.isValidObjectId(claims.sub)) {
        return res.status(401).json({ message: 'Please sign in to continue.' });
      }
      user = await User.findById(claims.sub);
    } else {
      user = users.find((item) => String(item.id) === String(claims.sub));
    }

    if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }
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

app.post('/api/jobs', authenticateUser, async (req, res) => {
  const { title, clinic, location, type, pay, schedule, tags, description, requirements, businessDetails } = req.body;

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
    recruiterEmail: String(req.user.email || '').trim().toLowerCase(),
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

app.delete('/api/jobs/:jobId', authenticateUser, async (req, res) => {
  const email = String(req.user.email || '').trim().toLowerCase();
  try {
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


  app.patch('/api/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'Applied',
      'Under Review',
      'Shortlisted',
      'Interview',
      'Selected',
      'Rejected'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid application status.'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database is not connected.'
      });
    }

    const application = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        message: 'Application not found.'
      });
    }

    res.json({
      message: 'Application status updated successfully.',
      application: {
        id: application._id,
        name: application.name,
        role: application.role,
        jobTitle: application.jobTitle,
        status: application.status,
        createdAt: application.createdAt
      }
    });

  } catch (error) {
    console.error('Error updating application status:', error.message);

    res.status(500).json({
      message: 'Unable to update application status.'
    });
  }
});


app.post('/api/apply', async (req, res) => {
  const {
    name,
    email,
    phone,
    location,
    qualifications,
    resumeName,
    resumeData,
    role,
    jobTitle,
    message
  } = req.body;

  if (!name || !email || !phone || !jobTitle || !resumeName || !resumeData) {
    return res.status(400).json({
      message: 'Name, email, phone, job title, and a PDF resume are required.'
    });
  }

  const resumeMatch = String(resumeData).match(
    /^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/
  );

  if (!resumeMatch) {
    return res.status(400).json({
      message: 'Resume must be a PDF file.'
    });
  }

  const resumeBuffer = Buffer.from(resumeMatch[1], 'base64');

  if (
    resumeBuffer.length > MAX_RESUME_BYTES ||
    !resumeBuffer.toString('utf8', 0, 5).startsWith('%PDF-')
  ) {
    return res.status(400).json({
      message: 'Resume must be a valid PDF under 2 MB.'
    });
  }

  const applicationData = {
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    location: String(location || '').trim(),
    qualifications: String(qualifications || '').trim(),
    resumeName: String(resumeName)
      .split(/[\\/]/)
      .pop()
      .slice(0, 255),
    resumeData: String(resumeData),
    role: role || 'Veterinarian',
    jobTitle: String(jobTitle).trim(),
    message: message || '',

    // Application Tracker
    status: 'Applied',
  };

  if (
    !applicationData.name ||
    !applicationData.email ||
    !applicationData.phone ||
    !applicationData.jobTitle
  ) {
    return res.status(400).json({
      message: 'Name, email, phone, and job title are required.'
    });
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
      console.error(
        'Error creating application in MongoDB:',
        error.message
      );

      return res.status(500).json({
        message: 'Unable to save the application.'
      });
    }
  }

  // Fallback when MongoDB is not connected
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
  try {
    const {
      fullName,
      email,
      password,
      role,
      businessDetails,
    } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        message: 'Full name, email, password, and role are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = mongoose.connection.readyState === 1
      ? await User.findOne({ email: normalizedEmail })
      : users.find((item) => item.email.toLowerCase() === normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await hashPassword(password);

    const userData = {
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      businessDetails: sanitizeBusinessDetails(businessDetails),
    };

    if (mongoose.connection.readyState === 1) {
      const user = await User.create(userData);

      return res.status(201).json({
        message: 'Account created successfully.',
        user: toPublicUser(user),
        token: createAuthToken(user),
      });
    }

    const user = {
      id: randomBytes(12).toString('hex'),
      ...userData,
    };

    users.push(user);

    return res.status(201).json({
      message: 'Account created successfully.',
      user: toPublicUser(user),
      token: createAuthToken(user),
    });
  } catch (error) {
    console.error('Error creating account:', error.message);

    return res.status(500).json({
      message: 'Unable to create the account.',
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = mongoose.connection.readyState === 1
      ? await User.findOne({ email })
      : users.find((item) => item.email.toLowerCase() === email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.json({
      message: 'Login successful.',
      user: toPublicUser(user),
      token: createAuthToken(user),
    });
  } catch (error) {
    console.error('Error logging in user:', error.message);
    return res.status(500).json({ message: 'Unable to log in.' });
  }
});
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully.');

    app.listen(PORT, () => {
      console.log(`VetRelief backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);

    app.listen(PORT, () => {
      console.log(`VetRelief backend running on port ${PORT} without MongoDB`);
    });
  }
};
startServer();
