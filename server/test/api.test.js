const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');
const path = require('node:path');
const { test } = require('node:test');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getUnusedPort = async () => {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const { port } = listener.address();
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return port;
};

const jsonRequest = async (url, { token, ...options } = {}) => {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  return { response, data };
};

test('API recruitment and career flows enforce ownership and security controls', async (t) => {
  const port = await getUnusedPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      AUTH_TOKEN_SECRET: 'phase1-api-test-secret-that-is-long-enough',
      MONGO_URI: 'mongodb://127.0.0.1:27019/vetrelief_test?serverSelectionTimeoutMS=400',
      MONGO_SERVER_SELECTION_TIMEOUT_MS: '400',
      FRONTEND_ORIGINS: 'http://localhost:5173',
      OPENAI_API_KEY: '',
      OPENAI_MODEL: 'gpt-6-astra',
      CRON_SECRET: 'phase2-cron-test-secret-123456',
      TEST_ADMIN_EMAIL: 'admin@example.test',
      TEST_ADMIN_PASSWORD: 'admin-password-12345',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  t.after(() => child.kill());

  let healthy = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`API server exited during startup:\n${output}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) { healthy = true; break; }
    } catch {}
    await wait(100);
  }
  assert.equal(healthy, true, `API server did not become ready:\n${output}`);

  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(health.headers.get('x-powered-by'), null);
  assert.equal((await jsonRequest(`${baseUrl}/not-a-route`)).response.status, 404);
  const malformedJson = await jsonRequest(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid',
  });
  assert.equal(malformedJson.response.status, 400);
  assert.equal(malformedJson.data.message, 'Request body must contain valid JSON.');

  const unauthenticated = await jsonRequest(`${baseUrl}/api/applications`);
  assert.equal(unauthenticated.response.status, 401);

  const rejectedRole = await jsonRequest(`${baseUrl}/api/auth/signup`, {
    method: 'POST', body: JSON.stringify({ fullName: 'Bad Role', email: 'bad-role@example.test', password: 'password1', role: 'admin' }),
  });
  assert.equal(rejectedRole.response.status, 400);

  const ownerSignup = await jsonRequest(`${baseUrl}/api/auth/signup`, {
    method: 'POST', body: JSON.stringify({ fullName: 'Clinic Owner', email: 'owner@example.test', password: 'password1', role: 'Clinic Owner' }),
  });
  assert.equal(ownerSignup.response.status, 201);
  const ownerToken = ownerSignup.data.token;
  const adminLogin = await jsonRequest(`${baseUrl}/api/auth/login`, { method: 'POST', body: JSON.stringify({ email: 'admin@example.test', password: 'admin-password-12345' }) });
  assert.equal(adminLogin.response.status, 200);
  const adminToken = adminLogin.data.token;
  assert.equal((await jsonRequest(`${baseUrl}/api/admin/overview`, { token: ownerToken })).response.status, 403);
  assert.equal((await jsonRequest(`${baseUrl}/api/admin/overview`, { token: adminToken })).response.status, 200);

  const candidateJobPost = await jsonRequest(`${baseUrl}/api/jobs`, {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ title: 'Emergency Veterinarian', clinic: 'North Clinic', location: 'Bengaluru', type: 'Full Time', experienceLevel: '3-5 years', workMode: 'Hybrid', salaryMin: 900000, salaryMax: 1200000, currency: 'INR', payFrequency: 'year', benefits: 'Health cover, Paid leave', tags: 'Emergency, Surgery', businessDetails: { businessName: 'North Clinic', description: 'Small animal emergency clinic', specializations: 'Emergency, Surgery', contactEmail: 'contact@north.example' } }),
  });
  assert.equal(candidateJobPost.response.status, 201);
  const job = candidateJobPost.data.job;
  const adminJobs = await jsonRequest(`${baseUrl}/api/admin/jobs?search=Emergency`, { token: adminToken });
  assert.equal(adminJobs.data.jobs.length, 1);
  assert.equal((await jsonRequest(`${baseUrl}/api/admin/jobs`, { token: ownerToken })).response.status, 403);
  const hideJob = await jsonRequest(`${baseUrl}/api/admin/jobs/${job.id}/moderate`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ status: 'Hidden', moderationNote: 'Listing requires compliance review.' }) });
  assert.equal(hideJob.response.status, 200);
  assert.equal((await jsonRequest(`${baseUrl}/api/jobs?keyword=Emergency`)).data.total, 0);
  const republishJob = await jsonRequest(`${baseUrl}/api/admin/jobs/${job.id}/moderate`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ status: 'Published' }) });
  assert.equal(republishJob.data.job.status, 'Published');

  const internshipPost = await jsonRequest(`${baseUrl}/api/jobs`, {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ title: 'Small Animal Clinical Intern', clinic: 'North Clinic', location: 'Bengaluru', type: 'Internship', opportunityType: 'Internship', duration: '8 weeks', eligibility: 'Current veterinary students', learningObjectives: 'Clinical examination and client communication', mentorshipDetails: 'Weekly supervision with a senior clinician', startDate: new Date(Date.now() + 86400000).toISOString(), endDate: new Date(Date.now() + 30 * 86400000).toISOString(), applicationDeadline: new Date(Date.now() + 7 * 86400000).toISOString(), stipend: '₹10,000/month', latitude: 12.9716, longitude: 77.5946 }),
  });
  assert.equal(internshipPost.response.status, 201);
  const internshipSearch = await jsonRequest(`${baseUrl}/api/jobs?opportunityType=Internship`);
  assert.equal(internshipSearch.data.total, 1);
  assert.equal(internshipSearch.data.jobs[0].duration, '8 weeks');
  assert.equal(internshipSearch.data.jobs[0].latitude, 12.9716);
  const externshipPost = await jsonRequest(`${baseUrl}/api/jobs`, {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ title: 'Shelter Medicine Externship', clinic: 'North Clinic', location: 'Mysuru', type: 'Externship', opportunityType: 'Externship', duration: '2 weeks', eligibility: 'Veterinary students', applicationInstructions: 'Send a short statement of interest' }),
  });
  assert.equal(externshipPost.response.status, 201);
  assert.equal((await jsonRequest(`${baseUrl}/api/jobs?opportunityType=Externship`)).data.jobs[0].title, 'Shelter Medicine Externship');
  const reliefPost = await jsonRequest(`${baseUrl}/api/jobs`, {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ title: 'Weekend Relief Technician', clinic: 'North Clinic', location: 'Bengaluru', type: 'Part Time', opportunityType: 'Relief', duration: 'Weekend cover', shiftDetails: 'Saturday and Sunday, 8 hour shifts' }),
  });
  assert.equal(reliefPost.response.status, 201);
  assert.equal((await jsonRequest(`${baseUrl}/api/jobs?opportunityType=Relief`)).data.jobs[0].shiftDetails, 'Saturday and Sunday, 8 hour shifts');
  const verifiedOnly = await jsonRequest(`${baseUrl}/api/jobs?verifiedOnly=true`);
  assert.equal(verifiedOnly.data.total, 0);

  const filteredJobs = await jsonRequest(`${baseUrl}/api/jobs?keyword=Emergency&location=Bengaluru&specialization=Emergency&currency=INR&sort=relevance&minSalary=800000&experienceLevel=3-5%20years&workMode=Hybrid&page=1&limit=1`);
  assert.equal(filteredJobs.response.status, 200);
  assert.equal(filteredJobs.data.total, 1);
  assert.equal(filteredJobs.data.jobs[0].title, 'Emergency Veterinarian');
  assert.equal((await jsonRequest(`${baseUrl}/api/jobs?currency=not-a-currency`)).response.status, 400);
  assert.equal(Object.hasOwn(filteredJobs.data.jobs[0], 'recruiterEmail'), false);
  assert.equal(Object.hasOwn(filteredJobs.data.jobs[0].businessDetails, 'registrationNumber'), false);
  const clinics = await jsonRequest(`${baseUrl}/api/clinics`);
  assert.equal(clinics.data.clinics[0].businessName, 'North Clinic');

  const otherOwnerSignup = await jsonRequest(`${baseUrl}/api/auth/signup`, {
    method: 'POST', body: JSON.stringify({ fullName: 'Other Owner', email: 'other@example.test', password: 'password1', role: 'Clinic Owner' }),
  });
  const otherOwnerToken = otherOwnerSignup.data.token;
  const unauthorizedEdit = await jsonRequest(`${baseUrl}/api/jobs/${job.id}`, {
    method: 'PUT', token: otherOwnerToken, body: JSON.stringify({ title: 'Stolen listing', clinic: 'Other Clinic' }),
  });
  assert.equal(unauthorizedEdit.response.status, 404);
  const ownerEdit = await jsonRequest(`${baseUrl}/api/jobs/${job.id}`, {
    method: 'PUT', token: ownerToken, body: JSON.stringify({ ...job, title: job.title, clinic: job.clinic, salaryMin: 950000 }),
  });
  assert.equal(ownerEdit.response.status, 200);
  assert.equal(ownerEdit.data.job.salaryMin, 950000);

  const candidateSignup = await jsonRequest(`${baseUrl}/api/auth/signup`, {
    method: 'POST', body: JSON.stringify({ fullName: 'Candidate', email: 'candidate@example.test', password: 'password1', role: 'Veterinarian' }),
  });
  const candidateToken = candidateSignup.data.token;
  assert.equal((await jsonRequest(`${baseUrl}/api/auth/forgot-password`, { method: 'POST', body: JSON.stringify({ email: 'candidate@example.test' }) })).response.status, 503);
  assert.equal((await jsonRequest(`${baseUrl}/api/auth/reset-password`, { method: 'POST', body: JSON.stringify({ email: 'candidate@example.test', resetToken: 'invalid-code', newPassword: 'new-password-123' }) })).response.status, 400);
  assert.equal((await jsonRequest(`${baseUrl}/api/ai/status`, { token: candidateToken })).data.configured, false);
  assert.equal((await jsonRequest(`${baseUrl}/api/ai/job-matches`, { method: 'POST', token: candidateToken, body: JSON.stringify({ consent: false }) })).response.status, 400);
  assert.equal((await jsonRequest(`${baseUrl}/api/ai/job-matches`, { method: 'POST', token: candidateToken, body: JSON.stringify({ consent: true }) })).response.status, 503);
  assert.equal((await jsonRequest(`${baseUrl}/api/ai/resume-suggestions`, { method: 'POST', token: candidateToken, body: JSON.stringify({ consent: true, resume: { summary: 'Candidate provided summary' } }) })).response.status, 503);
  assert.equal((await jsonRequest(`${baseUrl}/api/ai/interview-feedback`, { method: 'POST', token: candidateToken, body: JSON.stringify({ consent: true, questionId: 'behavioral-team', answer: 'I communicate clearly with my team.' }) })).response.status, 503);
  const unauthorizedPost = await jsonRequest(`${baseUrl}/api/jobs`, { method: 'POST', token: candidateToken, body: JSON.stringify({ title: 'X', clinic: 'Y' }) });
  assert.equal(unauthorizedPost.response.status, 403);

  const profileUpdate = await jsonRequest(`${baseUrl}/api/profile`, {
    method: 'PUT', token: candidateToken,
    body: JSON.stringify({ currentPassword: 'password1', fullName: 'Candidate Vet', phone: '555-0100', location: 'Bengaluru', qualifications: 'Small animal practice', professionalSummary: 'Compassionate veterinarian', specializations: 'Surgery, Emergency', experienceYears: 4, skills: 'Surgery, Diagnostics', employmentHistory: 'Associate veterinarian\nRelief veterinarian', preferredLocations: 'Bengaluru, Mysuru', preferredEmploymentTypes: 'Locum, Contract', profileVisibility: 'employers' }),
  });
  assert.equal(profileUpdate.response.status, 200);
  assert.equal(profileUpdate.data.user.fullName, 'Candidate Vet');
  assert.deepEqual(profileUpdate.data.user.specializations, ['Surgery', 'Emergency']);
  assert.deepEqual(profileUpdate.data.user.preferredEmploymentTypes, ['Locum', 'Contract']);

  const recommendations = await jsonRequest(`${baseUrl}/api/recommendations`, { token: candidateToken });
  assert.equal(recommendations.response.status, 200);
  assert.equal(recommendations.data.mode, 'profile-based');
  assert.ok(recommendations.data.recommendations.some((item) => item.matchScore !== null && item.reasons.length > 0));
  const invalidEmploymentPreference = await jsonRequest(`${baseUrl}/api/profile`, {
    method: 'PUT', token: candidateToken,
    body: JSON.stringify({ currentPassword: 'password1', fullName: 'Must Not Persist', preferredEmploymentTypes: ['Unsupported'] }),
  });
  assert.equal(invalidEmploymentPreference.response.status, 400);
  assert.equal((await jsonRequest(`${baseUrl}/api/profile`, { token: candidateToken })).data.user.fullName, 'Candidate Vet');

  const resumeBuilder = await jsonRequest(`${baseUrl}/api/resume-builder`, {
    method: 'PUT', token: candidateToken,
    body: JSON.stringify({ template: 'modern', summary: 'Veterinary professional focused on small animal care.', education: [{ institution: 'State Veterinary College', qualification: 'DVM', startYear: '2020', endYear: '2025' }], experience: [{ title: 'Clinical rotation', employer: 'Teaching Hospital', details: 'Supported supervised patient care.' }], skills: 'Client communication, Diagnostics', certifications: 'CPR' }),
  });
  assert.equal(resumeBuilder.response.status, 200);
  assert.equal(resumeBuilder.data.resume.education[0].institution, 'State Veterinary College');
  assert.equal((await jsonRequest(`${baseUrl}/api/resume-builder`, { token: otherOwnerToken })).response.status, 403);

  const practiceQuestions = await jsonRequest(`${baseUrl}/api/interview-prep/questions`, { token: candidateToken });
  assert.equal(practiceQuestions.data.providerConfigured, false);
  assert.ok(practiceQuestions.data.questions.length > 0);
  const practiceProgress = await jsonRequest(`${baseUrl}/api/interview-prep/progress`, {
    method: 'PUT', token: candidateToken,
    body: JSON.stringify({ specialization: 'Emergency medicine', answers: [{ questionId: practiceQuestions.data.questions[0].id, answer: 'I would use the clinic protocol and communicate with my team.', selfRating: 4 }] }),
  });
  assert.equal(practiceProgress.data.progress.answers[0].selfRating, 4);

  const careerGoal = await jsonRequest(`${baseUrl}/api/career-goals`, {
    method: 'POST', token: candidateToken,
    body: JSON.stringify({ title: 'Build emergency-care skills', targetDate: new Date(Date.now() + 86400000 * 90).toISOString(), milestones: ['Find a course', 'Complete supervised practice'] }),
  });
  assert.equal(careerGoal.response.status, 201);
  const goalUpdate = await jsonRequest(`${baseUrl}/api/career-goals/${careerGoal.data.goal.id}`, {
    method: 'PATCH', token: candidateToken, body: JSON.stringify({ milestoneIndex: 0, completed: true }),
  });
  assert.equal(goalUpdate.data.goal.milestones[0].completed, true);
  assert.equal((await jsonRequest(`${baseUrl}/api/career-goals/${careerGoal.data.goal.id}`, { method: 'DELETE', token: otherOwnerToken })).response.status, 403);
  assert.equal((await jsonRequest(`${baseUrl}/api/career-goals`, { token: candidateToken })).data.goals.length, 1);

  assert.equal((await jsonRequest(`${baseUrl}/api/learning-resources`, { token: candidateToken })).response.status, 200);
  assert.equal((await jsonRequest(`${baseUrl}/api/learning-resources`, { method: 'POST', token: candidateToken, body: JSON.stringify({ title: 'Untrusted', category: 'Career', summary: 'No access', url: 'https://example.test' }) })).response.status, 403);
  assert.equal((await jsonRequest(`${baseUrl}/api/admin/learning-resources`, { token: ownerToken })).response.status, 403);
  const resource = await jsonRequest(`${baseUrl}/api/learning-resources`, { method: 'POST', token: adminToken, body: JSON.stringify({ title: 'Interview preparation guide', category: 'Career', summary: 'A short guide to preparing for a veterinary interview.', url: 'https://example.org/career-guide', tags: ['interview', 'career'] }) });
  assert.equal(resource.response.status, 201);
  assert.equal((await jsonRequest(`${baseUrl}/api/learning-resources?search=interview`, { token: candidateToken })).data.resources.length, 1);
  assert.equal((await jsonRequest(`${baseUrl}/api/saved-resources/${resource.data.resource.id}`, { method: 'POST', token: candidateToken })).response.status, 201);
  const hiddenResource = await jsonRequest(`${baseUrl}/api/learning-resources/${resource.data.resource.id}`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ published: false, summary: 'Updated, reviewed career preparation guidance.' }) });
  assert.equal(hiddenResource.data.resource.published, false);
  assert.equal((await jsonRequest(`${baseUrl}/api/learning-resources`, { token: candidateToken })).data.resources.length, 0);
  await jsonRequest(`${baseUrl}/api/learning-resources/${resource.data.resource.id}`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ published: true }) });
  assert.equal((await jsonRequest(`${baseUrl}/api/saved-resources`, { token: candidateToken })).data.resources.length, 1);

  const mentorProfile = await jsonRequest(`${baseUrl}/api/mentors/me`, {
    method: 'PUT', token: candidateToken,
    body: JSON.stringify({ isMentor: true, topics: ['Career planning', 'Emergency medicine'], availability: 'Two evenings per month', methods: ['Video call', 'Messaging'] }),
  });
  assert.equal(mentorProfile.response.status, 200);
  const mentorDirectory = await jsonRequest(`${baseUrl}/api/mentors?topic=Emergency`);
  assert.equal(mentorDirectory.data.mentors.length, 1);

  const studentSignup = await jsonRequest(`${baseUrl}/api/auth/signup`, {
    method: 'POST', body: JSON.stringify({ fullName: 'Vet Student', email: 'student@example.test', password: 'password1', role: 'Veterinary Student' }),
  });
  assert.equal(studentSignup.response.status, 201);
  const studentResume = await jsonRequest(`${baseUrl}/api/resume-builder`, { token: studentSignup.data.token });
  assert.equal(studentResume.data.resume.summary, '');
  assert.equal((await jsonRequest(`${baseUrl}/api/career-goals/${careerGoal.data.goal.id}`, { method: 'DELETE', token: studentSignup.data.token })).response.status, 404);
  const studentQuestions = await jsonRequest(`${baseUrl}/api/interview-prep/questions?specialization=Surgery`, { token: studentSignup.data.token });
  assert.ok(studentQuestions.data.questions.some((question) => question.id === 'student-supervision'));
  assert.ok(studentQuestions.data.questions.some((question) => question.id === 'specialty-surgery'));
  const mentorshipRequest = await jsonRequest(`${baseUrl}/api/mentorship-requests`, {
    method: 'POST', token: studentSignup.data.token,
    body: JSON.stringify({ mentorId: mentorProfile.data.mentor.id, topic: 'Career planning', goal: 'I would like help planning my first clinical rotations.' }),
  });
  assert.equal(mentorshipRequest.response.status, 201);
  const unauthorizedMentorResponse = await jsonRequest(`${baseUrl}/api/mentorship-requests/${mentorshipRequest.data.request.id}`, {
    method: 'PATCH', token: otherOwnerToken, body: JSON.stringify({ status: 'Accepted' }),
  });
  assert.equal(unauthorizedMentorResponse.response.status, 404);
  const mentorResponse = await jsonRequest(`${baseUrl}/api/mentorship-requests/${mentorshipRequest.data.request.id}`, {
    method: 'PATCH', token: candidateToken, body: JSON.stringify({ status: 'Accepted' }),
  });
  assert.equal(mentorResponse.data.request.status, 'Accepted');

  const saveJob = await jsonRequest(`${baseUrl}/api/saved-jobs/${job.id}`, { method: 'POST', token: candidateToken });
  assert.equal(saveJob.response.status, 201);
  await jsonRequest(`${baseUrl}/api/saved-jobs/${job.id}`, { method: 'POST', token: candidateToken });
  const savedList = await jsonRequest(`${baseUrl}/api/saved-jobs`, { token: candidateToken });
  assert.equal(savedList.data.savedJobs.length, 1);

  const pdf = Buffer.from('%PDF-1.4 test document').toString('base64');
  const application = await jsonRequest(`${baseUrl}/api/apply`, {
    method: 'POST', token: candidateToken,
    body: JSON.stringify({ name: 'Tampered Name', email: 'someone-else@example.test', phone: '555-0100', jobId: job.id, jobTitle: job.title, resumeName: 'candidate.pdf', resumeData: `data:application/pdf;base64,${pdf}` }),
  });
  assert.equal(application.response.status, 201);
  assert.equal(application.data.application.name, 'Candidate Vet');
  const recommendationsAfterApply = await jsonRequest(`${baseUrl}/api/recommendations`, { token: candidateToken });
  assert.equal(recommendationsAfterApply.data.recommendations.some((item) => String(item.job.id || item.job._id) === String(job.id || job._id)), false);

  const ownApplications = await jsonRequest(`${baseUrl}/api/applications`, { token: candidateToken });
  assert.equal(ownApplications.data.applications.length, 1);
  assert.equal(ownApplications.data.applications[0].status, 'Applied');
  const ownResume = await jsonRequest(`${baseUrl}/api/applications/${application.data.application.id}/resume`, { token: candidateToken });
  assert.equal(ownResume.response.status, 200);
  const privateResume = await jsonRequest(`${baseUrl}/api/applications/${application.data.application.id}/resume`, { token: otherOwnerToken });
  assert.equal(privateResume.response.status, 404);

  const employerApplications = await jsonRequest(`${baseUrl}/api/applications`, { token: ownerToken });
  assert.equal(employerApplications.data.applications.length, 1);
  assert.equal(Object.hasOwn(employerApplications.data.applications[0], 'resumeData'), false);
  assert.deepEqual(employerApplications.data.applications[0].candidateProfile.specializations, ['Surgery', 'Emergency']);
  const statusUpdate = await jsonRequest(`${baseUrl}/api/applications/${application.data.application.id}/status`, {
    method: 'PATCH', token: ownerToken, body: JSON.stringify({ status: 'Under Review' }),
  });
  assert.equal(statusUpdate.response.status, 200);
  const tracked = await jsonRequest(`${baseUrl}/api/applications`, { token: candidateToken });
  assert.equal(tracked.data.applications[0].status, 'Under Review');
  assert.equal(tracked.data.applications[0].statusHistory.length, 2);

  const otherOwnerStatus = await jsonRequest(`${baseUrl}/api/applications/${application.data.application.id}/status`, {
    method: 'PATCH', token: otherOwnerToken, body: JSON.stringify({ status: 'Selected' }),
  });
  assert.equal(otherOwnerStatus.response.status, 404);

  const alert = await jsonRequest(`${baseUrl}/api/job-alerts`, {
    method: 'POST', token: candidateToken,
    body: JSON.stringify({ keywords: 'emergency', location: 'Bengaluru' }),
  });
  assert.equal(alert.response.status, 201);
  assert.equal((await jsonRequest(`${baseUrl}/api/job-alerts`, { token: candidateToken })).data.alerts.length, 1);
  const dailyAlert = await jsonRequest(`${baseUrl}/api/job-alerts`, { method: 'POST', token: candidateToken, body: JSON.stringify({ keywords: 'Night', location: 'Bengaluru', currency: 'INR', frequency: 'Daily' }) });
  assert.equal(dailyAlert.response.status, 201);
  assert.equal((await jsonRequest(`${baseUrl}/api/job-alerts`, { method: 'POST', token: candidateToken, body: JSON.stringify({ keywords: 'Night', location: 'Bengaluru', currency: 'INR', frequency: 'Daily' }) })).response.status, 409);
  const pausedAlert = await jsonRequest(`${baseUrl}/api/job-alerts/${dailyAlert.data.alert.id}`, { method: 'PATCH', token: candidateToken, body: JSON.stringify({ active: false }) });
  assert.equal(pausedAlert.data.alert.active, false);
  await jsonRequest(`${baseUrl}/api/job-alerts/${dailyAlert.data.alert.id}`, { method: 'PATCH', token: candidateToken, body: JSON.stringify({ active: true }) });
  assert.equal((await jsonRequest(`${baseUrl}/api/job-alerts`, { token: ownerToken })).response.status, 403);
  const matchingJob = await jsonRequest(`${baseUrl}/api/jobs`, {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ title: 'Emergency Night Veterinarian', clinic: 'North Clinic', location: 'Bengaluru', type: 'Temporary', opportunityType: 'Locum', duration: '4 weeks', startDate: new Date(Date.now() + 86400000).toISOString(), endDate: new Date(Date.now() + 30 * 86400000).toISOString(), shiftDetails: 'Overnight rotation', tags: 'Emergency', description: 'Emergency coverage' }),
  });
  assert.equal(matchingJob.response.status, 201);
  const locumSearch = await jsonRequest(`${baseUrl}/api/jobs?opportunityType=Locum`);
  assert.equal(locumSearch.data.jobs[0].duration, '4 weeks');
  const alertNotifications = await jsonRequest(`${baseUrl}/api/notifications`, { token: candidateToken });
  assert.ok(alertNotifications.data.notifications.some((item) => item.type === 'job_alert'));
  const digest = await jsonRequest(`${baseUrl}/api/cron/job-alert-digests`, { headers: { Authorization: 'Bearer phase2-cron-test-secret-123456' } });
  assert.equal(digest.response.status, 200);
  assert.equal(digest.data.sent, 1);
  const afterDigest = await jsonRequest(`${baseUrl}/api/notifications`, { token: candidateToken });
  assert.ok(afterDigest.data.notifications.some((item) => item.type === 'job_alert_digest'));
  assert.equal((await jsonRequest(`${baseUrl}/api/cron/job-alert-digests`)).response.status, 401);

  const conversation = await jsonRequest(`${baseUrl}/api/conversations`, {
    method: 'POST', token: candidateToken,
    body: JSON.stringify({ applicationId: application.data.application.id, message: 'Hello, I would like to discuss the role.' }),
  });
  assert.equal(conversation.response.status, 201);
  const ownerConversations = await jsonRequest(`${baseUrl}/api/conversations`, { token: ownerToken });
  assert.equal(ownerConversations.data.conversations.length, 1);
  assert.equal(ownerConversations.data.conversations[0].unreadCount, 1);
  const conversationMessages = await jsonRequest(`${baseUrl}/api/conversations/${ownerConversations.data.conversations[0].id}/messages?limit=1`, { token: ownerToken });
  assert.equal(conversationMessages.data.messages.length, 1);
  assert.equal((await jsonRequest(`${baseUrl}/api/conversations/${ownerConversations.data.conversations[0].id}/messages`, { token: otherOwnerToken })).response.status, 404);
  const markConversationRead = await jsonRequest(`${baseUrl}/api/conversations/${ownerConversations.data.conversations[0].id}/read`, { method: 'PATCH', token: ownerToken });
  assert.equal(markConversationRead.response.status, 200);
  assert.equal((await jsonRequest(`${baseUrl}/api/conversations`, { token: ownerToken })).data.conversations[0].unreadCount, 0);
  const unrelatedConversation = await jsonRequest(`${baseUrl}/api/conversations/${conversation.data.conversation.id}/messages`, {
    method: 'POST', token: otherOwnerToken, body: JSON.stringify({ message: 'Unauthorized message' }),
  });
  assert.equal(unrelatedConversation.response.status, 404);

  const interview = await jsonRequest(`${baseUrl}/api/applications/${application.data.application.id}/interviews`, {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ startsAt: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 45, mode: 'Video', locationOrLink: 'https://meet.example.test/abc' }),
  });
  assert.equal(interview.response.status, 201);
  assert.equal(interview.data.interview.timeZone, 'UTC');
  const overlappingInterview = await jsonRequest(`${baseUrl}/api/applications/${application.data.application.id}/interviews`, {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ startsAt: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 30, mode: 'Video', timeZone: 'UTC' }),
  });
  assert.equal(overlappingInterview.response.status, 409);
  const invalidTimeZone = await jsonRequest(`${baseUrl}/api/applications/${application.data.application.id}/interviews`, {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ startsAt: new Date(Date.now() + 3 * 86400000).toISOString(), durationMinutes: 30, mode: 'Video', timeZone: 'Mars/Olympus' }),
  });
  assert.equal(invalidTimeZone.response.status, 400);
  const changedInterview = await jsonRequest(`${baseUrl}/api/interviews/${interview.data.interview.id}`, {
    method: 'PATCH', token: ownerToken,
    body: JSON.stringify({ startsAt: new Date(Date.now() + 172800000).toISOString(), mode: 'Phone' }),
  });
  assert.equal(changedInterview.data.interview.mode, 'Phone');
  const unauthorizedInterviewChange = await jsonRequest(`${baseUrl}/api/interviews/${interview.data.interview.id}`, {
    method: 'PATCH', token: otherOwnerToken, body: JSON.stringify({ status: 'Cancelled' }),
  });
  assert.equal(unauthorizedInterviewChange.response.status, 404);
  const interviewResponse = await jsonRequest(`${baseUrl}/api/interviews/${interview.data.interview.id}/response`, {
    method: 'PATCH', token: candidateToken, body: JSON.stringify({ response: 'Confirmed' }),
  });
  assert.equal(interviewResponse.data.interview.candidateResponse, 'Confirmed');
  const unrelatedInterviewResponse = await jsonRequest(`${baseUrl}/api/interviews/${interview.data.interview.id}/response`, {
    method: 'PATCH', token: otherOwnerToken, body: JSON.stringify({ response: 'Confirmed' }),
  });
  assert.equal(unrelatedInterviewResponse.response.status, 404);

  await jsonRequest(`${baseUrl}/api/applications/${application.data.application.id}/status`, {
    method: 'PATCH', token: ownerToken, body: JSON.stringify({ status: 'Selected' }),
  });
  const review = await jsonRequest(`${baseUrl}/api/applications/${application.data.application.id}/reviews`, {
    method: 'POST', token: candidateToken, body: JSON.stringify({ rating: 5, text: 'Supportive team and a well organized clinic.' }),
  });
  assert.equal(review.response.status, 201);
  const publicReviews = await jsonRequest(`${baseUrl}/api/clinics/${ownerSignup.data.user.id}/reviews`);
  assert.equal(publicReviews.data.reviews.length, 1);
  assert.equal(publicReviews.data.averageRating, 5);
  const duplicateReview = await jsonRequest(`${baseUrl}/api/applications/${application.data.application.id}/reviews`, {
    method: 'POST', token: candidateToken, body: JSON.stringify({ rating: 4, text: 'Another review for the same application.' }),
  });
  assert.equal(duplicateReview.response.status, 409);
  const reviewReport = await jsonRequest(`${baseUrl}/api/reviews/${review.data.review.id}/report`, {
    method: 'POST', token: otherOwnerToken, body: JSON.stringify({ reason: 'Please review this content.' }),
  });
  assert.equal(reviewReport.response.status, 201);
  assert.equal((await jsonRequest(`${baseUrl}/api/moderation/reviews`, { token: ownerToken })).response.status, 403);
  assert.equal((await jsonRequest(`${baseUrl}/api/reviews/${review.data.review.id}/moderate`, { method: 'PATCH', token: ownerToken, body: JSON.stringify({ status: 'Hidden' }) })).response.status, 403);
  const reviewQueue = await jsonRequest(`${baseUrl}/api/moderation/reviews`, { token: adminToken });
  assert.equal(reviewQueue.data.reviews.length, 1);
  const hideReview = await jsonRequest(`${baseUrl}/api/reviews/${review.data.review.id}/moderate`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ status: 'Hidden' }) });
  assert.equal(hideReview.data.review.status, 'Hidden');
  assert.equal((await jsonRequest(`${baseUrl}/api/clinics/${ownerSignup.data.user.id}/reviews`)).data.reviews.length, 0);
  await jsonRequest(`${baseUrl}/api/reviews/${review.data.review.id}/moderate`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ status: 'Published' }) });

  const privateDocument = `data:application/pdf;base64,${Buffer.from('%PDF-1.4 verification').toString('base64')}`;
  const verification = await jsonRequest(`${baseUrl}/api/verification-requests`, {
    method: 'POST', token: candidateToken,
    body: JSON.stringify({ documentName: 'license.pdf', documentData: privateDocument }),
  });
  assert.equal(verification.response.status, 201);
  assert.equal(Object.hasOwn((await jsonRequest(`${baseUrl}/api/verification-requests`, { token: candidateToken })).data.requests[0], 'documentData'), false);
  const anotherUsersDocument = await jsonRequest(`${baseUrl}/api/verification-requests/${verification.data.request.id}/document`, { token: otherOwnerToken });
  assert.equal(anotherUsersDocument.response.status, 404);
  assert.equal((await jsonRequest(`${baseUrl}/api/verification-requests/${verification.data.request.id}/review`, { method: 'PATCH', token: ownerToken, body: JSON.stringify({ status: 'Approved' }) })).response.status, 403);
  assert.equal((await jsonRequest(`${baseUrl}/api/verification-requests/${verification.data.request.id}/review`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ status: 'Rejected' }) })).response.status, 400);
  const approvedVerification = await jsonRequest(`${baseUrl}/api/verification-requests/${verification.data.request.id}/review`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ status: 'Approved' }) });
  assert.equal(approvedVerification.response.status, 200);
  assert.equal((await jsonRequest(`${baseUrl}/api/profile`, { token: candidateToken })).data.user.isVerified, true);
  const reviewedMetadata = await jsonRequest(`${baseUrl}/api/verification-requests`, { token: candidateToken });
  assert.equal(reviewedMetadata.data.requests[0].reviewer.fullName, 'API Test Administrator');
  assert.ok(reviewedMetadata.data.requests[0].reviewedAt);
  const clinicVerification = await jsonRequest(`${baseUrl}/api/verification-requests`, { method: 'POST', token: ownerToken, body: JSON.stringify({ documentName: 'clinic-registration.pdf', documentData: privateDocument }) });
  assert.equal(clinicVerification.data.request.kind, 'Employer');
  const approvedClinic = await jsonRequest(`${baseUrl}/api/verification-requests/${clinicVerification.data.request.id}/review`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ status: 'Approved' }) });
  assert.equal(approvedClinic.response.status, 200);
  assert.equal((await jsonRequest(`${baseUrl}/api/clinics`, {})).data.clinics.find((clinic) => String(clinic.clinicId) === String(ownerSignup.data.user.id)).isVerified, true);
  const notifications = await jsonRequest(`${baseUrl}/api/notifications`, { token: candidateToken });
  assert.ok(notifications.data.notifications.some((item) => item.type === 'interview'));

  const removeSaved = await jsonRequest(`${baseUrl}/api/saved-jobs/${job.id}`, { method: 'DELETE', token: candidateToken });
  assert.equal(removeSaved.response.status, 200);
  const emptySavedList = await jsonRequest(`${baseUrl}/api/saved-jobs`, { token: candidateToken });
  assert.equal(emptySavedList.data.savedJobs.length, 0);

  let throttled;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    throttled = await jsonRequest(`${baseUrl}/api/auth/signup`, {
      method: 'POST', body: JSON.stringify({ fullName: 'Rate Check', email: `rate-${attempt}@example.test`, password: 'password1', role: 'Veterinarian' }),
    });
  }
  assert.equal(throttled.response.status, 429);
  assert.ok(Number(throttled.response.headers.get('retry-after')) > 0);

  const accountDeletion = await jsonRequest(`${baseUrl}/api/profile`, {
    method: 'DELETE', token: candidateToken, body: JSON.stringify({ currentPassword: 'password1' }),
  });
  assert.equal(accountDeletion.response.status, 200);
  assert.equal((await jsonRequest(`${baseUrl}/api/profile`, { token: candidateToken })).response.status, 401);
  assert.equal((await jsonRequest(`${baseUrl}/api/auth/login`, { method: 'POST', body: JSON.stringify({ email: 'candidate@example.test', password: 'password1' }) })).response.status, 401);
  assert.equal((await jsonRequest(`${baseUrl}/api/admin/users/${adminLogin.data.user.id}/status`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ active: false }) })).response.status, 400);
  const disabledOwner = await jsonRequest(`${baseUrl}/api/admin/users/${otherOwnerSignup.data.user.id}/status`, { method: 'PATCH', token: adminToken, body: JSON.stringify({ active: false }) });
  assert.equal(disabledOwner.response.status, 200);
  assert.equal((await jsonRequest(`${baseUrl}/api/profile`, { token: otherOwnerToken })).response.status, 401);
});
