const normalized = (value) => String(value || '').trim().toLowerCase();

const jobText = (job) => normalized([
  job.title, job.clinic, job.description, job.location, ...(job.tags || []), ...(job.requirements || []),
].join(' '));

const scoreJob = (job, candidate, savedJobs = []) => {
  const availableWeight = { specialty: 25, savedInterest: 10, skills: 20, location: 15, experience: 15, salary: 10, employmentType: 10, qualificationTerms: 15 };
  let total = 0;
  let eligible = 0;
  const reasons = [];
  const text = jobText(job);

  const specialties = (candidate.specializations || []).map(normalized).filter(Boolean);
  if (specialties.length) {
    eligible += availableWeight.specialty;
    const matched = specialties.filter((specialty) => text.includes(specialty));
    if (matched.length) { total += availableWeight.specialty; reasons.push(`Matches your specialization: ${matched.slice(0, 3).join(', ')}`); }
  }

  const skills = (candidate.skills || []).map(normalized).filter(Boolean);
  if (skills.length) {
    eligible += availableWeight.skills;
    const matched = skills.filter((skill) => text.includes(skill));
    if (matched.length) { total += availableWeight.skills; reasons.push(`Uses skills from your profile: ${matched.slice(0, 3).join(', ')}`); }
  }

  const locations = (candidate.preferredLocations || []).map(normalized).filter(Boolean);
  if (locations.length) {
    eligible += availableWeight.location;
    if (locations.some((location) => normalized(job.location).includes(location))) { total += availableWeight.location; reasons.push('Location matches your preferred locations'); }
  }

  if (Number.isFinite(candidate.experienceYears) && candidate.experienceYears >= 0 && job.experienceLevel) {
    eligible += availableWeight.experience;
    const years = candidate.experienceYears;
    const matches = job.experienceLevel === 'Entry level' ? years <= 1
      : job.experienceLevel === '1-3 years' ? years >= 1 && years <= 3
        : job.experienceLevel === '3-5 years' ? years >= 3 && years <= 5
          : job.experienceLevel === '5+ years' ? years >= 5 : false;
    if (matches) { total += availableWeight.experience; reasons.push(`Experience level aligns with your ${years}-year profile`); }
  }

  const preferredTypes = (candidate.preferredEmploymentTypes || []).map(normalized).filter(Boolean);
  if (preferredTypes.length) {
    eligible += availableWeight.employmentType;
    const jobTypes = [job.type, job.opportunityType].map(normalized);
    if (preferredTypes.some((type) => jobTypes.includes(type))) {
      total += availableWeight.employmentType;
      reasons.push('Opportunity type matches your stated employment preferences');
    }
  }

  const candidateEvidence = normalized([candidate.qualifications, ...(candidate.certifications || [])].join(' '));
  const listedRequirements = (job.requirements || []).map((requirement) => normalized(requirement)).filter(Boolean);
  if (candidateEvidence && listedRequirements.length) {
    eligible += availableWeight.qualificationTerms;
    const mentioned = listedRequirements.filter((requirement) => candidateEvidence.includes(requirement));
    if (mentioned.length) {
      total += availableWeight.qualificationTerms;
      reasons.push(`Your profile mentions listed requirement terms (${mentioned.slice(0, 2).join('; ')}); verify licensing and eligibility with the employer`);
    }
  }

  const expectedMin = candidate.salaryExpectationMin;
  const expectedMax = candidate.salaryExpectationMax;
  if ((expectedMin != null || expectedMax != null) && (job.salaryMin != null || job.salaryMax != null)) {
    eligible += availableWeight.salary;
    const currencyMatches = normalized(candidate.salaryExpectationCurrency || 'INR') === normalized(job.currency || 'INR');
    const overlap = currencyMatches
      && (expectedMax == null || job.salaryMin == null || job.salaryMin <= expectedMax)
      && (job.salaryMax == null || expectedMin == null || job.salaryMax >= expectedMin);
    if (overlap) { total += availableWeight.salary; reasons.push('Listed compensation overlaps your salary expectations'); }
  }

  const jobTags = (job.tags || []).map(normalized).filter(Boolean);
  const savedTags = new Set(savedJobs.flatMap((savedJob) => (savedJob.tags || []).map(normalized)));
  if (savedTags.size) {
    eligible += availableWeight.savedInterest;
    if (jobTags.some((tag) => savedTags.has(tag))) { total += availableWeight.savedInterest; reasons.push('Shares a specialty tag with a job you saved'); }
  }
  return {
    score: eligible ? Math.round((total / eligible) * 100) : null,
    reasons: [
      ...reasons,
      ...(candidate.availability ? [`Availability listed on your profile: ${candidate.availability}; confirm dates with the employer`] : []),
      ...(reasons.length ? [] : ['No matching profile signals found yet']),
    ],
  };
};

module.exports = { scoreJob };
