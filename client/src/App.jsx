import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

const fallbackJobs = [
  {
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

const emptyBusinessDetails = {
  businessName: '',
  contactName: '',
  contactEmail: '',
  phone: '',
  website: '',
  address: '',
  registrationNumber: '',
};

const loadSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('vetreliefUser') || 'null');
  } catch {
    return null;
  }
};

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(loadSavedUser);
  const [jobs, setJobs] = useState(fallbackJobs);
  const [selectedJob, setSelectedJob] = useState(fallbackJobs[0]);
  const [applicants, setApplicants] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [applicationFormOpen, setApplicationFormOpen] = useState(false);
  const [applicationForm, setApplicationForm] = useState(() => {
    const user = loadSavedUser();
    return {
      name: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      qualifications: user?.qualifications || '',
      resumeName: user?.resumeName || '',
      resumeData: user?.resumeData || '',
      message: '',
    };
  });
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Veterinarian',
  });
  const [jobForm, setJobForm] = useState({
    title: '',
    clinic: '',
    location: '',
    type: 'Full Time',
    pay: '',
    schedule: '',
    tags: '',
    description: '',
    requirements: '',
  });
  const [businessForm, setBusinessForm] = useState(() => ({
    ...emptyBusinessDetails,
    ...loadSavedUser()?.businessDetails,
  }));
  const [deletingJobId, setDeletingJobId] = useState('');
  const [jobDeletePassword, setJobDeletePassword] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const myJobs = currentUser
    ? jobs.filter((job) => String(job.recruiterEmail || '').toLowerCase() === currentUser.email.toLowerCase())
    : [];

  useEffect(() => {
    if (currentUser) localStorage.setItem('vetreliefUser', JSON.stringify(currentUser));
    else localStorage.removeItem('vetreliefUser');
  }, [currentUser]);

  useEffect(() => {
    if (!applicationFormOpen || !currentUser) return;
    setApplicationForm((previous) => ({
      ...previous,
      name: currentUser.fullName || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      location: currentUser.location || '',
      qualifications: currentUser.qualifications || '',
      resumeName: currentUser.resumeName || '',
      resumeData: currentUser.resumeData || '',
    }));
  }, [applicationFormOpen, currentUser]);

  const visibleJobs = activeFilter === 'All'
    ? jobs
    : jobs.filter((job) => {
        const title = job.title.toLowerCase();
        const tags = Array.isArray(job.tags) ? job.tags.join(' ').toLowerCase() : String(job.tags || '').toLowerCase();
        if (activeFilter === 'Veterinarian') return /veterinarian|dvm|locum/.test(title);
        if (activeFilter === 'Vet Tech') return /tech/.test(title);
        return tags.includes(activeFilter.toLowerCase());
      });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${API_URL}/api/jobs`);
        const data = await response.json();

        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
          setSelectedJob(data.jobs[0]);
        }
      } catch (error) {
        console.error('Failed to load jobs from API:', error);
      }
    };

    const fetchApplications = async () => {
      try {
        const response = await fetch(`${API_URL}/api/applications`);
        const data = await response.json();
        if (response.ok && Array.isArray(data.applications)) {
          setApplicants(data.applications.map((application) => ({
            name: application.name,
            role: application.jobTitle,
            status: application.status,
          })));
        }
      } catch (error) {
        console.error('Failed to load applications from API:', error);
      }
    };

    fetchJobs();
    fetchApplications();
  }, []);

  useEffect(() => {
    if (!statusMessage.text || statusMessage.type === 'error') return undefined;

    const dismissTimer = window.setTimeout(() => {
      setStatusMessage({ type: '', text: '' });
    }, 4500);

    return () => window.clearTimeout(dismissTimer);
  }, [statusMessage]);

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleJobChange = (event) => {
    const { name, value } = event.target;
    setJobForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBusinessChange = (event) => {
    const { name, value } = event.target;
    setBusinessForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplicationChange = (event) => {
    const { name, value } = event.target;
    setApplicationForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleApplicationResume = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' || file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Choose a PDF resume under 2 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setApplicationForm((previous) => ({
      ...previous,
      resumeName: file.name,
      resumeData: String(reader.result || ''),
    }));
    reader.onerror = () => setStatusMessage({ type: 'error', text: 'Unable to read that resume file.' });
    reader.readAsDataURL(file);
  };

  const handleApplyNow = (job) => {
    setSelectedJob(job);
    setApplicationFormOpen(true);
    window.requestAnimationFrame(() => {
      const target = currentUser ? 'application-form' : 'about';
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    if (!currentUser) {
      setAuthMode('login');
      setStatusMessage({ type: 'error', text: 'Log in to continue with your application.' });
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const payload =
      authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : {
            fullName: authForm.fullName,
            email: authForm.email,
            password: authForm.password,
            role: authForm.role,
          };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusMessage({ type: 'error', text: data.message || 'Authentication failed.' });
        return;
      }

      const successMessage = authMode === 'login'
        ? `Welcome back, ${data.user.fullName || data.user.email}.`
        : data.message || 'Account created successfully.';
      setStatusMessage({ type: 'success', text: successMessage });
      setCurrentUser(data.user);
      setBusinessForm({ ...emptyBusinessDetails, ...data.user.businessDetails });
      setAuthForm({ fullName: '', email: '', password: '', role: 'Veterinarian' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Unable to connect to the server.' });
      console.error(error);
    }
  };

  const handleJobSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobForm,
          tags: jobForm.tags,
          requirements: jobForm.requirements,
          recruiterEmail: currentUser?.email || '',
          businessDetails: businessForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusMessage({ type: 'error', text: data.message || 'Unable to post job.' });
        return;
      }

      const newestJob = data.job;
      setJobs((prev) => [newestJob, ...prev]);
      setSelectedJob(newestJob);
      setJobForm({
        title: '',
        clinic: '',
        location: '',
        type: 'Full Time',
        pay: '',
        schedule: '',
        tags: '',
        description: '',
        requirements: '',
      });
      setStatusMessage({ type: 'success', text: 'Job posted and added to the listings.' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Unable to post the job right now.' });
      console.error(error);
    }
  };

  const handleJobDelete = async (event) => {
    event.preventDefault();
    if (!currentUser || !deletingJobId || !jobDeletePassword) return;

    try {
      const response = await fetch(`${API_URL}/api/jobs/${encodeURIComponent(deletingJobId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, password: jobDeletePassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatusMessage({ type: 'error', text: data.message || 'Unable to delete the job post.' });
        return;
      }

      const remainingJobs = jobs.filter((job) => String(job._id || job.id) !== deletingJobId);
      setJobs(remainingJobs);
      if (String(selectedJob._id || selectedJob.id) === deletingJobId) {
        setSelectedJob(remainingJobs[0] || fallbackJobs[0]);
      }
      setDeletingJobId('');
      setJobDeletePassword('');
      setStatusMessage({ type: 'success', text: 'Your job post was deleted.' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Unable to connect to the server.' });
      console.error(error);
    }
  };

  const handleApplicationSubmit = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setAuthMode('login');
      setStatusMessage({ type: 'error', text: 'Log in before submitting an application.' });
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!applicationForm.resumeData || !applicationForm.resumeName) {
      setStatusMessage({ type: 'error', text: 'Upload a PDF resume in your profile or attach one here to continue.' });
      return;
    }

    const payload = {
      ...applicationForm,
      role: currentUser.role || 'Veterinarian',
      jobTitle: selectedJob.title,
    };

    try {
      const response = await fetch(`${API_URL}/api/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusMessage({ type: 'error', text: data.message || 'Application failed.' });
        return;
      }

      setApplicants((prev) => [
        { name: payload.name, role: payload.jobTitle, status: 'New Application' },
        ...prev,
      ]);
      setApplicationFormOpen(false);
      setStatusMessage({ type: 'success', text: 'Application submitted successfully.' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Unable to submit the application.' });
      console.error(error);
    }
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">V</div>
          <div>
            <p className="brand-name">VetRelief</p>
            <span className="brand-subtitle">Staffing Portal</span>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#jobs">Jobs</a>
          <a href="#about">About</a>
          <a href="#clinics">Clinics</a>
        </nav>

        <div className="nav-actions">
          {currentUser ? (
            <>
              <Link className="btn btn-secondary" to="/profile">Profile</Link>
              <button className="btn btn-secondary" onClick={() => setCurrentUser(null)}>Sign out</button>
            </>
          ) : (
            <a className="btn btn-secondary" href="#about">Log in</a>
          )}
          <a className="btn btn-primary" href="#job-post">Post a Job</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Trusted veterinary staffing</p>
            <h1>Find relief vets and vet techs for every shift.</h1>
            <p className="hero-text">
              Connect animal hospitals with licensed professionals who can step in quickly,
              support surgical teams, and keep patient care running smoothly.
            </p>

            <div className="hero-actions">
              <a className="btn btn-primary large" href="#jobs">Browse Jobs</a>
              <a className="btn btn-secondary large" href="#about">Join as a Vet</a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>12k+</strong>
                <span>Professionals</span>
              </div>
              <div>
                <strong>2.5k+</strong>
                <span>Clinic partners</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Average rating</span>
              </div>
            </div>
          </div>

          <div className="hero-panel">
            <div className="mini-card">
              <span className="mini-label">Open roles</span>
              <h3>{jobs.length}</h3>
              <p>Veterinary Relief Doctors &amp; Vet Techs</p>
            </div>
            <div className="mini-card light">
              <span className="mini-label">Featured</span>
              <h4>{selectedJob.title}</h4>
              <p>{selectedJob.location} • {selectedJob.schedule}</p>
            </div>
          </div>
        </section>

        <section id="jobs" className="jobs-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Open opportunities</p>
              <h2>Latest veterinary jobs</h2>
            </div>
            <a className="btn btn-secondary" href="#jobs">View all</a>
          </div>

          <div className="filters">
            {['All', 'Veterinarian', 'Vet Tech', 'Emergency', 'Surgery'].map((filter) => (
              <button
                key={filter}
                className={activeFilter === filter ? 'filter active' : 'filter'}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="job-grid">
            {visibleJobs.map((job) => (
              <article key={`${job.title}-${job.clinic}`} className="job-card">
                <div className="job-top">
                  <div>
                    <p className="job-type">{job.type}</p>
                    <h3>{job.title}</h3>
                  </div>
                  <span className="badge">New</span>
                </div>

                <p className="clinic-name">{job.clinic}</p>

                <div className="meta-row">
                  <span>{job.location}</span>
                  <span>{job.schedule}</span>
                </div>

                <div className="tags">
                  {(job.tags || []).map((tag) => (
                    <span key={`${job.title}-${tag}`} className="tag">{tag}</span>
                  ))}
                </div>

                <div className="job-bottom">
                  <div>
                    <p className="pay-label">Compensation</p>
                    <strong>{job.pay}</strong>
                  </div>
                  <button
                    className="btn btn-primary small"
                    onClick={() => handleApplyNow(job)}
                  >
                    Apply now
                  </button>
                </div>
              </article>
            ))}
            {visibleJobs.length === 0 && <p className="empty-state">No jobs match this filter.</p>}
          </div>
        </section>

        <section id="about" className="workflow-section">
          <div className="auth-panel">
            <div className="tab-switcher">
              <button
                className={authMode === 'login' ? 'tab active' : 'tab'}
                onClick={() => setAuthMode('login')}
              >
                Log in
              </button>
              <button
                className={authMode === 'signup' ? 'tab active' : 'tab'}
                onClick={() => setAuthMode('signup')}
              >
                Sign up
              </button>
            </div>

            <form className="form-shell" onSubmit={handleAuthSubmit}>
              <h3>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h3>

              {authMode === 'signup' && (
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full name"
                  value={authForm.fullName}
                  onChange={handleAuthChange}
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={authForm.email}
                onChange={handleAuthChange}
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={authForm.password}
                onChange={handleAuthChange}
              />

              {authMode === 'signup' && (
                <select name="role" value={authForm.role} onChange={handleAuthChange}>
                  <option value="Veterinarian">Veterinarian</option>
                  <option value="Vet Tech">Vet Tech</option>
                  <option value="Clinic Owner">Clinic Owner</option>
                </select>
              )}

              <button type="submit" className="btn btn-primary form-btn">
                {authMode === 'login' ? 'Log in' : 'Create account'}
              </button>
              {authMode === 'login' && <Link className="text-link forgot-link" to="/profile#recovery">Forgot password?</Link>}
            </form>
          </div>

          <div className="detail-panel">
            <p className="eyebrow">Selected opportunity</p>
            <h3>{selectedJob.title}</h3>
            <p className="detail-clinic">{selectedJob.clinic}</p>

            <div className="meta-row detail-row">
              <span>{selectedJob.location}</span>
              <span>{selectedJob.schedule}</span>
            </div>

            <p className="detail-text">{selectedJob.description}</p>

            <div className="detail-list">
              <h4>Requirements</h4>
              <ul>
                {(selectedJob.requirements || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="detail-footer">
              <div>
                <span className="mini-label dark">Pay</span>
                <strong>{selectedJob.pay}</strong>
              </div>
              <button className="btn btn-primary small" type="button" onClick={() => handleApplyNow(selectedJob)}>
                Apply for this role
              </button>
            </div>

            {applicationFormOpen && (
              <div className="application-panel" id="application-form">
                <div className="application-heading">
                  <div><p className="eyebrow">Application</p><h4>{selectedJob.title}</h4></div>
                  <button className="toast-close" type="button" aria-label="Close application form" onClick={() => setApplicationFormOpen(false)}>&times;</button>
                </div>
                {!currentUser ? (
                  <div className="application-login-prompt">
                    <p>Sign in to prefill your details and attach your saved resume.</p>
                    <a className="btn btn-secondary small" href="#about">Go to login</a>
                  </div>
                ) : (
                  <form className="application-form" onSubmit={handleApplicationSubmit}>
                    <div className="application-form-grid">
                      <label>Full name
                        <input name="name" value={applicationForm.name} onChange={handleApplicationChange} required />
                      </label>
                      <label>Email address
                        <input name="email" type="email" value={applicationForm.email} onChange={handleApplicationChange} required />
                      </label>
                      <label>Phone number
                        <input name="phone" type="tel" value={applicationForm.phone} onChange={handleApplicationChange} required />
                      </label>
                      <label>Location
                        <input name="location" value={applicationForm.location} onChange={handleApplicationChange} />
                      </label>
                    </div>
                    <label>Qualifications / specialties
                      <textarea name="qualifications" value={applicationForm.qualifications} onChange={handleApplicationChange} rows="3" />
                    </label>
                    <div className="application-resume">
                      <div>
                        <strong>Resume</strong>
                        <p>{applicationForm.resumeName || 'No resume attached yet.'}</p>
                      </div>
                      <label className="photo-upload">{applicationForm.resumeData ? 'Replace resume' : 'Attach PDF resume'}
                        <input type="file" accept="application/pdf,.pdf" onChange={handleApplicationResume} />
                      </label>
                      {applicationForm.resumeData && (
                        <button className="btn btn-secondary small" type="button" onClick={() => setApplicationForm((previous) => ({ ...previous, resumeName: '', resumeData: '' }))}>Remove</button>
                      )}
                      <small>PDF only · Maximum 2 MB</small>
                    </div>
                    <label>Message to the clinic
                      <textarea name="message" value={applicationForm.message} onChange={handleApplicationChange} rows="3" placeholder={`Why are you interested in ${selectedJob.title}?`} />
                    </label>
                    <div className="application-actions">
                      <button className="btn btn-primary" type="submit">Submit application</button>
                      <button className="btn btn-secondary" type="button" onClick={() => setApplicationFormOpen(false)}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </section>

        <section id="clinics" className="dashboard-section">
          <div className="section-header dashboard-header">
            <div>
              <p className="eyebrow">Clinic dashboard</p>
              <h2>Hiring overview</h2>
            </div>
            <a className="btn btn-secondary" href="#job-post">Manage jobs</a>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <p>Open roles</p>
              <strong>{jobs.length}</strong>
            </div>
            <div className="stat-card">
              <p>Applications</p>
              <strong>{applicants.length}</strong>
            </div>
            <div className="stat-card">
              <p>Ratings</p>
              <strong>4.9/5</strong>
            </div>
            <div className="stat-card">
              <p>Filled this week</p>
              <strong>6</strong>
            </div>
          </div>

          {currentUser && (
            <div className="my-jobs-panel">
              <div className="my-jobs-heading">
                <div><h3>Your job posts</h3><p>Only posts created by this account can be removed.</p></div>
                <span>{myJobs.length} posts</span>
              </div>
              {myJobs.length === 0 ? (
                <p className="empty-state">You have not posted any jobs yet.</p>
              ) : (
                <div className="my-jobs-list">
                  {myJobs.map((job) => {
                    const jobId = String(job._id || job.id);
                    return (
                      <article className="my-job-item" key={jobId}>
                        <div className="my-job-summary">
                          <strong>{job.title}</strong>
                          <span>{job.clinic} · {job.location} · {job.pay}</span>
                        </div>
                        {deletingJobId === jobId ? (
                          <form className="job-delete-confirm" onSubmit={handleJobDelete}>
                            <label>
                              Confirm password
                              <input type="password" value={jobDeletePassword} onChange={(event) => setJobDeletePassword(event.target.value)} required autoComplete="current-password" />
                            </label>
                            <button className="btn btn-danger small" type="submit">Confirm delete</button>
                            <button className="btn btn-secondary small" type="button" onClick={() => { setDeletingJobId(''); setJobDeletePassword(''); }}>Cancel</button>
                          </form>
                        ) : (
                          <button className="btn btn-danger small" type="button" onClick={() => setDeletingJobId(jobId)}>Delete post</button>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="dashboard-grid">
            <div className="applicant-panel">
              <h3>Recent applicants</h3>
              <ul>
                {applicants.map((applicant) => (
                  <li key={`${applicant.name}-${applicant.role}`} className="applicant-item">
                    <div>
                      <strong>{applicant.name}</strong>
                      <span>{applicant.role}</span>
                    </div>
                    <button className="status-btn">{applicant.status}</button>
                  </li>
                ))}
                {applicants.length === 0 && <li className="empty-state">No applications yet.</li>}
              </ul>
            </div>

            <div className="profile-panel">
              <h3>Your profile</h3>
              <div className="profile-card">
                {currentUser?.avatarData ? (
                  <img className="avatar avatar-image" src={currentUser.avatarData} alt={`${currentUser.fullName} profile`} />
                ) : (
                  <div className="avatar">
                    {(currentUser?.fullName || currentUser?.email || 'V').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                  </div>
                )}
                <div>
                  <strong>{currentUser?.fullName || 'Guest profile'}</strong>
                  <p>{currentUser?.role || 'Sign in to manage your profile'}</p>
                </div>
              </div>

              <div className="profile-info">
                <p>
                  <span>Email:</span> {currentUser?.email || 'Not signed in'}
                </p>
                {currentUser && <Link className="btn btn-secondary small" to="/profile">Manage profile</Link>}
              </div>
            </div>
          </div>

          <div className="job-post-panel" id="job-post">
            <h3>Post a new veterinary job</h3>
            <form className="job-form" onSubmit={handleJobSubmit}>
              <div className="job-form-grid">
                <input name="title" placeholder="Job title" value={jobForm.title} onChange={handleJobChange} />
                <input name="clinic" placeholder="Clinic name" value={jobForm.clinic} onChange={handleJobChange} />
                <input name="location" placeholder="Location" value={jobForm.location} onChange={handleJobChange} />
                <select name="type" value={jobForm.type} onChange={handleJobChange}>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                </select>
                <input name="pay" placeholder="Compensation (₹ / INR), e.g. ₹1,500 - ₹2,500 / hour" value={jobForm.pay} onChange={handleJobChange} />
                <input name="schedule" placeholder="Schedule" value={jobForm.schedule} onChange={handleJobChange} />
              </div>
              <input name="tags" placeholder="Skills / tags (comma separated)" value={jobForm.tags} onChange={handleJobChange} />
              <textarea name="description" placeholder="Job description" value={jobForm.description} onChange={handleJobChange} />
              <input name="requirements" placeholder="Requirements (comma separated)" value={jobForm.requirements} onChange={handleJobChange} />
              <fieldset className="business-fields">
                <legend>Recruiter business details</legend>
                <p>Share clinic contact and registration details with professionals reviewing this role.</p>
                <div className="job-form-grid">
                  <input name="businessName" placeholder="Registered business name" value={businessForm.businessName} onChange={handleBusinessChange} required />
                  <input name="contactName" placeholder="Recruiter contact name" value={businessForm.contactName} onChange={handleBusinessChange} required />
                  <input name="contactEmail" type="email" placeholder="Business email" value={businessForm.contactEmail} onChange={handleBusinessChange} required />
                  <input name="phone" type="tel" placeholder="Business phone" value={businessForm.phone} onChange={handleBusinessChange} required />
                  <input name="website" type="url" placeholder="Website (optional)" value={businessForm.website} onChange={handleBusinessChange} />
                  <input name="registrationNumber" placeholder="Business registration / license no." value={businessForm.registrationNumber} onChange={handleBusinessChange} />
                </div>
                <textarea name="address" placeholder="Business address" value={businessForm.address} onChange={handleBusinessChange} required />
              </fieldset>
              <button type="submit" className="btn btn-primary">Publish job</button>
            </form>
          </div>

        </section>
      </main>

      {statusMessage.text && (
        <div
          className={`toast ${statusMessage.type === 'error' ? 'toast-error' : 'toast-success'}`}
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          aria-live={statusMessage.type === 'error' ? 'assertive' : 'polite'}
        >
          <span className="toast-icon" aria-hidden="true">
            {statusMessage.type === 'error' ? '!' : '\u2713'}
          </span>
          <div className="toast-copy">
            <strong>{statusMessage.type === 'error' ? 'Action needed' : 'You\u2019re all set'}</strong>
            <p>{statusMessage.text}</p>
          </div>
          <button
            className="toast-close"
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setStatusMessage({ type: '', text: '' })}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
