import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const fallbackJobs = [];

const emptyBusinessDetails = {
  businessName: '',
  contactName: '',
  contactEmail: '',
  phone: '',
  website: '',
  address: '',
  registrationNumber: '',
};

const loadSavedToken = () => localStorage.getItem('vetreliefToken') || '';

const loadSavedUser = () => {
  if (!loadSavedToken()) return null;
  try {
    return JSON.parse(localStorage.getItem('vetreliefUser') || 'null');
  } catch {
    return null;
  }
};

const formatJobPay = (job) => {
  if (job.salaryMin == null && job.salaryMax == null) return job.pay || 'Pay not listed';
  const currency = job.currency || 'INR';
  const format = (amount) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  const range = job.salaryMin != null && job.salaryMax != null
    ? `${format(job.salaryMin)} – ${format(job.salaryMax)}`
    : job.salaryMin != null ? `From ${format(job.salaryMin)}` : `Up to ${format(job.salaryMax)}`;
  return `${range}${job.payFrequency ? ` / ${job.payFrequency}` : ''}`;
};

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(loadSavedUser);
  const [authToken, setAuthToken] = useState(loadSavedToken);
  const [jobs, setJobs] = useState(fallbackJobs);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(fallbackJobs[0]);
  const [applicants, setApplicants] = useState([]);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [jobAlerts, setJobAlerts] = useState([]);
  const [notificationItems, setNotificationItems] = useState([]);
  const [messageThreads, setMessageThreads] = useState([]);
  const [expandedConversationId, setExpandedConversationId] = useState('');
  const [conversationHistory, setConversationHistory] = useState({});
  const [interviews, setInterviews] = useState([]);
  const [alertForm, setAlertForm] = useState({ keywords: '', location: '', specialization: '', type: '', minSalary: '', maxSalary: '', currency: 'INR', frequency: 'Instant' });
  const [verificationState, setVerificationState] = useState({ file: null, request: null });
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminJobs, setAdminJobs] = useState([]);
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminJobSearch, setAdminJobSearch] = useState('');
  const [mentors, setMentors] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [mentorForm, setMentorForm] = useState({ isMentor: false, topics: '', availability: '', methods: '' });
  const [studentInternships, setStudentInternships] = useState([]);
  const [studentExternships, setStudentExternships] = useState([]);
  const [studentEntryJobs, setStudentEntryJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [resumeForm, setResumeForm] = useState({ template: 'modern', summary: '', qualifications: '', educationText: '', experienceText: '', skills: '', certifications: '' });
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceSpecialty, setPracticeSpecialty] = useState('');
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [aiMatches, setAiMatches] = useState([]);
  const [resumeAISuggestions, setResumeAISuggestions] = useState('');
  const [interviewFeedback, setInterviewFeedback] = useState({});
  const [selectedFeedbackQuestionId, setSelectedFeedbackQuestionId] = useState('');
  const [careerGoals, setCareerGoals] = useState([]);
  const [careerGoalForm, setCareerGoalForm] = useState({ title: '', description: '', targetDate: '', milestones: '' });
  const [learningResources, setLearningResources] = useState([]);
  const [savedResources, setSavedResources] = useState([]);
  const [resourceFilters, setResourceFilters] = useState({ search: '', category: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', category: '', summary: '', url: '', tags: '' });
  const [editingResourceId, setEditingResourceId] = useState('');
  const [clinicProfiles, setClinicProfiles] = useState([]);
  const [clinicReviewsById, setClinicReviewsById] = useState({});
  const [mapViewEnabled, setMapViewEnabled] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [jobFilters, setJobFilters] = useState({ keyword: '', location: '', specialization: '', type: '', opportunityType: '', experienceLevel: '', workMode: '', postedWithinDays: '', minSalary: '', maxSalary: '', currency: '', sort: 'relevance', verifiedOnly: '' });
  const [jobPage, setJobPage] = useState(1);
  const [jobPages, setJobPages] = useState(1);
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
    opportunityType: 'Job', duration: '', eligibility: '', responsibilities: '', stipend: '', applicationDeadline: '', mentorshipDetails: '', learningObjectives: '', applicationInstructions: '', startDate: '', endDate: '', shiftDetails: '', latitude: '', longitude: '',
    type: 'Full Time',
    experienceLevel: '',
    workMode: '',
    pay: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'INR',
    payFrequency: '',
    benefits: '',
    accommodation: '',
    relocationAssistance: '',
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
  const [editingJobId, setEditingJobId] = useState('');
  const [updatingApplicationId, setUpdatingApplicationId] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [appInstalled, setAppInstalled] = useState(false);

  const myJobs = currentUser?.role === 'Clinic Owner' ? employerJobs : [];
  const mappableJobs = visibleJobs.filter((job) => job.latitude != null && job.longitude != null);
  const mapJob = selectedJob?.latitude != null && selectedJob?.longitude != null ? selectedJob : mappableJobs[0];
  const filteredApplicants = currentUser?.role === 'Clinic Owner' ? applicants.filter((applicant) => {
    const query = candidateSearch.trim().toLowerCase();
    const searchable = [applicant.name, applicant.role, applicant.jobTitle, applicant.location, applicant.candidateProfile?.professionalSummary,
      ...(applicant.candidateProfile?.specializations || []), ...(applicant.candidateProfile?.skills || []), ...(applicant.candidateProfile?.certifications || [])].join(' ').toLowerCase();
    return (!query || searchable.includes(query)) && (!candidateStatusFilter || applicant.status === candidateStatusFilter);
  }) : applicants;
  const recentApplicationCount = applicants.filter((application) => application.createdAt && Date.now() - new Date(application.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  const ratedClinics = clinicProfiles.filter((clinic) => Number.isFinite(clinic.averageRating));
  const averageClinicRating = ratedClinics.length ? (ratedClinics.reduce((total, clinic) => total + clinic.averageRating, 0) / ratedClinics.length).toFixed(1) : '—';

  useEffect(() => {
    if (currentUser) localStorage.setItem('vetreliefUser', JSON.stringify(currentUser));
    else localStorage.removeItem('vetreliefUser');
  }, [currentUser]);

  useEffect(() => {
    if (authToken) localStorage.setItem('vetreliefToken', authToken);
    else localStorage.removeItem('vetreliefToken');
  }, [authToken]);

  useEffect(() => {
    setAppInstalled(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
    const captureInstallPrompt = (event) => { event.preventDefault(); setInstallPrompt(event); };
    const installed = () => { setAppInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('beforeinstallprompt', captureInstallPrompt); window.removeEventListener('appinstalled', installed); };
  }, []);

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

  const visibleJobs = jobs;

  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        const query = new URLSearchParams({ page: String(jobPage), limit: '12', sort: jobFilters.sort });
        Object.entries(jobFilters).forEach(([key, value]) => {
          if (value && key !== 'sort') query.set(key, value);
        });
        if (activeFilter !== 'All' && activeFilter !== 'Veterinarian' && activeFilter !== 'Vet Tech') query.set('specialization', activeFilter);
        if (activeFilter === 'Veterinarian' || activeFilter === 'Vet Tech') query.set('keyword', activeFilter);
        const response = await fetch(`${API_URL}/api/jobs?${query.toString()}`);
        const data = await response.json();

        if (Array.isArray(data.jobs)) {
          setJobs(data.jobs);
          setJobPages(data.pages || 1);
          setSelectedJob((current) => data.jobs.find((job) => String(job._id || job.id) === String(current?._id || current?.id)) || data.jobs[0] || fallbackJobs[0]);
        }
      } catch (error) {
        console.error('Failed to load jobs from API:', error);
      } finally { setJobsLoading(false); }
    };

    const timer = window.setTimeout(fetchJobs, 250);
    return () => window.clearTimeout(timer);
  }, [jobFilters, activeFilter, jobPage]);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!authToken) {
        setApplicants([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/applications`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.applications)) {
          setApplicants(data.applications);
        } else if (response.status === 401) {
          setApplicants([]);
        }
      } catch (error) {
        console.error('Failed to load applications from API:', error);
      }
    };

    const fetchSavedJobs = async () => {
      if (!authToken || !currentUser || currentUser.role === 'Clinic Owner') {
        setSavedJobs([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/saved-jobs`, { headers: { Authorization: `Bearer ${authToken}` } });
        const data = await response.json();
        setSavedJobs(response.ok && Array.isArray(data.savedJobs) ? data.savedJobs : []);
      } catch (error) {
        console.error('Failed to load saved jobs:', error);
      }
    };

    const fetchEmployerJobs = async () => {
      if (!authToken || currentUser?.role !== 'Clinic Owner') {
        setEmployerJobs([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/employer/jobs`, { headers: { Authorization: `Bearer ${authToken}` } });
        const data = await response.json();
        setEmployerJobs(response.ok && Array.isArray(data.jobs) ? data.jobs : []);
      } catch (error) {
        console.error('Failed to load employer jobs:', error);
      }
    };

    fetchApplications();
    fetchSavedJobs();
    fetchEmployerJobs();
  }, [authToken, currentUser]);

  useEffect(() => {
    if (!authToken || currentUser?.role !== 'Admin') { setVerificationQueue([]); setReviewQueue([]); setAdminOverview(null); setAdminUsers([]); setAdminJobs([]); return; }
    const headers = { Authorization: `Bearer ${authToken}` };
    Promise.all([
      fetch(`${API_URL}/api/verification-requests`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/api/moderation/reviews`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/overview`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/users?search=${encodeURIComponent(adminUserSearch)}`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/jobs?search=${encodeURIComponent(adminJobSearch)}`, { headers }).then((r) => r.json()),
    ]).then(([verification, reviews, overview, userData, jobData]) => {
      setVerificationQueue(verification.requests || []); setReviewQueue(reviews.reviews || []);
      setAdminOverview(overview.overview || null); setAdminUsers(userData.users || []); setAdminJobs(jobData.jobs || []);
    }).catch((error) => console.error('Failed to load moderation queues:', error));
  }, [authToken, currentUser, adminUserSearch, adminJobSearch]);

  useEffect(() => {
    if (!authToken) {
      setJobAlerts([]); setNotificationItems([]); setMessageThreads([]); setInterviews([]); setVerificationState({ file: null, request: null });
      setConversationHistory({}); setExpandedConversationId('');
      return;
    }
    const loadPhaseTwoData = async () => {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [alerts, notices, threads, interviewData, verification] = await Promise.all([
        fetch(`${API_URL}/api/job-alerts`, { headers }).then((r) => r.json()).catch(() => ({})),
        fetch(`${API_URL}/api/notifications`, { headers }).then((r) => r.json()).catch(() => ({})),
        fetch(`${API_URL}/api/conversations`, { headers }).then((r) => r.json()).catch(() => ({})),
        fetch(`${API_URL}/api/interviews`, { headers }).then((r) => r.json()).catch(() => ({})),
        fetch(`${API_URL}/api/verification-requests`, { headers }).then((r) => r.json()).catch(() => ({})),
      ]);
      setJobAlerts(Array.isArray(alerts.alerts) ? alerts.alerts : []);
      setNotificationItems(Array.isArray(notices.notifications) ? notices.notifications : []);
      setMessageThreads(Array.isArray(threads.conversations) ? threads.conversations : []);
      setInterviews(Array.isArray(interviewData.interviews) ? interviewData.interviews : []);
      setVerificationState((previous) => ({ ...previous, request: verification.requests?.[0] || null }));
    };
    loadPhaseTwoData();
  }, [authToken, currentUser]);

  useEffect(() => {
    fetch(`${API_URL}/api/clinics`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setClinicProfiles(Array.isArray(data?.clinics) ? data.clinics : []))
      .catch((error) => console.error('Failed to load clinic profiles:', error));
  }, []);

  useEffect(() => {
    setMentorForm({ isMentor: Boolean(currentUser?.isMentor), topics: (currentUser?.mentorshipTopics || []).join(', '), availability: currentUser?.mentorshipAvailability || '', methods: (currentUser?.mentorshipMethods || []).join(', ') });
    const loadMentorship = async () => {
      try {
        const [mentorData, requestData] = await Promise.all([
          fetch(`${API_URL}/api/mentors`).then((response) => response.json()),
          authToken ? fetch(`${API_URL}/api/mentorship-requests`, { headers: { Authorization: `Bearer ${authToken}` } }).then((response) => response.json()) : Promise.resolve({}),
        ]);
        setMentors(mentorData.mentors || []); setMentorshipRequests(requestData.requests || []);
      } catch (error) { console.error('Failed to load mentorship options:', error); }
    };
    const loadStudentOpportunities = async () => {
      if (currentUser?.role !== 'Veterinary Student') { setStudentInternships([]); setStudentExternships([]); setStudentEntryJobs([]); return; }
      try {
        const [internships, externships, entryJobs] = await Promise.all([
          fetch(`${API_URL}/api/jobs?opportunityType=Internship&limit=4`).then((response) => response.json()),
          fetch(`${API_URL}/api/jobs?opportunityType=Externship&limit=4`).then((response) => response.json()),
          fetch(`${API_URL}/api/jobs?experienceLevel=Entry%20level&limit=4`).then((response) => response.json()),
        ]);
        setStudentInternships(internships.jobs || []); setStudentExternships(externships.jobs || []); setStudentEntryJobs(entryJobs.jobs || []);
      } catch (error) { console.error('Failed to load student opportunities:', error); }
    };
    loadMentorship(); loadStudentOpportunities();
  }, [authToken, currentUser]);

  useEffect(() => {
    const loadLearningResources = async () => {
      try {
        if (authToken && currentUser?.role === 'Admin') {
          const response = await fetch(`${API_URL}/api/admin/learning-resources`, { headers: { Authorization: `Bearer ${authToken}` } });
          const data = response.ok ? await response.json() : {};
          const search = resourceFilters.search.toLowerCase(); const category = resourceFilters.category.toLowerCase();
          setLearningResources((data.resources || []).filter((resource) => (!search || `${resource.title} ${resource.summary} ${(resource.tags || []).join(' ')}`.toLowerCase().includes(search)) && (!category || resource.category.toLowerCase().includes(category))));
          return;
        }
        const query = new URLSearchParams({ limit: '50' });
        if (resourceFilters.search) query.set('search', resourceFilters.search);
        if (resourceFilters.category) query.set('category', resourceFilters.category);
        const response = await fetch(`${API_URL}/api/learning-resources?${query}`); const data = await response.json();
        setLearningResources(data.resources || []);
      } catch (error) { console.error('Failed to load learning resources:', error); }
    };
    loadLearningResources();
  }, [resourceFilters, authToken, currentUser]);

  useEffect(() => {
    if (!authToken || !currentUser || currentUser.role === 'Clinic Owner') {
      setRecommendations([]); setCareerGoals([]); setSavedResources([]); setPracticeQuestions([]); setPracticeAnswers({}); setAiConfigured(false); setAiMatches([]); setResumeAISuggestions(''); setInterviewFeedback({}); setSelectedFeedbackQuestionId(''); setAiConsent(false);
      return;
    }
    const headers = { Authorization: `Bearer ${authToken}` };
    const loadPersonalTools = async () => {
      try {
        const [recommendationData, resumeData, questionData, practiceData, goalData, savedResourceData, aiStatus] = await Promise.all([
          fetch(`${API_URL}/api/recommendations?limit=8`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/resume-builder`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/interview-prep/questions`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/interview-prep/progress`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/career-goals`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/saved-resources`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/ai/status`, { headers }).then((r) => r.json()).catch(() => ({})),
        ]);
        setAiConfigured(aiStatus.configured === true);
        setRecommendations(recommendationData.recommendations || []);
        const resume = resumeData.resume || {};
        setResumeForm({ template: resume.template || 'modern', summary: resume.summary || '', qualifications: resume.qualifications || '', educationText: (resume.education || []).map((row) => [row.qualification, row.institution, [row.startYear, row.endYear].filter(Boolean).join('-'), row.details].join(' | ')).join('\n'), experienceText: (resume.experience || []).map((row) => [row.title, row.employer, row.location, [row.startDate, row.endDate].filter(Boolean).join(' to '), row.details].join(' | ')).join('\n'), skills: (resume.skills || []).join(', '), certifications: (resume.certifications || []).join(', ') });
        setPracticeQuestions(questionData.questions || []);
        setSelectedFeedbackQuestionId((questionData.questions || [])[0]?.id || '');
        setPracticeAnswers(Object.fromEntries((practiceData.progress?.answers || []).map((answer) => [answer.questionId, answer])));
        setCareerGoals(goalData.goals || []); setSavedResources(savedResourceData.resources || []);
        setPracticeSpecialty(practiceData.progress?.specialization || '');
      } catch (error) { console.error('Failed to load career tools:', error); }
    };
    loadPersonalTools();
  }, [authToken, currentUser]);

  useEffect(() => {
    if (!authToken || !currentUser || currentUser.role === 'Clinic Owner') return;
    const timer = window.setTimeout(() => {
      fetch(`${API_URL}/api/recommendations?limit=8`, { headers: { Authorization: `Bearer ${authToken}` } })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => { if (data) setRecommendations(data.recommendations || []); })
        .catch((error) => console.error('Failed to refresh recommendations:', error));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [authToken, currentUser, savedJobs]);

  useEffect(() => {
    if (!authToken || !currentUser || currentUser.role === 'Clinic Owner') return;
    const query = practiceSpecialty ? `?specialization=${encodeURIComponent(practiceSpecialty)}` : '';
    fetch(`${API_URL}/api/interview-prep/questions${query}`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setPracticeQuestions(data.questions || []); })
      .catch((error) => console.error('Failed to load practice questions:', error));
  }, [authToken, currentUser, practiceSpecialty]);

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

  const handleJobFilterChange = (event) => {
    const { name, value } = event.target;
    setJobFilters((previous) => ({ ...previous, [name]: value }));
    setJobPage(1);
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
    if (currentUser?.role === 'Clinic Owner') {
      setStatusMessage({ type: 'error', text: 'Clinic owner accounts cannot apply to job listings.' });
      return;
    }
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
      setAuthToken(data.token || '');
      setBusinessForm({ ...emptyBusinessDetails, ...data.user.businessDetails });
      setAuthForm({ fullName: '', email: '', password: '', role: 'Veterinarian' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Unable to connect to the server.' });
      console.error(error);
    }
  };

  const handleJobSubmit = async (event) => {
    event.preventDefault();
    if (!currentUser || !authToken || currentUser.role !== 'Clinic Owner') {
      setStatusMessage({ type: 'error', text: 'Sign in as a clinic owner before posting a job.' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/jobs${editingJobId ? `/${encodeURIComponent(editingJobId)}` : ''}`, {
        method: editingJobId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ...jobForm, businessDetails: businessForm }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setCurrentUser(null);
          setAuthToken('');
        }
        setStatusMessage({ type: 'error', text: data.message || 'Unable to post job.' });
        return;
      }

      const newestJob = data.job;
      setJobs((prev) => editingJobId
        ? prev.map((job) => String(job._id || job.id) === editingJobId ? newestJob : job)
        : [newestJob, ...prev]);
      setEmployerJobs((prev) => editingJobId
        ? prev.map((job) => String(job._id || job.id) === editingJobId ? newestJob : job)
        : [newestJob, ...prev]);
      setSelectedJob(newestJob);
      setJobForm({
        title: '',
        clinic: '',
        location: '',
        opportunityType: 'Job', duration: '', eligibility: '', responsibilities: '', stipend: '', applicationDeadline: '', mentorshipDetails: '', learningObjectives: '', applicationInstructions: '', startDate: '', endDate: '', shiftDetails: '', latitude: '', longitude: '',
        type: 'Full Time',
        experienceLevel: '',
        workMode: '',
        pay: '',
        schedule: '',
        tags: '',
        description: '',
        requirements: '',
        salaryMin: '', salaryMax: '', currency: 'INR', payFrequency: '', benefits: '', accommodation: '', relocationAssistance: '',
      });
      setEditingJobId('');
      setStatusMessage({ type: 'success', text: editingJobId ? 'Job post updated.' : 'Job posted and added to the listings.' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Unable to post the job right now.' });
      console.error(error);
    }
  };

  const handleJobDelete = async (event) => {
    event.preventDefault();
    if (!currentUser || !authToken || !deletingJobId) return;

    try {
      const response = await fetch(`${API_URL}/api/jobs/${encodeURIComponent(deletingJobId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setCurrentUser(null);
          setAuthToken('');
        }
        setStatusMessage({ type: 'error', text: data.message || 'Unable to delete the job post.' });
        return;
      }

      const remainingJobs = jobs.filter((job) => String(job._id || job.id) !== deletingJobId);
      setJobs(remainingJobs);
      setEmployerJobs((previous) => previous.filter((job) => String(job._id || job.id) !== deletingJobId));
      if (selectedJob && String(selectedJob._id || selectedJob.id) === deletingJobId) {
        setSelectedJob(remainingJobs[0] || fallbackJobs[0]);
      }
      setDeletingJobId('');
      setStatusMessage({ type: 'success', text: 'Your job post was deleted.' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Unable to connect to the server.' });
      console.error(error);
    }
  };

  const handleEditJob = (job) => {
    const id = String(job._id || job.id);
    setEditingJobId(id);
    setJobForm({
      title: job.title || '', clinic: job.clinic || '', location: job.location || '', opportunityType: job.opportunityType || 'Job', duration: job.duration || '', eligibility: job.eligibility || '', responsibilities: job.responsibilities || '', stipend: job.stipend || '', applicationDeadline: job.applicationDeadline ? String(job.applicationDeadline).slice(0, 10) : '', mentorshipDetails: job.mentorshipDetails || '', learningObjectives: job.learningObjectives || '', applicationInstructions: job.applicationInstructions || '', startDate: job.startDate ? String(job.startDate).slice(0, 10) : '', endDate: job.endDate ? String(job.endDate).slice(0, 10) : '', shiftDetails: job.shiftDetails || '', latitude: job.latitude ?? '', longitude: job.longitude ?? '', type: job.type || 'Full Time', experienceLevel: job.experienceLevel || '', workMode: job.workMode || '', pay: job.pay || '',
      salaryMin: job.salaryMin ?? '', salaryMax: job.salaryMax ?? '', currency: job.currency || 'INR', payFrequency: job.payFrequency || '',
      benefits: (job.benefits || []).join(', '), accommodation: job.accommodation || '', relocationAssistance: job.relocationAssistance || '',
      schedule: job.schedule || '', tags: (job.tags || []).join(', '), description: job.description || '', requirements: (job.requirements || []).join(', '),
    });
    document.getElementById('job-post')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleApplicationStatus = async (applicationId, status) => {
    setUpdatingApplicationId(applicationId);
    try {
      const response = await fetch(`${API_URL}/api/applications/${encodeURIComponent(applicationId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatusMessage({ type: 'error', text: data.message || 'Unable to update application status.' });
        return;
      }
      setApplicants((previous) => previous.map((application) => application.id === applicationId ? { ...application, status } : application));
    } catch {
      setStatusMessage({ type: 'error', text: 'Unable to update application status.' });
    } finally {
      setUpdatingApplicationId('');
    }
  };

  const handleResumeDownload = async (application) => {
    try {
      const response = await fetch(`${API_URL}/api/applications/${encodeURIComponent(application.id)}/resume`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setStatusMessage({ type: 'error', text: data.message || 'Unable to retrieve the resume.' });
        return;
      }
      const link = document.createElement('a');
      link.href = data.resumeData;
      link.download = String(data.resumeName || 'resume.pdf').replace(/[\\/]/g, '_');
      link.click();
    } catch {
      setStatusMessage({ type: 'error', text: 'Unable to retrieve the resume.' });
    }
  };

  const handleSaveJob = async (job) => {
    if (!authToken || !currentUser || currentUser.role === 'Clinic Owner') {
      setStatusMessage({ type: 'error', text: 'Sign in as a candidate to save jobs.' });
      return;
    }
    const id = String(job._id || job.id);
    const isSaved = savedJobs.some((saved) => String(saved.job?._id || saved.job?.id) === id);
    try {
      const response = await fetch(`${API_URL}/api/saved-jobs/${encodeURIComponent(id)}`, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setStatusMessage({ type: 'error', text: data.message || 'Unable to update saved jobs.' });
        return;
      }
      setSavedJobs((previous) => isSaved
        ? previous.filter((saved) => String(saved.job?._id || saved.job?.id) !== id)
        : [...previous, { job, savedAt: new Date().toISOString() }]);
    } catch {
      setStatusMessage({ type: 'error', text: 'Unable to update saved jobs.' });
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
      jobId: selectedJob._id || selectedJob.id,
    };

    try {
      const response = await fetch(`${API_URL}/api/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusMessage({ type: 'error', text: data.message || 'Application failed.' });
        return;
      }

      setApplicants((prev) => [data.application, ...prev]);
      setApplicationFormOpen(false);
      setStatusMessage({ type: 'success', text: 'Application submitted successfully.' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Unable to submit the application.' });
      console.error(error);
    }
  };

  const postAuthenticated = async (path, { method = 'POST', body } = {}) => {
    const response = await fetch(`${API_URL}${path}`, { method, headers: { Authorization: `Bearer ${authToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to complete this request.');
    return data;
  };

  const handleJobAlertSubmit = async (event) => {
    event.preventDefault();
    try { const data = await postAuthenticated('/api/job-alerts', { body: alertForm }); setJobAlerts((items) => [data.alert, ...items]); setAlertForm({ keywords: '', location: '', specialization: '', type: '', minSalary: '', maxSalary: '', currency: 'INR', frequency: 'Instant' }); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleAlertToggle = async (alert) => {
    try {
      const data = await postAuthenticated(`/api/job-alerts/${encodeURIComponent(alert.id)}`, { method: 'PATCH', body: { active: !alert.active } });
      setJobAlerts((items) => items.map((item) => item.id === alert.id ? { ...item, active: data.alert.active } : item));
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleDeleteAlert = async (alertId) => {
    try { await postAuthenticated(`/api/job-alerts/${encodeURIComponent(alertId)}`, { method: 'DELETE' }); setJobAlerts((items) => items.filter((item) => String(item.id) !== String(alertId))); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleMentorProfileSave = async (event) => {
    event.preventDefault();
    try {
      const data = await postAuthenticated('/api/mentors/me', { method: 'PUT', body: { ...mentorForm, topics: mentorForm.topics.split(',').map((value) => value.trim()).filter(Boolean), methods: mentorForm.methods.split(',').map((value) => value.trim()).filter(Boolean) } });
      setCurrentUser((user) => ({ ...user, isMentor: data.mentor.isMentor, mentorshipTopics: data.mentor.topics, mentorshipAvailability: data.mentor.availability, mentorshipMethods: data.mentor.methods }));
      setMentors((items) => items.filter((item) => item.id !== data.mentor.id)); if (data.mentor.isMentor) setMentors((items) => [{ ...currentUser, id: data.mentor.id, topics: data.mentor.topics, availability: data.mentor.availability, methods: data.mentor.methods }, ...items]);
      setStatusMessage({ type: 'success', text: data.mentor.isMentor ? 'Mentor profile saved.' : 'Mentor profile disabled.' });
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleMentorshipRequest = async (mentor, topic) => {
    const goal = window.prompt(`What would you like to learn about ${topic}?`); if (!goal) return;
    try { const data = await postAuthenticated('/api/mentorship-requests', { body: { mentorId: mentor.id, topic, goal } }); setMentorshipRequests((items) => [{ ...data.request, mentor: { id: mentor.id, fullName: mentor.fullName }, isMentor: false }, ...items]); setStatusMessage({ type: 'success', text: 'Mentorship request sent.' }); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleMentorshipResponse = async (request, status) => {
    try { const data = await postAuthenticated(`/api/mentorship-requests/${encodeURIComponent(request.id)}`, { method: 'PATCH', body: { status } }); setMentorshipRequests((items) => items.map((item) => item.id === request.id ? { ...item, status: data.request.status } : item)); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleResumeSave = async (event) => {
    event.preventDefault();
    const parseRows = (text, kind) => text.split('\n').map((line) => line.split('|').map((part) => part.trim())).filter((parts) => parts.some(Boolean)).map((parts) => kind === 'education'
      ? ({ qualification: parts[0] || '', institution: parts[1] || '', startYear: parts[2]?.split('-')[0] || '', endYear: parts[2]?.split('-')[1] || '', details: parts.slice(3).join(' | ') })
      : ({ title: parts[0] || '', employer: parts[1] || '', location: parts[2] || '', startDate: parts[3]?.split(' to ')[0] || '', endDate: parts[3]?.split(' to ')[1] || '', details: parts.slice(4).join(' | ') }));
    try {
      const data = await postAuthenticated('/api/resume-builder', { method: 'PUT', body: { template: resumeForm.template, summary: resumeForm.summary, qualifications: resumeForm.qualifications, education: parseRows(resumeForm.educationText, 'education'), experience: parseRows(resumeForm.experienceText, 'experience'), skills: resumeForm.skills, certifications: resumeForm.certifications } });
      setStatusMessage({ type: 'success', text: `Resume saved with ${data.resume.template} template.` });
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const parseResumeLines = (text, kind) => text.split('\n').map((line) => line.split('|').map((part) => part.trim())).filter((parts) => parts.some(Boolean)).map((parts) => kind === 'education'
    ? ({ qualification: parts[0] || '', institution: parts[1] || '', startYear: parts[2]?.split('-')[0] || '', endYear: parts[2]?.split('-')[1] || '', details: parts.slice(3).join(' | ') })
    : ({ title: parts[0] || '', employer: parts[1] || '', location: parts[2] || '', startDate: parts[3]?.split(' to ')[0] || '', endDate: parts[3]?.split(' to ')[1] || '', details: parts.slice(4).join(' | ') }));

  const handleAiJobMatches = async () => {
    try { const data = await postAuthenticated('/api/ai/job-matches', { body: { consent: aiConsent } }); setAiMatches(data.matches || []); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleAiResumeSuggestions = async () => {
    const resume = { template: resumeForm.template, summary: resumeForm.summary, qualifications: resumeForm.qualifications, education: parseResumeLines(resumeForm.educationText, 'education'), experience: parseResumeLines(resumeForm.experienceText, 'experience'), skills: resumeForm.skills, certifications: resumeForm.certifications };
    try { const data = await postAuthenticated('/api/ai/resume-suggestions', { body: { consent: aiConsent, resume } }); setResumeAISuggestions(data.suggestions || ''); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleAiInterviewFeedback = async (question) => {
    try {
      const data = await postAuthenticated('/api/ai/interview-feedback', { body: { consent: aiConsent, questionId: question.id, answer: practiceAnswers[question.id]?.answer || '', specialization: practiceSpecialty } });
      setInterviewFeedback((previous) => ({ ...previous, [question.id]: data.feedback }));
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handlePrintResume = () => {
    const safe = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    const rows = (text) => text.split('\n').filter((line) => line.trim()).map((line) => `<p>${safe(line).replace(/\|/g, ' · ')}</p>`).join('');
    const popup = window.open('', '_blank', 'width=850,height=900');
    if (!popup) { setStatusMessage({ type: 'error', text: 'Allow pop-ups to preview and print your resume.' }); return; }
    popup.document.write(`<!doctype html><html><head><title>${safe(currentUser.fullName)} resume</title><style>body{font:15px Arial,sans-serif;max-width:760px;margin:48px auto;color:#18343b;line-height:1.5}h1{margin-bottom:4px}h2{border-bottom:1px solid #9bb4b8;padding-bottom:4px;margin-top:28px}p{white-space:pre-wrap}body.classic{font-family:Georgia,serif}body.compact{font-size:12px;line-height:1.3}body.compact h2{margin-top:16px}@media print{body{margin:20px}}</style></head><body class="${resumeForm.template}"><h1>${safe(currentUser.fullName)}</h1><p>${safe(currentUser.email)} · ${safe(currentUser.phone)} · ${safe(currentUser.location)}</p><h2>Professional Summary</h2><p>${safe(resumeForm.summary)}</p><h2>Qualifications</h2><p>${safe(resumeForm.qualifications)}</p><h2>Education</h2>${rows(resumeForm.educationText)}<h2>Experience</h2>${rows(resumeForm.experienceText)}<h2>Skills</h2><p>${safe(resumeForm.skills)}</p><h2>Certifications</h2><p>${safe(resumeForm.certifications)}</p><script>window.onload=()=>window.print()<\\/script></body></html>`);
    popup.document.close();
  };

  const handlePracticeSave = async () => {
    const answers = practiceQuestions.map((question) => ({ questionId: question.id, answer: practiceAnswers[question.id]?.answer || '', selfRating: practiceAnswers[question.id]?.selfRating || null }));
    try { await postAuthenticated('/api/interview-prep/progress', { method: 'PUT', body: { specialization: practiceSpecialty, answers } }); setStatusMessage({ type: 'success', text: 'Practice progress saved.' }); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleCareerGoalSubmit = async (event) => {
    event.preventDefault();
    try { const data = await postAuthenticated('/api/career-goals', { body: { ...careerGoalForm, milestones: careerGoalForm.milestones.split('\n').map((item) => item.trim()).filter(Boolean) } }); setCareerGoals((items) => [data.goal, ...items]); setCareerGoalForm({ title: '', description: '', targetDate: '', milestones: '' }); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleCareerMilestone = async (goal, milestoneIndex, completed) => {
    try { const data = await postAuthenticated(`/api/career-goals/${encodeURIComponent(goal.id)}`, { method: 'PATCH', body: { milestoneIndex, completed } }); setCareerGoals((items) => items.map((item) => item.id === goal.id ? { ...item, milestones: data.goal.milestones } : item)); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleDeleteCareerGoal = async (goalId) => {
    try { await postAuthenticated(`/api/career-goals/${encodeURIComponent(goalId)}`, { method: 'DELETE' }); setCareerGoals((items) => items.filter((item) => item.id !== goalId)); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleSaveResource = async (resource) => {
    const isSaved = savedResources.some((item) => String(item.resource?.id) === String(resource.id));
    try {
      await postAuthenticated(`/api/saved-resources/${encodeURIComponent(resource.id)}`, { method: isSaved ? 'DELETE' : 'POST' });
      setSavedResources((items) => isSaved ? items.filter((item) => String(item.resource?.id) !== String(resource.id)) : [...items, { resource, savedAt: new Date().toISOString() }]);
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleLearningResourceSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = editingResourceId
        ? await postAuthenticated(`/api/learning-resources/${encodeURIComponent(editingResourceId)}`, { method: 'PATCH', body: resourceForm })
        : await postAuthenticated('/api/learning-resources', { body: resourceForm });
      setLearningResources((items) => editingResourceId ? items.map((item) => item.id === editingResourceId ? data.resource : item) : [data.resource, ...items]);
      setResourceForm({ title: '', category: '', summary: '', url: '', tags: '' }); setEditingResourceId('');
    }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleResourceEdit = (resource) => {
    setEditingResourceId(resource.id);
    setResourceForm({ title: resource.title, category: resource.category, summary: resource.summary, url: resource.url, tags: (resource.tags || []).join(', ') });
    document.getElementById('resource-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleResourcePublish = async (resource, published) => {
    try { await postAuthenticated(`/api/learning-resources/${encodeURIComponent(resource.id)}`, { method: 'PATCH', body: { published } }); setLearningResources((items) => items.map((item) => item.id === resource.id ? { ...item, published } : item)); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleResourceDelete = async (resourceId) => {
    try { await postAuthenticated(`/api/learning-resources/${encodeURIComponent(resourceId)}`, { method: 'DELETE' }); setLearningResources((items) => items.filter((item) => item.id !== resourceId)); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleMessageApplicant = async (application) => {
    const message = window.prompt(`Message ${currentUser?.role === 'Clinic Owner' ? application.name : 'the clinic'} about ${application.jobTitle}:`);
    if (!message?.trim()) return;
    try {
      await postAuthenticated('/api/conversations', { body: { applicationId: application.id, message } });
      const response = await fetch(`${API_URL}/api/conversations`, { headers: { Authorization: `Bearer ${authToken}` } }); const data = await response.json();
      setMessageThreads(data.conversations || []); setStatusMessage({ type: 'success', text: 'Message sent.' });
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleOpenConversation = async (thread) => {
    const id = String(thread.id);
    if (expandedConversationId === id) { setExpandedConversationId(''); return; }
    try {
      const response = await fetch(`${API_URL}/api/conversations/${encodeURIComponent(id)}/messages?limit=30`, { headers: { Authorization: `Bearer ${authToken}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load the conversation.');
      await postAuthenticated(`/api/conversations/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
      setConversationHistory((history) => ({ ...history, [id]: { messages: data.messages || [], hasMore: data.hasMore, nextBefore: data.nextBefore } }));
      setMessageThreads((items) => items.map((item) => String(item.id) === id ? { ...item, unreadCount: 0 } : item));
      setExpandedConversationId(id);
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleLoadOlderMessages = async (thread) => {
    const id = String(thread.id); const history = conversationHistory[id];
    if (!history?.hasMore || !history.nextBefore) return;
    try {
      const query = new URLSearchParams({ limit: '30', before: history.nextBefore });
      const response = await fetch(`${API_URL}/api/conversations/${encodeURIComponent(id)}/messages?${query}`, { headers: { Authorization: `Bearer ${authToken}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load older messages.');
      setConversationHistory((items) => ({ ...items, [id]: { messages: [...(data.messages || []), ...(items[id]?.messages || [])], hasMore: data.hasMore, nextBefore: data.nextBefore } }));
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleInterviewInvite = async (application) => {
    const localTime = window.prompt('Interview date and time (YYYY-MM-DDTHH:mm):');
    if (!localTime) return;
    try {
      const data = await postAuthenticated(`/api/applications/${encodeURIComponent(application.id)}/interviews`, { body: { startsAt: new Date(localTime).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', mode: 'Video', durationMinutes: 30 } });
      setInterviews((items) => [...items, data.interview]); setStatusMessage({ type: 'success', text: 'Interview invitation sent.' });
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleInterviewResponse = async (interview, response) => {
    try { const data = await postAuthenticated(`/api/interviews/${encodeURIComponent(interview._id || interview.id)}/response`, { method: 'PATCH', body: { response } }); setInterviews((items) => items.map((item) => String(item._id || item.id) === String(interview._id || interview.id) ? data.interview : item)); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleChangeInterview = async (interview, cancel = false) => {
    let body = { status: 'Cancelled' };
    if (!cancel) {
      const localTime = window.prompt('New interview date and time (YYYY-MM-DDTHH:mm):'); if (!localTime) return;
      const date = new Date(localTime); if (!Number.isFinite(date.getTime())) { setStatusMessage({ type: 'error', text: 'Enter a valid date and time.' }); return; }
      body = { startsAt: date.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || interview.timeZone || 'UTC', mode: interview.mode, locationOrLink: interview.locationOrLink || '' };
    }
    try { const data = await postAuthenticated(`/api/interviews/${encodeURIComponent(interview._id || interview.id)}`, { method: 'PATCH', body }); setInterviews((items) => items.map((item) => String(item._id || item.id) === String(interview._id || interview.id) ? data.interview : item)); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleReview = async (application) => {
    const rawRating = window.prompt('Rate the clinic from 1 to 5:'); if (!rawRating) return;
    const text = window.prompt('Share at least 10 characters about your experience:'); if (!text) return;
    try { await postAuthenticated(`/api/applications/${encodeURIComponent(application.id)}/reviews`, { body: { rating: Number(rawRating), text } }); setStatusMessage({ type: 'success', text: 'Your clinic review was published.' }); }
    catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleLoadClinicReviews = async (clinic) => {
    const clinicId = String(clinic.clinicId);
    if (clinicReviewsById[clinicId]) { setClinicReviewsById((previous) => ({ ...previous, [clinicId]: null })); return; }
    try {
      const response = await fetch(`${API_URL}/api/clinics/${encodeURIComponent(clinicId)}/reviews`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load clinic reviews.');
      setClinicReviewsById((previous) => ({ ...previous, [clinicId]: data }));
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleReportClinicReview = async (review) => {
    if (!authToken) { setStatusMessage({ type: 'error', text: 'Sign in to report a clinic review.' }); return; }
    const reason = window.prompt('Why should a moderator review this feedback?');
    if (!reason) return;
    try {
      await postAuthenticated(`/api/reviews/${encodeURIComponent(review.id || review._id)}/report`, { body: { reason } });
      setStatusMessage({ type: 'success', text: 'The review was sent to the moderation queue.' });
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleVerificationUpload = async (event) => {
    event.preventDefault(); const file = verificationState.file; if (!file) return;
    try {
      const documentData = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const data = await postAuthenticated('/api/verification-requests', { body: { documentName: file.name, documentData } }); setVerificationState((previous) => ({ ...previous, request: data.request })); setStatusMessage({ type: 'success', text: 'Verification documents submitted for review.' });
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleVerificationDecision = async (request, status) => {
    const reviewNote = status === 'Rejected' ? window.prompt('Reason for rejecting this verification request:') : '';
    if (status === 'Rejected' && (!reviewNote || reviewNote.trim().length < 5)) return;
    try {
      const data = await postAuthenticated(`/api/verification-requests/${encodeURIComponent(request.id)}/review`, { method: 'PATCH', body: { status, reviewNote } });
      setVerificationQueue((items) => items.map((item) => item.id === request.id ? { ...item, ...data.request } : item));
      setStatusMessage({ type: 'success', text: `Verification ${status.toLowerCase()}.` });
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleAdminUserToggle = async (user) => {
    try {
      const data = await postAuthenticated(`/api/admin/users/${encodeURIComponent(user.id)}/status`, { method: 'PATCH', body: { active: !user.active } });
      setAdminUsers((items) => items.map((item) => item.id === user.id ? { ...item, active: data.user.active } : item));
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleAdminJobModeration = async (job) => {
    const status = job.status === 'Hidden' ? 'Published' : 'Hidden';
    const moderationNote = status === 'Hidden' ? window.prompt('Reason for hiding this listing:') : '';
    if (status === 'Hidden' && (!moderationNote || moderationNote.trim().length < 5)) return;
    try {
      const data = await postAuthenticated(`/api/admin/jobs/${encodeURIComponent(job.id || job._id)}/moderate`, { method: 'PATCH', body: { status, moderationNote } });
      setAdminJobs((items) => items.map((item) => String(item.id || item._id) === String(job.id || job._id) ? { ...item, status: data.job.status, moderationNote: data.job.moderationNote } : item));
    } catch (error) { setStatusMessage({ type: 'error', text: error.message }); }
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome === 'accepted') setInstallPrompt(null);
  };

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">V</div>
          <div>
            <p className="brand-name">VetRelief</p>
            <span className="brand-subtitle">Staffing Portal</span>
          </div>
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#jobs">Jobs</a>
          {currentUser && currentUser.role !== 'Clinic Owner' && <a href="#saved-jobs">Saved jobs</a>}
          <a href="#about">About</a>
          <a href="#clinics">Clinics</a>
        </nav>

        <div className="nav-actions">
          {installPrompt && !appInstalled && <button className="btn btn-secondary" type="button" onClick={handleInstallApp}>Install app</button>}
          {currentUser ? (
            <>
              <Link className="btn btn-secondary" to="/profile">Profile</Link>
              <button className="btn btn-secondary" onClick={() => { setCurrentUser(null); setAuthToken(''); }}>Sign out</button>
            </>
          ) : (
            <a className="btn btn-secondary" href="#about">Log in</a>
          )}
          {currentUser?.role === 'Clinic Owner' && <a className="btn btn-primary" href="#job-post">Post a Job</a>}
        </div>
      </header>

      <main id="main-content" tabIndex="-1">
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
              <div><strong>{jobs.length}</strong><span>Open jobs</span></div>
              <div><strong>{clinicProfiles.length}</strong><span>Clinic profiles</span></div>
              <div><strong>{averageClinicRating}/5</strong><span>Clinic rating</span></div>
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
              <h4>{selectedJob?.title || 'No live listings yet'}</h4>
              {selectedJob && <p>{selectedJob.location} • {selectedJob.schedule}</p>}
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
                onClick={() => { setActiveFilter(filter); setJobPage(1); }}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="job-search-controls">
            <input name="keyword" value={jobFilters.keyword} onChange={handleJobFilterChange} placeholder="Search roles, clinics, or skills" aria-label="Search jobs" />
            <input name="location" value={jobFilters.location} onChange={handleJobFilterChange} placeholder="Location" aria-label="Filter by location" />
            <input name="specialization" value={jobFilters.specialization} onChange={handleJobFilterChange} placeholder="Specialty" aria-label="Filter by veterinary specialty" />
            <select name="type" value={jobFilters.type} onChange={handleJobFilterChange} aria-label="Employment type">
              <option value="">All employment types</option>
              <option>Full Time</option><option>Part Time</option><option>Contract</option><option>Temporary</option><option>Internship</option>
            </select>
            <select name="opportunityType" value={jobFilters.opportunityType} onChange={handleJobFilterChange} aria-label="Opportunity category"><option value="">All opportunity categories</option><option value="Internship">Internship</option><option value="Externship">Externship</option><option value="Locum">Locum</option><option value="Relief">Relief</option><option value="Job">Permanent jobs</option></select>
            <input name="minSalary" type="number" min="0" value={jobFilters.minSalary} onChange={handleJobFilterChange} placeholder="Min salary" aria-label="Minimum salary" />
            <input name="maxSalary" type="number" min="0" value={jobFilters.maxSalary} onChange={handleJobFilterChange} placeholder="Max salary" aria-label="Maximum salary" />
            <select name="currency" value={jobFilters.currency} onChange={handleJobFilterChange} aria-label="Salary currency"><option value="">Any salary currency</option><option>INR</option><option>USD</option><option>GBP</option><option>EUR</option></select>
            <select name="experienceLevel" value={jobFilters.experienceLevel} onChange={handleJobFilterChange} aria-label="Experience level"><option value="">Any experience</option><option>Entry level</option><option>1-3 years</option><option>3-5 years</option><option>5+ years</option></select>
            <select name="workMode" value={jobFilters.workMode} onChange={handleJobFilterChange} aria-label="Work mode"><option value="">Any work mode</option><option>On-site</option><option>Remote</option><option>Hybrid</option><option>Flexible</option></select>
            <select name="postedWithinDays" value={jobFilters.postedWithinDays} onChange={handleJobFilterChange} aria-label="Recently posted"><option value="">Any date</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>
            <select name="sort" value={jobFilters.sort} onChange={handleJobFilterChange} aria-label="Sort jobs">
              <option value="relevance">Relevance</option><option value="date">Newest</option><option value="salary-asc">Salary: low to high</option><option value="salary-desc">Salary: high to low</option>
            </select>
            <label className="inline-checkbox"><input type="checkbox" checked={jobFilters.verifiedOnly === 'true'} onChange={(event) => { setJobFilters((filters) => ({ ...filters, verifiedOnly: event.target.checked ? 'true' : '' })); setJobPage(1); }} /> Verified clinics only</label>
          </div>
          <div className="map-view-controls"><p className="map-fallback-note">Map view uses OpenStreetMap. Listings without coordinates remain available in the list.</p><button type="button" className="btn btn-secondary small" aria-pressed={mapViewEnabled} onClick={() => setMapViewEnabled((enabled) => !enabled)}>{mapViewEnabled ? 'Hide map' : 'Map and list view'}</button></div>

          {mapViewEnabled && mapJob && <div className="job-map-frame"><iframe title={`Map location for ${mapJob.title} at ${mapJob.clinic}`} loading="lazy" referrerPolicy="no-referrer" src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(mapJob.longitude) - 0.08}%2C${Number(mapJob.latitude) - 0.05}%2C${Number(mapJob.longitude) + 0.08}%2C${Number(mapJob.latitude) + 0.05}&layer=mapnik&marker=${mapJob.latitude}%2C${mapJob.longitude}`} /><p>Showing the selected listing: <strong>{mapJob.title}</strong> · {mapJob.location}</p><div className="map-list-picker" aria-label="Choose a job marker">{mappableJobs.map((job) => <button type="button" className="btn btn-secondary small" key={job._id || job.id || job.title} onClick={() => setSelectedJob(job)}>{job.title} · {job.location}</button>)}</div></div>}
          {mapViewEnabled && !mapJob && <p className="empty-state">No matching jobs have map coordinates. Add a location filter or switch back to the list.</p>}

          {jobsLoading && <p className="empty-state" role="status">Loading live listings…</p>}
          <div className="job-grid">
            {visibleJobs.map((job) => (
              <article key={`${job._id || job.id || job.title}-${job.clinic}`} className="job-card">
                <div className="job-top">
                  <div>
                    <p className="job-type">{job.opportunityType && job.opportunityType !== 'Job' ? job.opportunityType : job.type}</p>
                    <h3>{job.title}</h3>
                  </div>
                  <span className="badge">New</span>
                </div>

                <p className="clinic-name">{job.clinic}</p>
                {(job.duration || job.stipend || job.applicationDeadline || job.shiftDetails) && <p className="opportunity-details">{[job.duration, job.stipend && `Stipend: ${job.stipend}`, job.applicationDeadline && `Apply by ${new Date(job.applicationDeadline).toLocaleDateString()}`, job.shiftDetails].filter(Boolean).join(' · ')}</p>}

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
                    <strong>{formatJobPay(job)}</strong>
                  </div>
                  <div className="job-card-actions">
                    {currentUser?.role !== 'Clinic Owner' && <button className="btn btn-secondary small" type="button" onClick={() => handleSaveJob(job)}>
                      {savedJobs.some((saved) => String(saved.job?._id || saved.job?.id) === String(job._id || job.id)) ? 'Saved' : 'Save job'}
                    </button>}
                    <button className="btn btn-primary small" onClick={() => handleApplyNow(job)}>Apply now</button>
                  </div>
                </div>
                {job.latitude != null && job.longitude != null && <p><a href={`https://www.openstreetmap.org/?mlat=${job.latitude}&mlon=${job.longitude}#map=13/${job.latitude}/${job.longitude}`} target="_blank" rel="noreferrer">Open location map</a> <button type="button" className="text-button" onClick={() => setSelectedJob(job)}>Show this listing on map</button></p>}
                {(job.benefits?.length > 0 || job.accommodation || job.relocationAssistance) && <div className="job-benefits">
                  {job.benefits?.length > 0 && <p><strong>Benefits:</strong> {job.benefits.join(' · ')}</p>}
                  {job.accommodation && <p><strong>Accommodation:</strong> {job.accommodation}</p>}
                  {job.relocationAssistance && <p><strong>Relocation:</strong> {job.relocationAssistance}</p>}
                </div>}
              </article>
            ))}
            {!jobsLoading && visibleJobs.length === 0 && <p className="empty-state">No jobs match this filter.</p>}
          </div>
          <div className="pagination-controls" aria-label="Job search pages">
            <button className="btn btn-secondary small" type="button" disabled={jobPage <= 1} onClick={() => setJobPage((page) => Math.max(1, page - 1))}>Previous</button>
            <span>Page {jobPage} of {jobPages}</span>
            <button className="btn btn-secondary small" type="button" disabled={jobPage >= jobPages} onClick={() => setJobPage((page) => Math.min(jobPages, page + 1))}>Next</button>
          </div>
        </section>

        {currentUser && currentUser.role !== 'Clinic Owner' && <section id="saved-jobs" className="jobs-section saved-jobs-section">
          <div className="section-header"><div><p className="eyebrow">Your shortlist</p><h2>Saved jobs</h2></div><span>{savedJobs.length} saved</span></div>
          <div className="job-grid">
            {savedJobs.map((saved) => saved.job ? <article className="job-card" key={String(saved.job._id || saved.job.id)}>
              <p className="job-type">{saved.job.type}</p><h3>{saved.job.title}</h3><p className="clinic-name">{saved.job.clinic}</p>
              <div className="meta-row"><span>{saved.job.location}</span><span>{formatJobPay(saved.job)}</span></div>
              <div className="job-card-actions"><button className="btn btn-primary small" type="button" onClick={() => handleApplyNow(saved.job)}>Apply now</button><button className="btn btn-secondary small" type="button" onClick={() => handleSaveJob(saved.job)}>Remove saved job</button></div>
            </article> : <article className="job-card unavailable-job" key={saved.id}><h3>Saved opportunity unavailable</h3><p>This job has been removed or closed.</p></article>)}
            {savedJobs.length === 0 && <p className="empty-state">Save a job to keep it here.</p>}
          </div>
        </section>}

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
                  aria-label="Full name"
                  value={authForm.fullName}
                  onChange={handleAuthChange}
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email address"
                aria-label="Email address"
                value={authForm.email}
                onChange={handleAuthChange}
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                aria-label="Password"
                value={authForm.password}
                onChange={handleAuthChange}
              />

              {authMode === 'signup' && (
                <select name="role" value={authForm.role} onChange={handleAuthChange}>
                  <option value="Veterinarian">Veterinarian</option>
                  <option value="Vet Tech">Vet Tech</option>
                  <option value="Veterinary Student">Veterinary Student</option>
                  <option value="Clinic Owner">Clinic Owner</option>
                </select>
              )}

              <button type="submit" className="btn btn-primary form-btn">
                {authMode === 'login' ? 'Log in' : 'Create account'}
              </button>
              {authMode === 'login' && <Link className="text-link forgot-link" to="/profile#recovery">Forgot password?</Link>}
            </form>
          </div>

          {selectedJob ? <div className="detail-panel">
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
                <strong>{formatJobPay(selectedJob)}</strong>
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
          </div> : <div className="detail-panel empty-state"><p>No live veterinary listings are available yet. Check back after a clinic publishes an opportunity.</p></div>}
        </section>

        {currentUser?.role === 'Veterinary Student' && <section className="dashboard-section student-career-dashboard">
          <div className="section-header dashboard-header"><div><p className="eyebrow">Student career dashboard</p><h2>Build your veterinary career</h2></div><span>{Math.round(([currentUser.professionalSummary, currentUser.qualifications, currentUser.location, currentUser.resumeName, currentUser.specializations?.length, currentUser.skills?.length].filter(Boolean).length / 6) * 100)}% profile completion</span></div>
          <div className="stats-grid"><div className="stat-card"><p>Applications</p><strong>{applicants.length}</strong></div><div className="stat-card"><p>Saved opportunities</p><strong>{savedJobs.length}</strong></div><div className="stat-card"><p>Internships</p><strong>{studentInternships.length}</strong></div><div className="stat-card"><p>Externships</p><strong>{studentExternships.length}</strong></div></div>
          {[['Recommended internships', studentInternships], ['Recommended externships', studentExternships], ['Entry-level opportunities', studentEntryJobs]].map(([heading, opportunities]) => <div className="applicant-panel" key={heading}><h3>{heading}</h3><div className="job-grid">{opportunities.map((job) => <article className="job-card" key={job._id || job.id}><p className="job-type">{job.opportunityType}</p><h4>{job.title}</h4><p>{job.clinic} · {job.location}</p><p>{job.duration || job.schedule} · {job.stipend || formatJobPay(job)}</p><button className="btn btn-primary small" type="button" onClick={() => handleApplyNow(job)}>Apply now</button></article>)}{opportunities.length === 0 && <p className="empty-state">No matching opportunities are listed yet.</p>}</div></div>)}
        </section>}

        {currentUser && currentUser.role !== 'Clinic Owner' && <section className="dashboard-section mentorship-section">
          <div className="section-header dashboard-header"><div><p className="eyebrow">Mentorship</p><h2>Learn from veterinary professionals</h2></div></div>
          {currentUser.role !== 'Veterinary Student' && <form className="applicant-panel" onSubmit={handleMentorProfileSave}><h3>{currentUser.isMentor ? 'Your mentor profile' : 'Offer mentorship'}</h3><label><input type="checkbox" checked={mentorForm.isMentor} onChange={(event) => setMentorForm((form) => ({ ...form, isMentor: event.target.checked }))} /> I am available to mentor</label>{mentorForm.isMentor && <><label>Mentorship topics<input value={mentorForm.topics} onChange={(event) => setMentorForm((form) => ({ ...form, topics: event.target.value }))} placeholder="Surgery, emergency practice" /></label><label>Availability<input value={mentorForm.availability} onChange={(event) => setMentorForm((form) => ({ ...form, availability: event.target.value }))} placeholder="Two evenings per month" /></label><label>Methods<input value={mentorForm.methods} onChange={(event) => setMentorForm((form) => ({ ...form, methods: event.target.value }))} placeholder="Video call, Messaging" /></label></>}<button className="btn btn-primary small" type="submit">Save mentor profile</button></form>}
          <div className="job-grid">{mentors.map((mentor) => <article className="clinic-profile-card" key={mentor.id}><div><h3>{mentor.fullName} {mentor.isVerified && <span className="status-btn">Verified</span>}</h3><p>{mentor.role} · {mentor.experienceYears ?? 'Experience not listed'} years</p><p>{mentor.professionalSummary}</p><p><strong>Topics:</strong> {mentor.topics.join(', ')}</p><p><strong>Availability:</strong> {mentor.availability}</p><p><strong>Methods:</strong> {mentor.methods.join(', ')}</p>{currentUser.role !== 'Clinic Owner' && mentor.id !== (currentUser.id || currentUser._id) && mentor.topics.map((topic) => <button key={topic} className="btn btn-secondary small" type="button" onClick={() => handleMentorshipRequest(mentor, topic)}>Request: {topic}</button>)}</div></article>)}{mentors.length === 0 && <p className="empty-state">No mentors have listed availability yet.</p>}</div>
          {mentorshipRequests.length > 0 && <div className="applicant-panel"><h3>Mentorship requests</h3>{mentorshipRequests.map((request) => <article className="applicant-item" key={request.id}><span>{request.isMentor ? `${request.mentee?.fullName || 'Candidate'} requested` : `Request to ${request.mentor?.fullName || 'mentor'}`} · {request.topic} · {request.status}<br />{request.goal}</span>{request.isMentor && request.status === 'Pending' && <span><button className="btn btn-secondary small" type="button" onClick={() => handleMentorshipResponse(request, 'Accepted')}>Accept</button><button className="btn btn-secondary small" type="button" onClick={() => handleMentorshipResponse(request, 'Rejected')}>Decline</button></span>}</article>)}</div>}
        </section>}

        {currentUser && currentUser.role !== 'Clinic Owner' && <section className="dashboard-section career-tools-section">
          <div className="section-header dashboard-header"><div><p className="eyebrow">Career development</p><h2>Tools for your next step</h2></div></div>
          <div className="applicant-panel ai-provider-panel"><h3>Optional AI assistance</h3><p>{aiConfigured ? 'AI is configured. You choose when to send selected profile, resume, or practice details for a one-time suggestion; contact details are excluded.' : 'OpenAI is not configured on the backend. Profile-based matches, resume editing, and the question bank remain available.'}</p><label><input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} /> I consent to sending selected information to OpenAI for a one-time suggestion. Standard API data-retention controls apply.</label></div>
          <div className="applicant-panel ai-provider-panel"><h3>AI-assisted job matches</h3><p>AI suggestions are separate from profile-based recommendations and do not confirm licensing, eligibility, or job suitability.</p><button className="btn btn-secondary small" type="button" disabled={!aiConfigured || !aiConsent} onClick={handleAiJobMatches}>Generate AI job matches</button>{aiMatches.length > 0 && <div className="job-grid">{aiMatches.map((item) => <article className="job-card" key={item.job._id || item.job.id}><p className="job-type">{item.matchScore}% AI suggestion</p><h4>{item.job.title}</h4><p>{item.job.clinic} · {item.job.location}</p><ul>{item.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><button className="btn btn-primary small" type="button" onClick={() => handleApplyNow(item.job)}>View and apply</button></article>)}</div>}</div>
          <div className="applicant-panel"><h3>Recommended opportunities</h3><p>Profile-based recommendations compare only the details you provided and remain available as a fallback.</p><div className="job-grid">{recommendations.map((item) => <article className="job-card" key={item.job._id || item.job.id}><p className="job-type">{item.matchScore == null ? 'Add profile details for a match score' : `${item.matchScore}% profile match`}</p><h4>{item.job.title}</h4><p>{item.job.clinic} · {item.job.location}</p><ul>{item.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><button className="btn btn-primary small" type="button" onClick={() => handleApplyNow(item.job)}>View and apply</button></article>)}{recommendations.length === 0 && <p className="empty-state">No recommendations yet. Add specializations, skills, experience, and location preferences to your profile.</p>}</div></div>

          <div className="dashboard-grid">
            <form className="applicant-panel resume-builder" onSubmit={handleResumeSave}><h3>Resume builder</h3><p>Use only qualifications and experience you can verify. Export from the preview using your browser’s Print / Save as PDF dialog.</p><label>Template<select value={resumeForm.template} onChange={(event) => setResumeForm((form) => ({ ...form, template: event.target.value }))}><option value="modern">Modern</option><option value="classic">Classic</option><option value="compact">Compact</option></select></label><label>Professional summary<textarea value={resumeForm.summary} onChange={(event) => setResumeForm((form) => ({ ...form, summary: event.target.value }))} rows="4" /></label><label>Qualifications<textarea value={resumeForm.qualifications} onChange={(event) => setResumeForm((form) => ({ ...form, qualifications: event.target.value }))} rows="3" /></label><label>Education, one per line: Qualification | Institution | Start-End year | Details<textarea value={resumeForm.educationText} onChange={(event) => setResumeForm((form) => ({ ...form, educationText: event.target.value }))} rows="4" /></label><label>Experience, one per line: Title | Employer | Location | Start date to End date | Details<textarea value={resumeForm.experienceText} onChange={(event) => setResumeForm((form) => ({ ...form, experienceText: event.target.value }))} rows="5" /></label><label>Skills<input value={resumeForm.skills} onChange={(event) => setResumeForm((form) => ({ ...form, skills: event.target.value }))} /></label><label>Certifications<input value={resumeForm.certifications} onChange={(event) => setResumeForm((form) => ({ ...form, certifications: event.target.value }))} /></label><div className="application-actions"><button className="btn btn-primary small" type="submit">Save resume</button><button className="btn btn-secondary small" type="button" onClick={handlePrintResume}>Preview / export PDF</button></div></form>
            <div className="applicant-panel"><h3>Interview practice</h3><p>Question-bank fallback prompts, not generated answers or clinical advice. Practice and assess your own responses.</p><label>Specialization<input value={practiceSpecialty} onChange={(event) => setPracticeSpecialty(event.target.value)} placeholder="Optional focus area" /></label>{practiceQuestions.map((question) => <article key={question.id}><strong>{question.category}</strong><p>{question.question}</p><textarea aria-label={`Answer: ${question.question}`} value={practiceAnswers[question.id]?.answer || ''} onChange={(event) => setPracticeAnswers((answers) => ({ ...answers, [question.id]: { ...answers[question.id], questionId: question.id, answer: event.target.value } }))} rows="3" /><label>Self-rating<select value={practiceAnswers[question.id]?.selfRating || ''} onChange={(event) => setPracticeAnswers((answers) => ({ ...answers, [question.id]: { ...answers[question.id], questionId: question.id, selfRating: event.target.value } }))}><option value="">Not rated</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label></article>)}<button className="btn btn-primary small" type="button" onClick={handlePracticeSave}>Save practice progress</button></div>
          </div>

          <div className="applicant-panel ai-provider-panel"><h3>Resume improvement suggestions</h3><p>Suggestions use only the resume details you provided and do not edit your resume automatically.</p><button className="btn btn-secondary small" type="button" disabled={!aiConfigured || !aiConsent} onClick={handleAiResumeSuggestions}>Get AI resume feedback</button>{resumeAISuggestions && <><p className="ai-generated-output">{resumeAISuggestions}</p><button className="btn btn-secondary small" type="button" onClick={() => { setResumeForm((form) => ({ ...form, summary: resumeAISuggestions })); setStatusMessage({ type: 'success', text: 'Suggestion copied to the editable summary. Review and save it when ready.' }); }}>Use as editable summary draft</button></>}</div>
          <div className="applicant-panel ai-provider-panel"><h3>Interview answer feedback</h3><label>Question<select value={selectedFeedbackQuestionId} onChange={(event) => setSelectedFeedbackQuestionId(event.target.value)}>{practiceQuestions.map((question) => <option key={question.id} value={question.id}>{question.category}: {question.question}</option>)}</select></label><button className="btn btn-secondary small" type="button" disabled={!aiConfigured || !aiConsent || !selectedFeedbackQuestionId || !practiceAnswers[selectedFeedbackQuestionId]?.answer?.trim()} onClick={() => handleAiInterviewFeedback(practiceQuestions.find((question) => question.id === selectedFeedbackQuestionId))}>Get AI practice feedback</button>{interviewFeedback[selectedFeedbackQuestionId] && <p className="ai-generated-output">{interviewFeedback[selectedFeedbackQuestionId]}</p>}</div>
          <div className="applicant-panel career-goals"><h3>Career path planner</h3><form className="application-form-grid" onSubmit={handleCareerGoalSubmit}><label>Career goal<input required value={careerGoalForm.title} onChange={(event) => setCareerGoalForm((form) => ({ ...form, title: event.target.value }))} placeholder="Build experience in emergency practice" /></label><label>Target date<input type="date" value={careerGoalForm.targetDate} onChange={(event) => setCareerGoalForm((form) => ({ ...form, targetDate: event.target.value }))} /></label><label>Description<textarea value={careerGoalForm.description} onChange={(event) => setCareerGoalForm((form) => ({ ...form, description: event.target.value }))} /></label><label>Milestones, one per line<textarea value={careerGoalForm.milestones} onChange={(event) => setCareerGoalForm((form) => ({ ...form, milestones: event.target.value }))} /></label><button className="btn btn-primary small" type="submit">Add goal</button></form>{careerGoals.map((goal) => <article className="applicant-item" key={goal.id}><div><strong>{goal.title}</strong><p>{goal.description} {goal.targetDate && `· Target ${new Date(goal.targetDate).toLocaleDateString()}`}</p>{goal.milestones.map((milestone, index) => <label key={`${goal.id}-${index}`}><input type="checkbox" checked={milestone.completed} onChange={(event) => handleCareerMilestone(goal, index, event.target.checked)} />{milestone.title}</label>)}</div><button className="btn btn-secondary small" type="button" onClick={() => handleDeleteCareerGoal(goal.id)}>Delete</button></article>)}{careerGoals.length === 0 && <p className="empty-state">Set a professional development goal and track your milestones.</p>}</div>
        </section>}

        <section className="dashboard-section learning-hub-section">
          <div className="section-header dashboard-header"><div><p className="eyebrow">Learning and resources</p><h2>Veterinary career resource hub</h2></div>{currentUser && currentUser.role !== 'Clinic Owner' && <span>{savedResources.length} saved resources</span>}</div>
          <div className="job-search-controls"><input value={resourceFilters.search} onChange={(event) => setResourceFilters((filters) => ({ ...filters, search: event.target.value }))} placeholder="Search resource title, topic, or summary" aria-label="Search resources" /><input value={resourceFilters.category} onChange={(event) => setResourceFilters((filters) => ({ ...filters, category: event.target.value }))} placeholder="Filter by category" aria-label="Filter resources by category" /></div>
          <div className="job-grid">{learningResources.filter((resource) => currentUser?.role === 'Admin' || resource.published !== false).map((resource) => <article className="job-card" key={resource.id}><p className="job-type">{resource.category}{currentUser?.role === 'Admin' && ` · ${resource.published ? 'Published' : 'Hidden'}`}</p><h3>{resource.title}</h3><p>{resource.summary}</p><div className="tags">{(resource.tags || []).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><div className="job-card-actions"><a className="btn btn-secondary small" href={resource.url} target="_blank" rel="noreferrer">Open resource</a>{currentUser && currentUser.role !== 'Clinic Owner' && <button className="btn btn-secondary small" type="button" onClick={() => handleSaveResource(resource)}>{savedResources.some((item) => String(item.resource?.id) === String(resource.id)) ? 'Remove saved' : 'Save resource'}</button>}{currentUser?.role === 'Admin' && <><button className="btn btn-secondary small" type="button" onClick={() => handleResourceEdit(resource)}>Edit</button><button className="btn btn-secondary small" type="button" onClick={() => handleResourcePublish(resource, !resource.published)}>{resource.published ? 'Hide' : 'Publish'}</button><button className="btn btn-secondary small" type="button" onClick={() => handleResourceDelete(resource.id)}>Delete</button></>}</div></article>)}{learningResources.length === 0 && <p className="empty-state">Resources will appear here when an administrator publishes them.</p>}</div>
          {currentUser && currentUser.role !== 'Clinic Owner' && savedResources.length > 0 && <div className="applicant-panel"><h3>Your saved resources</h3>{savedResources.map((item) => <p key={item.id}><a href={item.resource.url} target="_blank" rel="noreferrer">{item.resource.title}</a> · {item.resource.category} <button className="btn btn-secondary small" type="button" onClick={() => handleSaveResource(item.resource)}>Remove</button></p>)}</div>}
          {currentUser?.role === 'Admin' && <form id="resource-editor" className="applicant-panel" onSubmit={handleLearningResourceSubmit}><h3>{editingResourceId ? 'Edit learning resource' : 'Publish a learning resource'}</h3><div className="job-form-grid"><input required placeholder="Title" value={resourceForm.title} onChange={(event) => setResourceForm((form) => ({ ...form, title: event.target.value }))} /><input required placeholder="Category" value={resourceForm.category} onChange={(event) => setResourceForm((form) => ({ ...form, category: event.target.value }))} /><input required type="url" placeholder="https:// resource URL" value={resourceForm.url} onChange={(event) => setResourceForm((form) => ({ ...form, url: event.target.value }))} /><input placeholder="Tags, comma separated" value={resourceForm.tags} onChange={(event) => setResourceForm((form) => ({ ...form, tags: event.target.value }))} /></div><textarea required placeholder="Short summary" value={resourceForm.summary} onChange={(event) => setResourceForm((form) => ({ ...form, summary: event.target.value }))} /><button className="btn btn-primary small" type="submit">{editingResourceId ? 'Save changes' : 'Publish resource'}</button>{editingResourceId && <button className="btn btn-secondary small" type="button" onClick={() => { setEditingResourceId(''); setResourceForm({ title: '', category: '', summary: '', url: '', tags: '' }); }}>Cancel edit</button>}</form>}
        </section>

        {currentUser && <section className="dashboard-section phase-two-tools" aria-label="Alerts and communications">
          <div className="section-header dashboard-header"><div><p className="eyebrow">Stay connected</p><h2>Alerts and conversations</h2></div><span>{notificationItems.filter((item) => !item.readAt).length} unread notifications</span></div>
          {currentUser.role !== 'Clinic Owner' && <div className="applicant-panel">
            <h3>Job alerts</h3>
            <form className="application-form-grid" onSubmit={handleJobAlertSubmit}>
              <label>Keywords<input value={alertForm.keywords} onChange={(e) => setAlertForm((p) => ({ ...p, keywords: e.target.value }))} placeholder="Emergency, surgery" /></label>
              <label>Location<input value={alertForm.location} onChange={(e) => setAlertForm((p) => ({ ...p, location: e.target.value }))} placeholder="Bengaluru" /></label>
              <label>Specialty<input value={alertForm.specialization} onChange={(e) => setAlertForm((p) => ({ ...p, specialization: e.target.value }))} /></label>
              <label>Employment type<input value={alertForm.type} onChange={(e) => setAlertForm((p) => ({ ...p, type: e.target.value }))} placeholder="Full Time" /></label>
              <label>Minimum salary<input type="number" min="0" value={alertForm.minSalary} onChange={(e) => setAlertForm((p) => ({ ...p, minSalary: e.target.value }))} /></label>
              <label>Maximum salary<input type="number" min="0" value={alertForm.maxSalary} onChange={(e) => setAlertForm((p) => ({ ...p, maxSalary: e.target.value }))} /></label>
              <label>Salary currency<select value={alertForm.currency} onChange={(e) => setAlertForm((p) => ({ ...p, currency: e.target.value }))}><option>INR</option><option>USD</option><option>GBP</option><option>EUR</option></select></label>
              <label>Notification frequency<select value={alertForm.frequency} onChange={(e) => setAlertForm((p) => ({ ...p, frequency: e.target.value }))}><option>Instant</option><option>Daily</option><option>Weekly</option></select></label>
              <button className="btn btn-primary small" type="submit">Create alert</button>
            </form>
            {jobAlerts.map((alert) => <p key={alert.id}>{[alert.keywords, alert.location, alert.specialization, alert.type, alert.minSalary != null || alert.maxSalary != null ? `${alert.currency || 'INR'} ${alert.minSalary ?? 'Any'}–${alert.maxSalary ?? 'Any'}` : '', alert.frequency].filter(Boolean).join(' · ')} · {alert.active ? 'Active' : 'Paused'} <button className="btn btn-secondary small" type="button" onClick={() => handleAlertToggle(alert)}>{alert.active ? 'Pause' : 'Resume'}</button> <button className="btn btn-secondary small" type="button" onClick={() => handleDeleteAlert(alert.id)}>Remove</button></p>)}
          </div>}
          <div className="dashboard-grid">
            <div className="applicant-panel"><h3>Notifications</h3><ul>{notificationItems.slice(0, 8).map((item) => <li className="applicant-item" key={item.id}><span>{item.message}</span>{!item.readAt && <button className="btn btn-secondary small" type="button" onClick={async () => { try { await postAuthenticated(`/api/notifications/${encodeURIComponent(item.id)}/read`, { method: 'PATCH' }); setNotificationItems((items) => items.map((n) => n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)); } catch (error) { setStatusMessage({ type: 'error', text: error.message }); } }}>Mark read</button>}</li>)}{notificationItems.length === 0 && <li className="empty-state">No notifications yet.</li>}</ul></div>
            <div className="applicant-panel"><h3>Interviews</h3><ul>{interviews.map((interview) => <li className="applicant-item" key={interview._id || interview.id}><span>{new Date(interview.startsAt).toLocaleString(undefined, { timeZone: interview.timeZone || 'UTC' })} ({interview.timeZone || 'UTC'}) · {interview.mode} · {interview.status || 'Scheduled'} · {interview.candidateResponse || 'Pending'}</span>{currentUser.role !== 'Clinic Owner' && interview.candidateResponse === 'Pending' && <span><button className="btn btn-secondary small" type="button" onClick={() => handleInterviewResponse(interview, 'Confirmed')}>Confirm</button> <button className="btn btn-secondary small" type="button" onClick={() => handleInterviewResponse(interview, 'Declined')}>Decline</button></span>}{currentUser.role === 'Clinic Owner' && interview.status !== 'Cancelled' && <span><button className="btn btn-secondary small" type="button" onClick={() => handleChangeInterview(interview)}>Reschedule</button> <button className="btn btn-secondary small" type="button" onClick={() => handleChangeInterview(interview, true)}>Cancel</button></span>}</li>)}{interviews.length === 0 && <li className="empty-state">No interview invitations yet.</li>}</ul></div>
          </div>
          <div className="applicant-panel"><h3>Messages</h3>{messageThreads.map((thread) => { const id = String(thread.id); const history = conversationHistory[id]; return <article key={id}><p><strong>Application conversation</strong>{thread.unreadCount > 0 && <span className="status-btn"> {thread.unreadCount} unread</span>}</p>{thread.lastMessage && <p className="message-preview">{String(thread.lastMessage.senderId?._id || thread.lastMessage.senderId) === String(currentUser.id || currentUser._id) ? 'You' : 'Participant'}: {thread.lastMessage.body} · {new Date(thread.lastMessage.createdAt).toLocaleString()}</p>}<div className="application-actions"><button className="btn btn-secondary small" type="button" onClick={() => handleOpenConversation(thread)}>{expandedConversationId === id ? 'Hide history' : 'Open history'}</button>{thread.applicationId && <button className="btn btn-secondary small" type="button" onClick={() => handleMessageApplicant({ id: thread.applicationId, jobTitle: 'application' })}>Reply</button>}</div>{expandedConversationId === id && <div className="conversation-history">{history?.hasMore && <button className="text-button" type="button" onClick={() => handleLoadOlderMessages(thread)}>Load older messages</button>}{(history?.messages || []).map((message, index) => <p key={message._id || `${message.senderId}-${index}`}><strong>{String(message.senderId?._id || message.senderId) === String(currentUser.id || currentUser._id) ? 'You' : 'Participant'}:</strong> {message.body}<br /><small>{new Date(message.createdAt).toLocaleString()}{message.readAt && String(message.senderId?._id || message.senderId) === String(currentUser.id || currentUser._id) ? ' · Read' : ''}</small></p>)}</div>}</article>; })}{messageThreads.length === 0 && <p className="empty-state">Start a conversation from an application.</p>}</div>
          <div className="applicant-panel"><h3>Profile verification</h3>
            <p>{verificationState.request ? `Request status: ${verificationState.request.status}` : currentUser.isVerified ? 'Your profile is verified.' : 'Submit a license or clinic registration document for review.'}</p>
            {verificationState.request?.createdAt && <p>Submitted {new Date(verificationState.request.createdAt).toLocaleDateString()}{verificationState.request.reviewedAt ? ` · reviewed ${new Date(verificationState.request.reviewedAt).toLocaleDateString()}` : ''}</p>}
            {verificationState.request?.reviewNote && <p><strong>Reviewer note:</strong> {verificationState.request.reviewNote}</p>}
            {verificationState.request?.status === 'Rejected' && <button type="button" className="btn btn-secondary small" onClick={() => setVerificationState({ file: null, request: null })}>Submit updated documents</button>}
            {!verificationState.request && !currentUser.isVerified && <form onSubmit={handleVerificationUpload}><label>Verification document (PDF or image, max 2 MB)<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(event) => setVerificationState((previous) => ({ ...previous, file: event.target.files?.[0] || null }))} /></label><button className="btn btn-primary small" type="submit" disabled={!verificationState.file}>Submit for review</button></form>}
          </div>
          {currentUser.role === 'Admin' && <div className="admin-workspace">
            <div className="dashboard-grid">
            <div className="applicant-panel"><h3>Verification review queue</h3>{verificationQueue.map((request) => <article key={request.id}><p>{request.user?.fullName} · {request.kind} · {request.documentName} · {request.status}</p>{request.reviewNote && <p><strong>Review note:</strong> {request.reviewNote}</p>}{request.reviewedAt && <p>Reviewed {new Date(request.reviewedAt).toLocaleDateString()}{request.reviewer?.fullName ? ` by ${request.reviewer.fullName}` : ''}</p>}<button className="btn btn-secondary small" type="button" onClick={async () => { const response = await fetch(`${API_URL}/api/verification-requests/${encodeURIComponent(request.id)}/document`, { headers: { Authorization: `Bearer ${authToken}` } }); const file = await response.json(); if (response.ok) { const link = document.createElement('a'); link.href = file.documentData; link.download = file.documentName; link.click(); } }}>{request.status === 'Pending' ? 'Download private document' : 'Download reviewed document'}</button>{request.status === 'Pending' && ['Approved', 'Rejected'].map((status) => <button className="btn btn-secondary small" type="button" key={status} onClick={() => handleVerificationDecision(request, status)}>{status}</button>)}</article>)}{verificationQueue.length === 0 && <p className="empty-state">No verification requests.</p>}</div>
            <div className="applicant-panel"><h3>Reported clinic reviews</h3>{reviewQueue.map((review) => <article key={review.id}><p>{review.clinic} · {review.rating}/5 · {review.reports?.length || 0} reports</p><p>{review.text}</p>{['Published', 'Hidden'].map((status) => <button className="btn btn-secondary small" key={status} type="button" onClick={async () => { try { await postAuthenticated(`/api/reviews/${encodeURIComponent(review.id)}/moderate`, { method: 'PATCH', body: { status } }); setReviewQueue((items) => items.map((item) => item.id === review.id ? { ...item, status } : item)); } catch (error) { setStatusMessage({ type: 'error', text: error.message }); } }}>{status}</button>)}</article>)}{reviewQueue.length === 0 && <p className="empty-state">No reported reviews.</p>}</div>
          </div>
          <div className="stats-grid admin-overview">{[['Users', adminOverview?.users], ['Jobs', adminOverview?.jobs], ['Applications', adminOverview?.applications], ['Pending verification', adminOverview?.pendingVerifications], ['Reported reviews', adminOverview?.reportedReviews]].map(([label, value]) => <div className="stat-card" key={label}><p>{label}</p><strong>{value ?? '—'}</strong></div>)}</div>
          <div className="dashboard-grid">
            <div className="applicant-panel"><h3>Platform users</h3><input aria-label="Search platform users" placeholder="Search name, email, or role" value={adminUserSearch} onChange={(event) => setAdminUserSearch(event.target.value)} />{adminUsers.map((item) => <article className="applicant-item" key={item.id}><span><strong>{item.fullName}</strong> · {item.email}<br />{item.role} · {item.active ? 'Active' : 'Disabled'}{item.isVerified ? ' · Verified' : ''}</span>{item.role !== 'Admin' && <button className="btn btn-secondary small" type="button" onClick={() => handleAdminUserToggle(item)}>{item.active ? 'Disable' : 'Enable'}</button>}</article>)}{adminUsers.length === 0 && <p className="empty-state">No users match this search.</p>}</div>
            <div className="applicant-panel"><h3>Job listing moderation</h3><input aria-label="Search platform listings" placeholder="Search title, clinic, or location" value={adminJobSearch} onChange={(event) => setAdminJobSearch(event.target.value)} />{adminJobs.map((job) => <article className="applicant-item" key={job.id || job._id}><span><strong>{job.title}</strong> · {job.clinic}<br />{job.location} · {job.status || 'Published'}{job.moderationNote ? ` · ${job.moderationNote}` : ''}</span><button className="btn btn-secondary small" type="button" onClick={() => handleAdminJobModeration(job)}>{job.status === 'Hidden' ? 'Republish' : 'Hide listing'}</button></article>)}{adminJobs.length === 0 && <p className="empty-state">No listings match this search.</p>}</div>
          </div>
          </div>}
        </section>}

        <section id="clinics" className="dashboard-section">
          <div className="section-header dashboard-header">
            <div>
              <p className="eyebrow">Clinic dashboard</p>
              <h2>Hiring overview</h2>
            </div>
            {currentUser?.role === 'Clinic Owner' ? <a className="btn btn-secondary" href="#job-post">Manage jobs</a> : <a className="btn btn-secondary" href="#clinic-directory">Browse clinics</a>}
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <p>Open roles</p>
              <strong>{myJobs.length}</strong>
            </div>
            <div className="stat-card">
              <p>Applications</p>
              <strong>{applicants.length}</strong>
            </div>
            <div className="stat-card">
              <p>Interviews</p>
              <strong>{applicants.filter((application) => application.status === 'Interview').length}</strong>
            </div>
            <div className="stat-card">
              <p>{currentUser?.role === 'Clinic Owner' ? 'New this week' : 'Selected'}</p>
              <strong>{currentUser?.role === 'Clinic Owner' ? recentApplicationCount : applicants.filter((application) => application.status === 'Selected').length}</strong>
            </div>
          </div>

          <div id="clinic-directory" className="clinic-directory">
            <div className="section-header"><div><p className="eyebrow">Employer profiles</p><h3>Veterinary clinics</h3></div><span>{clinicProfiles.length} profiles</span></div>
            <div className="clinic-directory-grid">
              {clinicProfiles.map((clinic) => <article className="clinic-profile-card" key={clinic.businessName}>
                {clinic.logoData ? <img src={clinic.logoData} alt={`${clinic.businessName} logo`} /> : <span className="clinic-profile-mark">{clinic.businessName.slice(0, 1).toUpperCase()}</span>}
                <div><h4>{clinic.businessName} {clinic.isVerified && <span className="status-btn">Verified</span>}</h4><p>{clinic.location || 'Location not listed'}</p>{clinic.averageRating != null && <p>★ {clinic.averageRating.toFixed(1)} · {clinic.reviewCount} reviews</p>}{clinic.description && <p>{clinic.description}</p>}
                  {clinic.specializations?.length > 0 && <p><strong>Specialties:</strong> {clinic.specializations.join(', ')}</p>}
                  {clinic.facilities?.length > 0 && <p><strong>Facilities:</strong> {clinic.facilities.join(', ')}</p>}
                  <p>{clinic.jobs.length} open {clinic.jobs.length === 1 ? 'role' : 'roles'}</p>
                  {clinic.jobs.length > 0 && <ul className="clinic-open-jobs">{clinic.jobs.slice(0, 3).map((job) => <li key={`${job.title}-${job.location}`}>{job.title} · {job.location}</li>)}</ul>}
                  <button className="btn btn-secondary small" type="button" onClick={() => handleLoadClinicReviews(clinic)}>{clinicReviewsById[String(clinic.clinicId)] ? 'Hide reviews' : 'Read reviews'}</button>
                  {clinicReviewsById[String(clinic.clinicId)] && <div className="clinic-review-list" aria-label={`Reviews for ${clinic.businessName}`}>
                    {clinicReviewsById[String(clinic.clinicId)].reviews?.map((review) => <article key={review.id || review._id}><p><strong>{review.rating}/5</strong> · {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Review'}</p><p>{review.text}</p><button className="text-button" type="button" onClick={() => handleReportClinicReview(review)}>Report review</button></article>)}
                    {clinicReviewsById[String(clinic.clinicId)].reviews?.length === 0 && <p>No published reviews yet.</p>}
                  </div>}
                  {clinic.contactEmail && <a href={`mailto:${clinic.contactEmail}`}>Contact clinic</a>}
                  {clinic.phone && <p><a href={`tel:${clinic.phone}`}>{clinic.phone}</a></p>}
                </div>
              </article>)}
              {clinicProfiles.length === 0 && <p className="empty-state">Clinic profiles will appear here when employers complete their business details.</p>}
            </div>
          </div>

          {currentUser?.role === 'Clinic Owner' && (
            <div className="my-jobs-panel">
              <div className="my-jobs-heading">
                <div><h3>Your job posts</h3><p>Edit or remove posts owned by this clinic account.</p></div>
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
                          <span>{job.clinic} · {job.location} · {formatJobPay(job)}</span>
                        </div>
                        {deletingJobId === jobId ? (
                          <form className="job-delete-confirm" onSubmit={handleJobDelete}>
                            <span>Delete this post?</span>
                            <button className="btn btn-danger small" type="submit">Confirm delete</button>
                            <button className="btn btn-secondary small" type="button" onClick={() => setDeletingJobId('')}>Cancel</button>
                          </form>
                        ) : (
                          <div className="my-job-actions">
                            <button className="btn btn-secondary small" type="button" onClick={() => handleEditJob(job)}>Edit post</button>
                            <button className="btn btn-danger small" type="button" onClick={() => setDeletingJobId(jobId)}>Delete post</button>
                          </div>
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
              <h3>{currentUser?.role === 'Clinic Owner' ? 'Applicants for your jobs' : 'Your application tracker'}</h3>
              {currentUser?.role === 'Clinic Owner' && <div className="candidate-filters">
                <label>Search candidates<input type="search" value={candidateSearch} onChange={(event) => setCandidateSearch(event.target.value)} placeholder="Name, role, skill, or listing" /></label>
                <label>Application status<select value={candidateStatusFilter} onChange={(event) => setCandidateStatusFilter(event.target.value)}><option value="">All statuses</option>{['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'].map((status) => <option key={status}>{status}</option>)}</select></label>
                <p aria-live="polite">Showing {filteredApplicants.length} of {applicants.length} applicants</p>
              </div>}
              <ul>
                {filteredApplicants.map((applicant) => (
                  <li key={applicant.id || `${applicant.name}-${applicant.role}`} className="applicant-item">
                    <div>
                      <strong>{currentUser?.role === 'Clinic Owner' ? applicant.name : applicant.role}</strong>
                      <span>{currentUser?.role === 'Clinic Owner' ? `${applicant.email || ''} · ${applicant.role}` : `${applicant.status} · ${applicant.createdAt ? new Date(applicant.createdAt).toLocaleDateString() : ''}`}</span>
                      {currentUser?.role === 'Clinic Owner' && applicant.candidateProfile && <small>{[applicant.candidateProfile.experienceYears != null ? `${applicant.candidateProfile.experienceYears} years` : '', ...(applicant.candidateProfile.specializations || [])].filter(Boolean).join(' · ')}</small>}
                      {currentUser?.role !== 'Clinic Owner' && applicant.statusHistory?.length > 0 && <small>{applicant.statusHistory.map((entry) => entry.status).join(' → ')}</small>}
                    </div>
                    {currentUser?.role === 'Clinic Owner' ? <div className="application-actions">
                      <select className="status-select" aria-label={`Update ${applicant.name}'s application status`} value={applicant.status} disabled={updatingApplicationId === applicant.id} onChange={(event) => handleApplicationStatus(applicant.id, event.target.value)}>
                        {['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'].map((status) => <option key={status}>{status}</option>)}
                      </select>
                      <button className="btn btn-secondary small" type="button" onClick={() => handleResumeDownload(applicant)}>Resume</button>
                      <button className="btn btn-secondary small" type="button" onClick={() => handleMessageApplicant(applicant)}>Message candidate</button>
                      <button className="btn btn-secondary small" type="button" onClick={() => handleInterviewInvite(applicant)}>Invite to interview</button>
                    </div> : <div className="application-actions"><span className="status-btn">{applicant.status}</span><button className="btn btn-secondary small" type="button" onClick={() => handleMessageApplicant(applicant)}>Message clinic</button>{['Selected', 'Rejected'].includes(applicant.status) && <button className="btn btn-secondary small" type="button" onClick={() => handleReview(applicant)}>Review clinic</button>}</div>}
                  </li>
                ))}
                {filteredApplicants.length === 0 && <li className="empty-state">{applicants.length === 0 ? 'No applications yet.' : 'No applicants match these filters.'}</li>}
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

          {currentUser?.role === 'Clinic Owner' && <div className="job-post-panel" id="job-post">
            <h3>{editingJobId ? 'Edit veterinary job' : 'Post a new veterinary job'}</h3>
            <form className="job-form" onSubmit={handleJobSubmit}>
              <div className="job-form-grid">
                <input name="title" placeholder="Job title" value={jobForm.title} onChange={handleJobChange} />
                <input name="clinic" placeholder="Clinic name" value={jobForm.clinic} onChange={handleJobChange} />
                <input name="location" placeholder="Location" value={jobForm.location} onChange={handleJobChange} />
                <select name="opportunityType" value={jobForm.opportunityType} onChange={handleJobChange}><option value="Job">Standard job</option><option value="Internship">Internship</option><option value="Externship">Externship</option><option value="Locum">Locum assignment</option><option value="Relief">Relief role</option></select>
                <select name="type" value={jobForm.type} onChange={handleJobChange}>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                </select>
                <select name="experienceLevel" value={jobForm.experienceLevel} onChange={handleJobChange}><option value="">Experience level</option><option>Entry level</option><option>1-3 years</option><option>3-5 years</option><option>5+ years</option></select>
                <select name="workMode" value={jobForm.workMode} onChange={handleJobChange}><option value="">Work mode</option><option>On-site</option><option>Remote</option><option>Hybrid</option><option>Flexible</option></select>
                <input name="salaryMin" type="number" min="0" placeholder="Minimum salary" value={jobForm.salaryMin} onChange={handleJobChange} />
                <input name="salaryMax" type="number" min="0" placeholder="Maximum salary" value={jobForm.salaryMax} onChange={handleJobChange} />
                <select name="currency" value={jobForm.currency} onChange={handleJobChange}><option value="INR">INR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select>
                <select name="payFrequency" value={jobForm.payFrequency} onChange={handleJobChange}><option value="">Pay frequency</option><option value="hour">Per hour</option><option value="day">Per day</option><option value="week">Per week</option><option value="month">Per month</option><option value="year">Per year</option></select>
                <input name="pay" placeholder="Other compensation details" value={jobForm.pay} onChange={handleJobChange} />
                <input name="schedule" placeholder="Schedule" value={jobForm.schedule} onChange={handleJobChange} />
              </div>
              <input name="tags" placeholder="Skills / tags (comma separated)" value={jobForm.tags} onChange={handleJobChange} />
              <textarea name="description" placeholder="Job description" value={jobForm.description} onChange={handleJobChange} />
              <input name="requirements" placeholder="Requirements (comma separated)" value={jobForm.requirements} onChange={handleJobChange} />
              <input name="benefits" placeholder="Benefits (comma separated)" value={jobForm.benefits} onChange={handleJobChange} />
              <input name="accommodation" placeholder="Accommodation offered (optional)" value={jobForm.accommodation} onChange={handleJobChange} />
              <input name="relocationAssistance" placeholder="Relocation assistance (optional)" value={jobForm.relocationAssistance} onChange={handleJobChange} />
              <div className="job-form-grid"><input name="latitude" type="number" min="-90" max="90" step="any" placeholder="Latitude (optional map location)" value={jobForm.latitude} onChange={handleJobChange} /><input name="longitude" type="number" min="-180" max="180" step="any" placeholder="Longitude (optional map location)" value={jobForm.longitude} onChange={handleJobChange} /></div>
              {jobForm.opportunityType !== 'Job' && <fieldset className="business-fields"><legend>{jobForm.opportunityType} details</legend>
                <div className="job-form-grid">
                  <input name="duration" placeholder="Duration (e.g. 8 weeks)" value={jobForm.duration} onChange={handleJobChange} />
                  <label>Start date<input name="startDate" type="date" value={jobForm.startDate} onChange={handleJobChange} /></label>
                  <label>End date<input name="endDate" type="date" value={jobForm.endDate} onChange={handleJobChange} /></label>
                  <label>Application deadline<input name="applicationDeadline" type="date" value={jobForm.applicationDeadline} onChange={handleJobChange} /></label>
                  <input name="stipend" placeholder="Stipend or compensation" value={jobForm.stipend} onChange={handleJobChange} />
                  <input name="shiftDetails" placeholder="Shift details" value={jobForm.shiftDetails} onChange={handleJobChange} />
                </div>
                {(jobForm.opportunityType === 'Internship' || jobForm.opportunityType === 'Externship') && <>
                  <textarea name="eligibility" placeholder="Eligibility and required qualifications" value={jobForm.eligibility} onChange={handleJobChange} />
                  <textarea name="responsibilities" placeholder="Responsibilities" value={jobForm.responsibilities} onChange={handleJobChange} />
                  <textarea name="learningObjectives" placeholder="Learning objectives" value={jobForm.learningObjectives} onChange={handleJobChange} />
                  <textarea name="mentorshipDetails" placeholder="Mentorship details" value={jobForm.mentorshipDetails} onChange={handleJobChange} />
                  <textarea name="applicationInstructions" placeholder="Application instructions" value={jobForm.applicationInstructions} onChange={handleJobChange} />
                </>}
              </fieldset>}
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
              <div className="job-form-actions"><button type="submit" className="btn btn-primary">{editingJobId ? 'Save job changes' : 'Publish job'}</button>{editingJobId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingJobId(''); setJobForm({ title: '', clinic: '', location: '', opportunityType: 'Job', duration: '', eligibility: '', responsibilities: '', stipend: '', applicationDeadline: '', mentorshipDetails: '', learningObjectives: '', applicationInstructions: '', startDate: '', endDate: '', shiftDetails: '', latitude: '', longitude: '', type: 'Full Time', experienceLevel: '', workMode: '', pay: '', salaryMin: '', salaryMax: '', currency: 'INR', payFrequency: '', benefits: '', accommodation: '', relocationAssistance: '', schedule: '', tags: '', description: '', requirements: '' }); }}>Cancel edit</button>}</div>
            </form>
          </div>}

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
